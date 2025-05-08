const User = require('../models/user.model');
const Transaction = require('../models/transaction.model');
const { validateAmount } = require('../utils/validation');
const { transferTokens, getTokenBalance } = require('../utils/crypto');
const { sendEmail } = require('../utils/email');

const savingsController = {
  // Get user's savings summary
  async getSummary(req, res) {
    try {
      const { userId } = req.user;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Calculate total balance across all savings types
      const totalBalance = user.totalBalance;
      const flexSaveBalance = user.flexSave.balance;
      
      // Calculate total in goal savings
      const goalSaveTotal = user.goalSave.reduce((acc, goal) => 
        acc + goal.currentAmount, 0);

      // Calculate total in fixed savings
      const fixedSaveTotal = user.fixedSave.reduce((acc, fixed) => 
        acc + fixed.amount, 0);

      // Get recent transactions
      const recentTransactions = await Transaction.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(5);

      res.json({
        success: true,
        data: {
          totalBalance,
          summary: {
            flexSave: flexSaveBalance,
            goalSave: goalSaveTotal,
            fixedSave: fixedSaveTotal
          },
          recentTransactions
        }
      });
    } catch (error) {
      console.error('Get savings summary error:', error);
      res.status(500).json({ message: 'Failed to get savings summary' });
    }
  },

  // Flex Save Operations
  async flexSaveDeposit(req, res) {
    try {
      const { userId } = req.user;
      const { amount, currency = 'USDT' } = req.body;

      if (!validateAmount(amount)) {
        return res.status(400).json({ message: 'Invalid amount' });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Create transaction record
      const transaction = new Transaction({
        user: userId,
        type: 'deposit',
        savingsType: 'flex',
        amount,
        currency,
        method: 'wallet',
        status: 'pending'
      });

      // Update user's flex save balance
      user.flexSave.balance += Number(amount);
      user.totalBalance += Number(amount);
      user.flexSave.transactions.push(transaction._id);

      await Promise.all([
        transaction.save(),
        user.save()
      ]);

      // Send notification
      await sendEmail({
        to: user.email,
        template: 'deposit-confirmation',
        data: {
          amount,
          currency,
          type: 'Flex Save'
        }
      });

      res.json({
        success: true,
        message: 'Deposit successful',
        transaction: transaction._id
      });
    } catch (error) {
      console.error('Flex save deposit error:', error);
      res.status(500).json({ message: 'Deposit failed' });
    }
  },

  async flexSaveWithdraw(req, res) {
    try {
      const { userId } = req.user;
      const { amount, currency = 'USDT', withdrawalAddress } = req.body;

      if (!validateAmount(amount)) {
        return res.status(400).json({ message: 'Invalid amount' });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (user.flexSave.balance < amount) {
        return res.status(400).json({ message: 'Insufficient balance' });
      }

      // Create withdrawal transaction
      const transaction = new Transaction({
        user: userId,
        type: 'withdrawal',
        savingsType: 'flex',
        amount,
        currency,
        method: 'wallet',
        walletAddress: withdrawalAddress,
        status: 'pending'
      });

      // Update user's flex save balance
      user.flexSave.balance -= Number(amount);
      user.totalBalance -= Number(amount);
      user.flexSave.transactions.push(transaction._id);

      // Transfer tokens
      const transfer = await transferTokens(withdrawalAddress, amount, currency);
      transaction.transactionHash = transfer.transactionHash;
      transaction.status = transfer.status === 'success' ? 'completed' : 'failed';

      await Promise.all([
        transaction.save(),
        user.save()
      ]);

      // Send notification
      await sendEmail({
        to: user.email,
        template: 'withdrawal-confirmation',
        data: {
          amount,
          currency,
          type: 'Flex Save',
          transactionHash: transfer.transactionHash
        }
      });

      res.json({
        success: true,
        message: 'Withdrawal successful',
        transaction: transaction._id
      });
    } catch (error) {
      console.error('Flex save withdrawal error:', error);
      res.status(500).json({ message: 'Withdrawal failed' });
    }
  },

  // Goal Save Operations
  async createGoal(req, res) {
    try {
      const { userId } = req.user;
      const { name, targetAmount, deadline } = req.body;

      if (!validateAmount(targetAmount)) {
        return res.status(400).json({ message: 'Invalid target amount' });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Create new goal
      user.goalSave.push({
        name,
        targetAmount,
        currentAmount: 0,
        deadline: new Date(deadline)
      });

      await user.save();

      res.json({
        success: true,
        message: 'Savings goal created',
        goal: user.goalSave[user.goalSave.length - 1]
      });
    } catch (error) {
      console.error('Create goal error:', error);
      res.status(500).json({ message: 'Failed to create savings goal' });
    }
  },

  async goalSaveDeposit(req, res) {
    try {
      const { userId } = req.user;
      const { goalId, amount, currency = 'USDT' } = req.body;

      if (!validateAmount(amount)) {
        return res.status(400).json({ message: 'Invalid amount' });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const goal = user.goalSave.id(goalId);
      if (!goal) {
        return res.status(404).json({ message: 'Savings goal not found' });
      }

      // Create transaction record
      const transaction = new Transaction({
        user: userId,
        type: 'deposit',
        savingsType: 'goal',
        goalId,
        amount,
        currency,
        method: 'wallet',
        status: 'pending'
      });

      // Update goal progress
      goal.currentAmount += Number(amount);
      user.totalBalance += Number(amount);
      goal.transactions.push(transaction._id);

      await Promise.all([
        transaction.save(),
        user.save()
      ]);

      // Check if goal is achieved
      if (goal.currentAmount >= goal.targetAmount) {
        await sendEmail({
          to: user.email,
          template: 'goal-achieved',
          data: {
            goalName: goal.name,
            targetAmount: goal.targetAmount,
            currency
          }
        });
      }

      res.json({
        success: true,
        message: 'Goal deposit successful',
        transaction: transaction._id
      });
    } catch (error) {
      console.error('Goal save deposit error:', error);
      res.status(500).json({ message: 'Deposit failed' });
    }
  },

  // Fixed Save Operations
  async createFixedSave(req, res) {
    try {
      const { userId } = req.user;
      const { amount, duration, currency = 'USDT' } = req.body;

      if (!validateAmount(amount)) {
        return res.status(400).json({ message: 'Invalid amount' });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Calculate interest rate based on duration (in months)
      const interestRate = duration <= 3 ? 8 : 
                          duration <= 6 ? 10 : 
                          duration <= 12 ? 12 : 15;

      const startDate = new Date();
      const maturityDate = new Date();
      maturityDate.setMonth(maturityDate.getMonth() + duration);

      // Create fixed save record
      const fixedSave = {
        amount: Number(amount),
        interestRate,
        startDate,
        maturityDate,
        isMatured: false
      };

      user.fixedSave.push(fixedSave);
      user.totalBalance += Number(amount);

      // Create transaction record
      const transaction = new Transaction({
        user: userId,
        type: 'deposit',
        savingsType: 'fixed',
        fixedSaveId: fixedSave._id,
        amount,
        currency,
        method: 'wallet',
        status: 'completed'
      });

      fixedSave.transactions = [transaction._id];

      await Promise.all([
        transaction.save(),
        user.save()
      ]);

      // Schedule maturity notification
      await sendEmail({
        to: user.email,
        template: 'fixed-save-confirmation',
        data: {
          amount,
          currency,
          interestRate,
          maturityDate: maturityDate.toDateString()
        }
      });

      res.json({
        success: true,
        message: 'Fixed save created successfully',
        fixedSave
      });
    } catch (error) {
      console.error('Create fixed save error:', error);
      res.status(500).json({ message: 'Failed to create fixed save' });
    }
  },

  // Get savings history
  async getHistory(req, res) {
    try {
      const { userId } = req.user;
      const { type, page = 1, limit = 10 } = req.query;

      const query = { user: userId };
      if (type) {
        query.savingsType = type;
      }

      const [transactions, total] = await Promise.all([
        Transaction.find(query)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit),
        Transaction.countDocuments(query)
      ]);

      res.json({
        success: true,
        data: {
          transactions,
          pagination: {
            total,
            page: Number(page),
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get savings history error:', error);
      res.status(500).json({ message: 'Failed to get savings history' });
    }
  }
};

module.exports = savingsController; 