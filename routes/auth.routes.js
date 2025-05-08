const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validateRequest } = require('../middlewares/validation');
const { auth } = require('../middlewares/auth');

// Validation schemas
const { body } = require('express-validator');

const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/),
  body('phone').optional().matches(/^\+?[1-9]\d{1,14}$/)
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  body('twoFactorCode').optional().isLength({ min: 6, max: 6 }).isNumeric()
];

const passwordResetValidation = [
  body('email').isEmail().normalizeEmail()
];

const newPasswordValidation = [
  body('token').notEmpty(),
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
];

// Routes
router.post('/register', registerValidation, validateRequest, authController.register);
router.post('/login', loginValidation, validateRequest, authController.login);
router.post('/refresh-token', authController.refreshToken);

router.post('/enable-2fa', auth, authController.enable2FA);
router.post('/disable-2fa', auth, authController.disable2FA);

router.post('/request-password-reset', passwordResetValidation, validateRequest, authController.requestPasswordReset);
router.post('/reset-password', newPasswordValidation, validateRequest, authController.resetPassword);

module.exports = router; 