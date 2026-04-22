const express = require('express');
const cors = require('cors');
const net = require('net');
const { spawn } = require('child_process');

let serverInstance = null;
let podmanContainerName = null;
let podmanLogsProcess = null;

const PODMAN_IMAGE = 'docker.io/library/node:20-alpine';

function sanitizeHeader(value) {
  if (typeof value !== 'string') return '';
  // Remove CRLF to prevent HTTP response splitting
  return value.replace(/[\r\n]/g, '');
}

function stopServer() {
  return new Promise(async (resolve) => {
    if (serverInstance) {
      await new Promise(closeResolve => {
        serverInstance.close(() => {
          serverInstance = null;
          closeResolve(true);
        });
      });
    }

    if (podmanLogsProcess) {
      podmanLogsProcess.kill();
      podmanLogsProcess = null;
    }

    if (podmanContainerName) {
      try {
        await runPodmanCommand(['rm', '-f', podmanContainerName]);
      } catch (err) {
        // Best effort cleanup if container has already stopped.
      } finally {
        podmanContainerName = null;
      }
    }

    resolve(true);
  });
}

function followPodmanLogs(containerName, onLog) {
  if (podmanLogsProcess) {
    podmanLogsProcess.kill();
    podmanLogsProcess = null;
  }

  const child = spawn('podman', ['logs', '-f', containerName], {
    stdio: ['ignore', 'pipe', 'pipe']
  });

  const handleChunk = (chunk) => {
    const lines = chunk
      .toString()
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    lines.forEach((line) => {
      if (line.startsWith('REQ ')) {
        onLog('request', line.slice(4));
        return;
      }

      if (line.startsWith('RES ')) {
        onLog('response', line.slice(4));
        return;
      }

      if (line.startsWith('ERR ')) {
        onLog('error', line.slice(4));
        return;
      }

      onLog('info', `[podman] ${line}`);
    });
  };

  child.stdout.on('data', handleChunk);
  child.stderr.on('data', handleChunk);

  child.on('error', () => {
    onLog('error', 'Failed to follow Podman logs.');
  });

  child.on('close', () => {
    if (podmanLogsProcess === child) {
      podmanLogsProcess = null;
    }
  });

  podmanLogsProcess = child;
}

function startServer(port, settings, routes, onLog) {
  return new Promise((resolve, reject) => {
    // Basic validation
    if (typeof port !== 'number' || isNaN(port) || port <= 0 || port > 65535) {
      return reject(new Error('Invalid port number'));
    }
    if (!Array.isArray(routes)) {
      routes = [];
    }
    if (!settings || typeof settings !== 'object') {
      settings = {};
    }

    const runtime = settings.runtime === 'podman' ? 'podman' : 'local';

    const start = () => {
      onLog('info', `Starting server (${runtime}) on port ${port}...`);

      if (runtime === 'podman') {
        createPodmanServer(port, settings, routes, onLog, resolve, reject);
        return;
      }

      createExpressServer(port, settings, routes, onLog, resolve, reject);
    };

    if (serverInstance || podmanContainerName) {
      onLog('info', 'Stopping previous server instance...');
      stopServer()
        .then(async () => {
          onLog('info', 'Waiting for port to be released...');
          try {
            await waitForPortRelease(port, 8000, 200);
          } catch (err) {
            onLog('error', `Port release wait failed: ${err.message}`);
          }
          start();
        })
        .catch(reject);
    } else {
      start();
    }
  });
}

async function waitForPortRelease(port, timeoutMs = 8000, intervalMs = 200) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const available = await checkPortAvailability(port);
    if (available) {
      return true;
    }

    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  throw new Error(`Timed out waiting for port ${port} release`);
}

