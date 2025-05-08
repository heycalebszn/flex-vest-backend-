const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referral.controller');
const { auth } = require('../middlewares/auth');
const { validateRequest } = require('../middlewares/validation');
const { body, query } = require('express-validator');

// Validation schemas
const referralCodeValidation = [
  body('referralCode')
    .isString()
    .isLength({ min: 6, max: 6 })
    .matches(/^[A-Z0-9]{6}$/)
    .withMessage('Invalid referral code format')
];

const historyValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid page number'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Invalid limit')
];

// Routes
router.get('/stats', auth, referralController.getReferralStats);
router.post('/apply', auth, referralCodeValidation, validateRequest, referralController.applyReferral);
router.post('/generate-code', auth, referralController.generateNewCode);
router.get('/history', auth, historyValidation, validateRequest, referralController.getReferralHistory);

module.exports = router; 