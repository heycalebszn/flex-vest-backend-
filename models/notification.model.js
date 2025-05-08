const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'savings_reminder',
      'interest_earned',
      'maturity_alert',
      'withdrawal_confirmation',
      'deposit_confirmation',
      'goal_achieved',
      'referral_bonus',
      'security_alert'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  read: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  deliveryMethod: {
    type: String,
    enum: ['in_app', 'email', 'both'],
    default: 'both'
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  scheduledFor: Date
}, {
  timestamps: true
});

// Indexes for faster queries
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ read: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ scheduledFor: 1 }, { sparse: true });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification; 