# Tetra 🐟

A lightweight desktop app to create and run a local mock API.

---

## Features

* Create mock API routes (GET, POST, PUT, DELETE, PATCH)
* Customize status codes, headers and responses
* Add global or per-route delay
* Enable/disable CORS
* View request & response logs
* Start/stop the server from the UI
* Local config persistence

---

## Requirements

* Node.js
* pnpm → https://pnpm.io/fr/installation

---

## Getting started

Install dependencies:

```bash
pnpm install
```

Run the app:

```bash
pnpm start
```

---

## Usage

1. Open the app
2. Configure your server (port, CORS, etc.)
3. Add a route using the **+** button
4. Click **Start** to launch the server

Example:

* `GET /api/health`
* Response:

```json
{
  "status": "ok"
}
```

Test it:

```bash
curl http://localhost:3000/api/health
```

---

## 📦 Build (macOS)

```bash
pnpm dist
```

Then:

1. Open the generated `.dmg`
2. Drag **Tetra** to Applications
3. Launch the app

---

## 🛠 Scripts

```bash
pnpm start   # run app
pnpm dist    # build dmg
```

---

## Stack

* Electron
* React
* Express
* Tailwind
