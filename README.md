# 🐟 Tetra

A lightweight desktop application to create and run local mock APIs for development and testing.

---

## Features

* Define mock API routes (**GET, POST, PUT, DELETE, PATCH**)
* Configure **status codes, headers, and response bodies**
* Add **global or per-route latency**
* Enable or disable **CORS**
* Inspect **request and response logs**
* Control server lifecycle from the UI
* Persist configuration locally
* Support for multiple runtimes (**Node.js** and **Podman**)
* Ability to run **multiple runtimes simultaneously**
* Containerized execution via Podman (recommended)

---

## Requirements

* Node.js
* pnpm
* Podman (optional)

---

## Installation

```bash
pnpm install
```

---

## Running the application

```bash
pnpm start
```

---

## Usage

1. Launch the application
2. Configure server settings (port, CORS, etc.)
3. Select one or more runtimes
4. Create routes via the UI
5. Start the server

Multiple runtimes can be executed in parallel, provided they are configured to use different ports.

---

## Runtime Modes

Tetra provides two execution environments that can be used independently or concurrently.

### Node.js Runtime

Intended for fast local development without containerization.

Steps:

1. Open runtime settings
2. Select **Node.js runtime**
3. Start the server

---

### Podman Runtime (recommended)

Provides isolated and reproducible environments using containers.

#### Setup

Verify installation:

```bash
podman --version
```

On macOS (first-time setup):

```bash
podman machine init
podman machine start
```

Check environment status:

```bash
podman info
```

#### Usage

1. Open runtime settings
2. Select **Podman runtime**
3. Start the server

---

## Runtime Management

Runtimes can be started, stopped, or switched at any time.

When running multiple runtimes:

* Ensure each instance uses a distinct port
* Stop a runtime before reconfiguring it

---

## Example

Define a route:

* `GET /api/health`

Response:

```json
{
  "status": "ok"
}
```

Test:

```bash
curl http://localhost:3000/api/health
```

---

## Troubleshooting

### Podman issues

```bash
podman machine stop
podman machine start
```

Restart the application afterward.

### Port conflicts

Update the port in server settings and restart the runtime.

---

## Build (macOS)

```bash
pnpm dist
```

Steps:

1. Open the generated `.dmg`
2. Move the application to `/Applications`
3. Launch Tetra

---

## Scripts

```bash
pnpm start   # run application
pnpm dist    # build macOS package
```

---

## Technology Stack

* Electron
* React
* Express
* Tailwind CSS
