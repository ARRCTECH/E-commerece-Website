/**
 * Express Validation Middleware
 * Standardizes validation error handling across routes
 */

const { validationResult } = require('express-validator');

/**
 * Express middleware to validate requests
 * Use this with express-validator rules
 * Example usage:
 * 
 * router.post(
 *   '/route',
 *   [
 *     check('field').isEmail().withMessage('Invalid email'),
 *   ],
 *   validate,
 *   (req, res) => {
 *     // Your controller logic
 *   }
 * );
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = {};
    
    // Format errors for client consumption
    errors.array().forEach((error) => {
      if (!formattedErrors[error.path]) {
        formattedErrors[error.path] = [];
      }
      formattedErrors[error.path].push(error.msg);
    });
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
    });
  }
  next();
};

module.exports = validate;
