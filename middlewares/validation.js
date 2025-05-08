const { validationResult } = require('express-validator');

/**
 * Middleware to validate request using express-validator
 */
function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
}

module.exports = {
  validateRequest
}; 