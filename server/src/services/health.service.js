/**
 * Returns the health payload exactly as required by Step 1.
 * Future: add DB ping checks and component-level status.
 */
function getHealthPayload() {
  return {
    success: true,
    message: 'ITSM API is running',
  };
}

module.exports = {
  getHealthPayload,
};
