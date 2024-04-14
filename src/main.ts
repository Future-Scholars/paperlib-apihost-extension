import { PLAPI, PLExtAPI, PLExtension } from "paperlib-api/api";

import { createServer, IncomingMessage, Server, ServerResponse } from "http";

class PaperlibAPIHostExtension extends PLExtension {
  private _httpServer?: Server;

  disposeCallbacks: (() => void)[];

  constructor() {
    super({
      id: "@future-scholars/paperlib-apihost-extension",
      defaultPreference: {
        port: {
          type: "string",
          name: "Port",
          description: "The port to listen to.",
          value: "21227",
          order: 0,
        },
      },
    });

    this.disposeCallbacks = [];
  }

  async initialize() {
    await PLExtAPI.extensionPreferenceService.register(
      this.id,
      this.defaultPreference,
    );

    try {
      this._httpServer = createServer((req, res) => {
        this._handler(req, res)
      });
      const port = parseInt(PLExtAPI.extensionPreferenceService.get(this.id, "port") as string)
      this._httpServer.listen(port, "127.0.0.1");
    } catch (e) {
      PLAPI.logService.error(
        "Failed to start Paperlib APIHost Extension server.",
        e as Error,
        true,
        "APIHostExt",
      );
    }

    this.disposeCallbacks.push(() => {
      this._httpServer?.close();
    });
  }

  async dispose() {
    for (const disposeCallback of this.disposeCallbacks) {
      disposeCallback();
    }
    PLExtAPI.extensionPreferenceService.unregister(this.id);
  }

  private async _handler(req: IncomingMessage, res: ServerResponse) {
    if (req.url === "/") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("Paperlib APIHost Extension is running.");
      return;
    } else if (req.url === "/favicon.ico") {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
      return;
    } else if (!req.url) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
      return;
    }

    const urlComponents = req.url.split("/").filter((c) => c);
    const rpcPath = urlComponents[0];
    const [APIGroup, serviceName, methodName] = rpcPath.split(".");

    if (!["PLAPI", "PLMainAPI", "PLExtAPI"].includes(APIGroup)) {
      PLAPI.logService.error(
        `APIGroup ${APIGroup} is not supported.`,
        "",
        true,
        "APIHostExt",
      );
    }

    let args = []
    if (req.url.includes("?args=")) {
      args = JSON.parse(decodeURIComponent(req.url.split("?args=")[1]))
    }

    try {
      const result = await globalThis[APIGroup][
        serviceName
      ][methodName](...args);
      if (result) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result));
      } else {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end(JSON.stringify({}));
      }
    } catch (e) {
      PLAPI.logService.error(
        `Failed to execute ${APIGroup}.${serviceName}.${methodName}`,
        e as Error,
        true,
        "APIHostExt",
      );
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal Server Error");
    }
  }

}

async function initialize() {
  const extension = new PaperlibAPIHostExtension();
  await extension.initialize();

  return extension;
}

export { initialize };
