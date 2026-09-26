/**
 * 404 handler — catches any requests that do not match a route.
 */
function notFound(req, _res, next) {
  const err = new Error(`Cannot ${req.method} ${req.originalUrl}`);
  err.status = 404;
  next(err);
}

/**
 * Final error handler. Always produces a JSON payload:
 * { success: false, message, (stack in dev) }
 */
function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(isProduction ? {} : {
      statusCode: status,
      stack: err.stack,
    }),
  });
}

module.exports = {
  notFound,
  errorHandler,
};
