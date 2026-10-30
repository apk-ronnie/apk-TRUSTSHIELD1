const { ZodError } = require('zod');

/**
 * Middleware factory to validate request body using a Zod schema
 * @param {import('zod').ZodSchema} schema 
 */
const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message
      }));

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'The submitted request data failed validation.',
          details: formattedErrors
        }
      });
    }
    next(error);
  }
};

module.exports = validate;
