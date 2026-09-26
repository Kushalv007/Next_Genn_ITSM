require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');

const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/error.js');
const loadConfig = require('./config/index.js');

const config = loadConfig();

const app = express();

// --- Middleware stack --------------------------------------------------------
app.use(cors({ origin: config.CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// --- Routes ------------------------------------------------------------------
app.use('/api', routes);

// --- Health (root-level alias for quick probes) -----------------------------
app.get('/healthz', (_req, res) => res.json({ ok: true }));

// --- Error handling ----------------------------------------------------------
app.use(notFound);
app.use(errorHandler);

const server = app.listen(config.PORT, () => {
  console.log('✓ ITSM API server running');
  console.log(`  · Port      : ${config.PORT}`);
  console.log(`  · URL       : http://localhost:${config.PORT}`);
  console.log(`  · Health    : GET /api/health`);
  console.log(`  · Client CORS: ${config.CLIENT_ORIGIN}`);
});

process.on('SIGTERM', () => server.close());
process.on('SIGINT',  () => server.close());

module.exports = app;
