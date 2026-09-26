const express = require('express');
const healthController = require('../controllers/health.controller.js');

const router = express.Router();

/**
 * GET /api/health
 *
 * Returns the exact response shape required by Step 1:
 *   { "success": true, "message": "ITSM API is running" }
 */
router.get('/health', healthController.getHealth);

module.exports = router;
