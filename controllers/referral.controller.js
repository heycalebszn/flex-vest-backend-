const User = require('../models/user.model');
const Transaction = require('../models/transaction.model');
const { sendEmail } = require('../utils/email');

const REFERRAL_BONUS = 10; // USDT bonus for successful referral

const referralController = {
  // Get user's referral stats
  async getReferralStats(req, res) {
    try {
      const { userId } = req.user;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Get list of referred users
      const referredUsers = await User.find({ referredBy: userId })
        .select('email createdAt -_id')
        .sort('-createdAt');

      res.json({
        success: true,
        data: {
          referralCode: user.referralCode,
          referralCount: user.referralCount,
          referralEarnings: user.referralEarnings,
          referredUsers
        }
      });
    } catch (error) {
      console.error('Get referral stats error:', error);
      res.status(500).json({ message: 'Failed to get referral stats' });
    }
  },

  // Apply referral code during registration
  async applyReferral(req, res) {
    try {
      const { userId } = req.user;
      const { referralCode } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if user already has a referrer
      if (user.referredBy) {
        return res.status(400).json({ message: 'Referral already applied' });
      }

      // Find referrer
      const referrer = await User.findOne({ referralCode });
      if (!referrer) {
        return res.status(404).json({ message: 'Invalid referral code' });
      }

      // Prevent self-referral
      if (referrer._id.toString() === userId) {
        return res.status(400).json({ message: 'Cannot refer yourself' });
      }

      // Update referred user
      user.referredBy = referrer._id;
      await user.save();

      // Update referrer stats and add bonus
      referrer.referralCount += 1;
      referrer.referralEarnings += REFERRAL_BONUS;
      referrer.totalBalance += REFERRAL_BONUS;

      // Create bonus transaction
      const transaction = new Transaction({
        user: referrer._id,
        type: 'referral_bonus',
        amount: REFERRAL_BONUS,
        currency: 'USDT',
        status: 'completed',
        method: 'internal',
        description: `Referral bonus for referring ${user.email}`
      });

      await Promise.all([
        transaction.save(),
        referrer.save()
      ]);

      // Send notifications
      await Promise.all([
        sendEmail({
          to: referrer.email,
          template: 'referral-bonus',
          data: {
            amount: REFERRAL_BONUS,
            referredUser: user.email
          }
        }),
        sendEmail({
          to: user.email,
          template: 'referral-applied',
          data: {
            referrerEmail: referrer.email
          }
        })
      ]);

      res.json({
        success: true,
        message: 'Referral code applied successfully'
      });
    } catch (error) {
      console.error('Apply referral error:', error);
      res.status(500).json({ message: 'Failed to apply referral code' });
    }
  },

  // Generate new referral code
  async generateNewCode(req, res) {
    try {
      const { userId } = req.user;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Generate new unique referral code
      const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      user.referralCode = newCode;
      await user.save();

      res.json({
        success: true,
        data: {
          referralCode: newCode
        }
      });
    } catch (error) {
      console.error('Generate referral code error:', error);
      res.status(500).json({ message: 'Failed to generate new referral code' });
    }
  },

  // Get referral history
  async getReferralHistory(req, res) {
    try {
      const { userId } = req.user;
      const { page = 1, limit = 10 } = req.query;

      const [transactions, total] = await Promise.all([
        Transaction.find({
          user: userId,
          type: 'referral_bonus'
        })
          .sort('-createdAt')
          .skip((page - 1) * limit)
          .limit(limit),
        Transaction.countDocuments({
          user: userId,
          type: 'referral_bonus'
        })
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
      console.error('Get referral history error:', error);
      res.status(500).json({ message: 'Failed to get referral history' });
    }
  }
};

module.exports = referralController; 