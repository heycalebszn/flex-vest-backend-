const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { auth } = require('../middlewares/auth');
const { validateRequest } = require('../middlewares/validation');
const { query } = require('express-validator');

// Validation schemas
const periodValidation = [
  query('period')
    .optional()
    .isIn(['1m', '3m', '6m', '1y'])
    .withMessage('Invalid period')
];

const exchangeRateValidation = [
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be between 1 and 365')
];

// Routes
router.get('/growth', auth, periodValidation, validateRequest, analyticsController.getGrowthAnalytics);
router.get('/goals-progress', auth, analyticsController.getGoalsProgress);
router.get('/fixed-savings', auth, analyticsController.getFixedSavingsAnalytics);
router.get('/exchange-rates', auth, exchangeRateValidation, validateRequest, analyticsController.getExchangeRateHistory);

module.exports = router; 