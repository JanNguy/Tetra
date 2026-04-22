const express = require('express');
const cors = require('cors');
const net = require('net');

let serverInstance = null;

function sanitizeHeader(value) {
  if (typeof value !== 'string') return '';
  // Remove CRLF to prevent HTTP response splitting
  return value.replace(/[\r\n]/g, '');
}

function stopServer() {
  return new Promise((resolve) => {
    if (serverInstance) {
      serverInstance.close(() => {
        serverInstance = null;
        resolve(true);
      });
    } else {
      resolve(true);
    }
  });
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

    const start = () => {
      createExpressServer(port, settings, routes, onLog, resolve, reject);
    };

    if (serverInstance) {
      stopServer().then(start);
    } else {
      start();
    }
  });
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