function createExpressServer(port, settings, routes, onLog, resolve, reject) {
  const expressApp = express();

  if (settings.corsEnabled) {
    const origin = typeof settings.corsOrigin === 'string' ? settings.corsOrigin : '*';
    expressApp.use(cors({ origin }));
  }

  expressApp.use(express.json({ limit: '10mb' }));
  expressApp.use(express.urlencoded({ extended: true, limit: '10mb' }));

  if (settings.logRequests) {
    expressApp.use((req, res, next) => {
      onLog('request', `${req.method} ${req.url}`);
      next();
    });
  }

  const delayMs = typeof settings.delay === 'number' && settings.delay >= 0 ? settings.delay : 0;
  if (delayMs > 0) {
    expressApp.use((req, res, next) => {
      setTimeout(next, delayMs);
    });
  }

  routes.forEach(route => {
    if (route && route.status === 'active' && route.method && route.path) {
      const method = String(route.method).toLowerCase();
      // Ensure method is supported by express
      if (!['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(method)) {
        return;
      }

      expressApp[method](route.path, (req, res) => {
        const sendResponse = () => {
          if (settings.logResponses) {
            onLog('response', `${route.statusCode} OK - (route: ${route.path})`);
          }

          if (route.headers && typeof route.headers === 'object') {
            Object.entries(route.headers).forEach(([key, value]) => {
              res.setHeader(sanitizeHeader(key), sanitizeHeader(String(value)));
            });
          }
          
          let responseBody = route.body || '{"status": "success"}';
          try {
            responseBody = JSON.parse(responseBody);
          } catch(e) {
            // Keep as string if it's not JSON
          }

          const statusCode = (typeof route.statusCode === 'number' && route.statusCode >= 100 && route.statusCode <= 599) 
            ? route.statusCode 
            : 200;

          res.status(statusCode).send(responseBody);
        };

        const routeDelay = typeof route.delay === 'number' && route.delay >= 0 ? route.delay : 0;
        if (routeDelay > 0) {
          setTimeout(sendResponse, routeDelay);
        } else {
          sendResponse();
        }
      });
    }
  });

  try {
    serverInstance = expressApp.listen(port, () => {
      onLog('info', `Server started on port ${port}`);
      resolve(true);
    });
    
    serverInstance.on('error', (err) => {
      onLog('error', `Server Error: ${err.message}`);
      reject(err);
    });
  } catch (err) {
    reject(err);
  }
}

function runPodmanCommand(args) {
  return new Promise((resolve, reject) => {
    const child = spawn('podman', args, {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', chunk => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', chunk => {
      stderr += chunk.toString();
    });

    child.on('error', () => {
      reject(new Error('Podman is not available. Please install Podman and ensure it is in PATH.'));
    });

    child.on('close', code => {
      if (code === 0) {
        resolve(stdout.trim());
        return;
      }

      reject(new Error(stderr.trim() || stdout.trim() || `podman exited with code ${code}`));
    });
  });
}

function buildPodmanServerScript() {
  return `
const http = require('http');

function sanitizeHeader(value) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\\r\\n]/g, '');
}

const port = Number(process.env.PORT || 3000);
const settings = JSON.parse(process.env.SETTINGS_JSON || '{}');
const routes = JSON.parse(process.env.ROUTES_JSON || '[]');

function parseBody(rawBody) {
  if (typeof rawBody !== 'string') {
    return rawBody;
  }

  try {
    return JSON.parse(rawBody);
  } catch (err) {
    return rawBody;
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', 'http://localhost');
  const pathname = url.pathname;
  const method = String(req.method || 'GET').toUpperCase();

  if (settings.logRequests) {
    console.log('REQ ' + method + ' ' + pathname);
  }

  if (settings.corsEnabled) {
    const corsOrigin = typeof settings.corsOrigin === 'string' ? settings.corsOrigin : '*';
    res.setHeader('Access-Control-Allow-Origin', corsOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  if (method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const route = routes.find(r => (
    r &&
    r.status === 'active' &&
    String(r.path || '') === pathname &&
    String(r.method || '').toUpperCase() === method
  ));

  if (!route) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: 'Route not found' }));
    return;
  }

  const writeResponse = () => {
    if (route.headers && typeof route.headers === 'object') {
      Object.entries(route.headers).forEach(([key, value]) => {
        res.setHeader(sanitizeHeader(String(key)), sanitizeHeader(String(value)));
      });
    }

    const statusCode = (
      typeof route.statusCode === 'number' &&
      route.statusCode >= 100 &&
      route.statusCode <= 599
    ) ? route.statusCode : 200;

    const body = parseBody(route.body || '{"status":"success"}');

    res.statusCode = statusCode;
    if (settings.logResponses) {
      const size = typeof body === 'string' ? body.length : JSON.stringify(body).length;
      console.log('RES ' + statusCode + ' ' + method + ' ' + pathname + ' (' + size + ' bytes)');
    }

    if (typeof body === 'string') {
      res.end(body);
      return;
    }

    if (!res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'application/json');
    }
    res.end(JSON.stringify(body));
  };

  const globalDelay = Number(settings.delay) >= 0 ? Number(settings.delay) : 0;
  const routeDelay = Number(route.delay) >= 0 ? Number(route.delay) : 0;
  const totalDelay = globalDelay + routeDelay;

  if (totalDelay > 0) {
    setTimeout(writeResponse, totalDelay);
  } else {
    writeResponse();
  }
});

server.listen(port, '0.0.0.0');
`;
}

function createPodmanServer(port, settings, routes, onLog, resolve, reject) {
  const containerName = `tetra-mock-${port}-${Date.now()}`;
  const script = buildPodmanServerScript();

  const args = [
    'run',
    '-d',
    '--rm',
    '--name',
    containerName,
    '-p',
    `${port}:${port}`,
    '-e',
    `PORT=${port}`,
    '-e',
    `SETTINGS_JSON=${JSON.stringify(settings || {})}`,
    '-e',
    `ROUTES_JSON=${JSON.stringify(routes || [])}`,
    PODMAN_IMAGE,
    'node',
    '-e',
    script,
  ];

  runPodmanCommand(args)
    .then(() => {
      podmanContainerName = containerName;
      onLog('info', `Server started with Podman on port ${port}`);
      followPodmanLogs(containerName, onLog);
      resolve(true);
    })
    .catch(err => {
      reject(new Error(`Failed to start Podman server: ${err.message}`));
    });
}

function checkPortAvailability(port) {
  return new Promise((resolve) => {
    if (typeof port !== 'number' || isNaN(port) || port <= 0 || port > 65535) {
      return resolve(false);
    }
    const server = net.createServer();
    
    server.on('error', (err) => {
      resolve(false);
      server.close();
    });

    server.on('listening', () => {
      server.close(() => {});
      resolve(true);
    });

    try {
      server.listen(port, '127.0.0.1');
    } catch(err) {
      resolve(false);
    }
  });
}

module.exports = {
  startServer,
  stopServer,
  checkPortAvailability
};
