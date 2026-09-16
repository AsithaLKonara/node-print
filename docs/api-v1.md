# Node-Print Protocol (NPP) v1

This document outlines the v1 JSON communication protocol used between the `@asithakonara/node-print/client` SDK and the `node-print` bridge server.

## Overview
All requests and responses wrap payloads inside a standard JSON structure.

### Request Envelope
```json
{
  "version": 1,
  "requestId": "req_123",
  "action": "print", // or "printers.list", "jobs.get"
  "payload": { ... }
}
```

### Response Envelope
```json
{
  "version": 1,
  "requestId": "req_123",
  "data": { ... },
  "error": null
}
```

### Error Model
```json
{
  "code": "PRINTER_NOT_FOUND",
  "message": "The specified printer could not be found.",
  "details": {}
}
```

## Actions

### `printers.list`
Get all connected OS printers.

**Request Payload:** None
**Response Data:**
```json
{
  "printers": [
    {
      "id": "epson-tm-t20iii",
      "name": "EPSON TM-T20III",
      "status": "online",
      "type": "thermal",
      "connection": "usb",
      "isDefault": true
    }
  ]
}
```

### `print`
Submit a new print job.

**Request Payload (ESC/POS Example):**
```json
{
  "printer": "epson-tm-t20iii",
  "type": "escpos",
  "data": "..." // Base64 or string
}
```

**Request Payload (Routing Example):**
```json
{
  "route": "receipt",
  "type": "html",
  "html": "<div>...</div>"
}
```

**Response Data:**
```json
{
  "jobId": "job_123",
  "status": "queued"
}
```

### `jobs.get`
Fetch status of an existing print job.

**Request Payload:**
```json
{
  "jobId": "job_123"
}
```

**Response Data:**
```json
{
  "job": {
    "id": "job_123",
    "status": "completed",
    "createdAt": "2026-09-16T12:00:00Z",
    "updatedAt": "2026-09-16T12:00:05Z"
  }
}
```
