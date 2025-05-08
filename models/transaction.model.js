const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'interest', 'referral_bonus', 'transfer'],
    required: true
  },
  savingsType: {
    type: String,
    enum: ['flex', 'goal', 'fixed'],
    required: true
  },
  goalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User.goalSave',
    required: function() {
      return this.savingsType === 'goal';
    }
  },
  fixedSaveId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User.fixedSave',
    required: function() {
      return this.savingsType === 'fixed';
    }
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    enum: ['USDT', 'USDC'],
    required: true
  },
  nairaEquivalent: {
    type: Number,
    required: true
  },
  exchangeRate: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  method: {
    type: String,
    enum: ['wallet', 'bank_transfer', 'internal'],
    required: true
  },
  walletAddress: String,
  bankAccount: {
    bankName: String,
    accountNumber: String,
    accountName: String
  },
  transactionHash: String,
  description: String,
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Index for faster queries
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ type: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction; 