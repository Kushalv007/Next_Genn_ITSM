/**
 * Load and normalize environment configuration.
 *
 * Keep this file dependency-free so it can be imported anywhere early.
 */
function loadConfig() {
  const port = parseInt(process.env.PORT || '4000', 10);
  const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  const nodeEnv = process.env.NODE_ENV || 'development';

  return {
    PORT: Number.isFinite(port) && port > 0 ? port : 4000,
    CLIENT_ORIGIN: clientOrigin,
    NODE_ENV: nodeEnv,
  };
}

module.exports = loadConfig;
module.exports.default = loadConfig;
