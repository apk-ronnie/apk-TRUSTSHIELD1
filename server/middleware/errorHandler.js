/**
 * Centralized Express Error Handling Middleware
 * Ensures every error returns a consistent JSON payload structure
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[Error Handler] ${new Date().toISOString()} - ${req.method} ${req.url}:`, err);

  // PostgreSQL / Supabase duplicate key error (23505)
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_ENTRY',
        message: 'A record with this identifier or email address already exists.'
      }
    });
  }

  // Generic duplicate entry error code (e.g., from DB adapters)
  if (err.code === 11000 || err.code === '23505') {
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_ENTRY',
        message: 'An account with that email already exists.'
      }
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.isOperational
    ? err.message
    : (process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message);

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: message || 'An unexpected error occurred on the server.'
    }
  });
};

module.exports = errorHandler;
