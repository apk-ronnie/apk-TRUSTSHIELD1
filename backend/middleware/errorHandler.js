/**
 * Centralized Express Error Handling Middleware
 * Ensures every error returns a consistent JSON payload structure
 */
const errorHandler = (err, req, res, next) => {
  // Log error in development or server console
  console.error(`[Error Handler] ${new Date().toISOString()} - ${req.method} ${req.url}:`, err);

  // Mongoose duplicate key error (e.g. unique email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_ENTRY',
        message: `An account with that ${field} already exists.`
      }
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message
    }));
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Database validation failed.',
        details
      }
    });
  }

  // CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: `Invalid format for resource identifier: ${err.value}`
      }
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.isOperational ? err.message : (process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message);

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: message || 'An unexpected error occurred on the server.'
    }
  });
};

module.exports = errorHandler;

