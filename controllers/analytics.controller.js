const User = require('../models/user.model');
const Transaction = require('../models/transaction.model');
const axios = require('axios');

const analyticsController = {
  // Get user's growth analytics
  async getGrowthAnalytics(req, res) {
    try {
      const { userId } = req.user;
      const { period = '1y' } = req.query;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      switch (period) {
        case '1m':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case '3m':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case '6m':
          startDate.setMonth(startDate.getMonth() - 6);
          break;
        case '1y':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setFullYear(startDate.getFullYear() - 1);
      }

      // Get all transactions in date range
      const transactions = await Transaction.find({
        user: userId,
        createdAt: { $gte: startDate, $lte: endDate }
      }).sort('createdAt');

      // Calculate daily balances
      const dailyBalances = new Map();
      let runningBalance = 0;
      
      transactions.forEach(tx => {
        const date = tx.createdAt.toISOString().split('T')[0];
        if (tx.type === 'deposit') {
          runningBalance += tx.amount;
        } else if (tx.type === 'withdrawal') {
          runningBalance -= tx.amount;
        }
        dailyBalances.set(date, runningBalance);
      });

      // Get interest earned
      const interestEarned = await Transaction.aggregate([
        {
          $match: {
            user: user._id,
            type: 'interest',
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      // Get savings distribution
      const savingsDistribution = {
        flexSave: user.flexSave.balance,
        goalSave: user.goalSave.reduce((acc, goal) => acc + goal.currentAmount, 0),
        fixedSave: user.fixedSave.reduce((acc, fixed) => acc + fixed.amount, 0)
      };

      // Get current exchange rate
      const exchangeRate = await getExchangeRate();

      // Calculate total in Naira
      const totalInNaira = user.totalBalance * exchangeRate;

      res.json({
        success: true,
        data: {
          growthChart: Array.from(dailyBalances).map(([date, balance]) => ({
            date,
            balance,
            balanceNaira: balance * exchangeRate
          })),
          interestEarned: interestEarned[0]?.total || 0,
          savingsDistribution,
          totalBalance: user.totalBalance,
          totalBalanceNaira: totalInNaira,
          exchangeRate
        }
      });
    } catch (error) {
      console.error('Get growth analytics error:', error);
      res.status(500).json({ message: 'Failed to get growth analytics' });
    }
  },

  // Get savings goals progress
  async getGoalsProgress(req, res) {
    try {
      const { userId } = req.user;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const goalsProgress = user.goalSave.map(goal => ({
        id: goal._id,
        name: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        deadline: goal.deadline,
        progress: (goal.currentAmount / goal.targetAmount) * 100,
        remainingDays: Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24))
      }));

      res.json({
        success: true,
        data: goalsProgress
      });
    } catch (error) {
      console.error('Get goals progress error:', error);
      res.status(500).json({ message: 'Failed to get goals progress' });
    }
  },

  // Get fixed savings analytics
  async getFixedSavingsAnalytics(req, res) {
    try {
      const { userId } = req.user;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const fixedSavingsAnalytics = user.fixedSave.map(fixed => {
        const daysToMaturity = Math.ceil((new Date(fixed.maturityDate) - new Date()) / (1000 * 60 * 60 * 24));
        const expectedInterest = (fixed.amount * fixed.interestRate * daysToMaturity) / (365 * 100);

        return {
          id: fixed._id,
          amount: fixed.amount,
          interestRate: fixed.interestRate,
          startDate: fixed.startDate,
          maturityDate: fixed.maturityDate,
          isMatured: fixed.isMatured,
          daysToMaturity: Math.max(0, daysToMaturity),
          expectedInterest: fixed.isMatured ? 0 : expectedInterest
        };
      });

      res.json({
        success: true,
        data: fixedSavingsAnalytics
      });
    } catch (error) {
      console.error('Get fixed savings analytics error:', error);
      res.status(500).json({ message: 'Failed to get fixed savings analytics' });
    }
  },

  // Get exchange rate tracker
  async getExchangeRateHistory(req, res) {
    try {
      const { days = 30 } = req.query;

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get historical exchange rates
      const rates = await getHistoricalExchangeRates(startDate, endDate);

      res.json({
        success: true,
        data: {
          rates,
          currentRate: rates[rates.length - 1]?.rate
        }
      });
    } catch (error) {
      console.error('Get exchange rate history error:', error);
      res.status(500).json({ message: 'Failed to get exchange rate history' });
    }
  }
};

// Helper function to get current exchange rate
async function getExchangeRate() {
  try {
    const response = await axios.get(
      `https://api.exchangerate-api.com/v4/latest/USD`,
      {
        params: {
          apikey: process.env.EXCHANGE_RATE_API_KEY
        }
      }
    );

    return response.data.rates.NGN;
  } catch (error) {
    console.error('Get exchange rate error:', error);
    throw error;
  }
}

// Helper function to get historical exchange rates
async function getHistoricalExchangeRates(startDate, endDate) {
  try {
    const response = await axios.get(
      `https://api.exchangerate-api.com/v4/history/USD/NGN/${startDate.toISOString().split('T')[0]}/${endDate.toISOString().split('T')[0]}`,
      {
        params: {
          apikey: process.env.EXCHANGE_RATE_API_KEY
        }
      }
    );

    return Object.entries(response.data.rates).map(([date, rate]) => ({
      date,
      rate: rate.NGN
    }));
  } catch (error) {
    console.error('Get historical exchange rates error:', error);
    throw error;
  }
}

module.exports = analyticsController; 