/**
 * Server factory for microservices
 * Reduces boilerplate in server.js files
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');

/**
 * Create and configure an Express app with common middleware
 * @returns {Object} { app, server }
 */
function createApp() {
  const app = express();
  const server = http.createServer(app);

  // Common middlewares
  app.use(morgan('combined'));
  app.use(cors());
  app.use(express.json());

  return { app, server };
}

/**
 * Start the server after initialization
 * @param {Object} options - Server options
 * @param {Object} options.server - HTTP server instance
 * @param {number} options.port - Port to listen on
 * @param {string} options.serviceName - Name of the service for logging
 * @param {Function} options.initFn - Async function to run before starting (e.g., DB init)
 * @param {Function} [options.onStart] - Optional callback after server starts
 */
async function startServer({ server, port, serviceName, initFn, onStart }) {
  try {
    if (initFn) {
      await initFn();
    }

    server.listen(port, () => {
      console.log(`${serviceName} running on port ${port}`);
      if (onStart) onStart();
    });
  } catch (err) {
    console.error(`Failed to initialize ${serviceName}:`, err);
    process.exit(1);
  }
}

module.exports = {
  createApp,
  startServer
};
