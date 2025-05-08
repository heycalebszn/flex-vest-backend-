const express = require('express');
const router = express.Router();
const savingsController = require('../controllers/savings.controller');
const { auth } = require('../middlewares/auth');
const { validateRequest } = require('../middlewares/validation');
const { body, query } = require('express-validator');

// Validation schemas
const depositValidation = [
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('currency').optional().isIn(['USDT', 'USDC']).withMessage('Invalid currency')
];

const withdrawalValidation = [
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('currency').optional().isIn(['USDT', 'USDC']).withMessage('Invalid currency'),
  body('withdrawalAddress').matches(/^0x[a-fA-F0-9]{40}$/).withMessage('Invalid wallet address')
];

const goalValidation = [
  body('name').isString().trim().notEmpty().withMessage('Goal name is required'),
  body('targetAmount').isNumeric().withMessage('Target amount must be a number'),
  body('deadline').isISO8601().withMessage('Invalid deadline date')
];

const fixedSaveValidation = [
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('duration').isInt({ min: 1, max: 24 }).withMessage('Duration must be between 1 and 24 months'),
  body('currency').optional().isIn(['USDT', 'USDC']).withMessage('Invalid currency')
];

const historyValidation = [
  query('type').optional().isIn(['flex', 'goal', 'fixed']).withMessage('Invalid savings type'),
  query('page').optional().isInt({ min: 1 }).withMessage('Invalid page number'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Invalid limit')
];

// Routes
router.get('/summary', auth, savingsController.getSummary);
router.get('/history', auth, historyValidation, validateRequest, savingsController.getHistory);

// Flex Save routes
router.post('/flex/deposit', auth, depositValidation, validateRequest, savingsController.flexSaveDeposit);
router.post('/flex/withdraw', auth, withdrawalValidation, validateRequest, savingsController.flexSaveWithdraw);

// Goal Save routes
router.post('/goal/create', auth, goalValidation, validateRequest, savingsController.createGoal);
router.post('/goal/deposit', auth, depositValidation, validateRequest, savingsController.goalSaveDeposit);

// Fixed Save routes
router.post('/fixed/create', auth, fixedSaveValidation, validateRequest, savingsController.createFixedSave);

module.exports = router; 