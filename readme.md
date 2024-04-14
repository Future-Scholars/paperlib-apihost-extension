# Paperlib API Host Extension

This extension allows you to expose the Paperlib's API to other Apps. This is useful if you want to connect Paperlib to other Apps like Raycast, Alfred, etc.

## Usage

```
// HTTP GET

http://127.0.0.1:21227/[APIGroup].[service].[method]/?args=[..]

// For example
http://127.0.0.1:21227/PLAPI.paperService.load/?args=[""]
```

For more API details, please refer to the [API documentation](https://paperlib.app/en/extension-doc/plapi/).