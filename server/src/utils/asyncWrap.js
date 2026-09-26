/**
 * Shared utility helpers.
 */

/**
 * Simple promise wrapper used by route controllers (if/when needed).
 * Prevents unhandled promise rejections leaking to the process.
 */
function asyncWrap(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = {
  asyncWrap,
};
