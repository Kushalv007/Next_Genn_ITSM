const healthService = require('../services/health.service.js');

/**
 * Handle GET /api/health
 */
function getHealth(_req, res, next) {
  try {
    const payload = healthService.getHealthPayload();
    res.status(200).json(payload);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getHealth,
};
