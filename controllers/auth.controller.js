const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const bcrypt = require('bcryptjs');
const { sendEmail } = require('../utils/email');
const { generateWallet } = require('../utils/crypto');
const { validateEmail, validatePassword } = require('../utils/validation');

const authController = {
  // Register new user
  async register(req, res) {
    try {
      const { email, password, phone } = req.body;

      // Validate input
      if (!validateEmail(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }
      if (!validatePassword(password)) {
        return res.status(400).json({ 
          message: 'Password must be at least 8 characters long and contain letters, numbers, and special characters' 
        });
      }

      // Check if user exists
      const existingUser = await User.findOne({ 
        $or: [{ email }, { phone }] 
      });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Create user
      const user = new User({
        email,
        password,
        phone
      });

      // Generate 2FA secret
      const secret = speakeasy.generateSecret();
      user.twoFactorSecret = secret.base32;

      await user.save();

      // Send welcome email
      await sendEmail({
        to: email,
        subject: 'Welcome to FlexVest',
        template: 'welcome',
        data: { name: email.split('@')[0] }
      });

      res.status(201).json({
        message: 'Registration successful',
        twoFactorSecret: secret.base32,
        qrCode: secret.otpauth_url
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Registration failed' });
    }
  },

  // Login user
  async login(req, res) {
    try {
      const { email, password, twoFactorCode } = req.body;

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Verify password
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Verify 2FA if enabled
      if (user.twoFactorEnabled) {
        if (!twoFactorCode) {
          return res.status(400).json({ message: '2FA code required' });
        }

        const isValidToken = speakeasy.totp.verify({
          secret: user.twoFactorSecret,
          encoding: 'base32',
          token: twoFactorCode
        });

        if (!isValidToken) {
          return res.status(401).json({ message: 'Invalid 2FA code' });
        }
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate tokens
      const accessToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const refreshToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          email: user.email,
          phone: user.phone,
          twoFactorEnabled: user.twoFactorEnabled
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  },

  // Enable 2FA
  async enable2FA(req, res) {
    try {
      const { userId } = req.user;
      const { twoFactorCode } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Verify 2FA code
      const isValidToken = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorCode
      });

      if (!isValidToken) {
        return res.status(401).json({ message: 'Invalid 2FA code' });
      }

      user.twoFactorEnabled = true;
      await user.save();

      res.json({ message: '2FA enabled successfully' });
    } catch (error) {
      console.error('Enable 2FA error:', error);
      res.status(500).json({ message: 'Failed to enable 2FA' });
    }
  },

  // Disable 2FA
  async disable2FA(req, res) {
    try {
      const { userId } = req.user;
      const { password, twoFactorCode } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Verify password
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid password' });
      }

      // Verify 2FA code
      const isValidToken = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorCode
      });

      if (!isValidToken) {
        return res.status(401).json({ message: 'Invalid 2FA code' });
      }

      user.twoFactorEnabled = false;
      await user.save();

      res.json({ message: '2FA disabled successfully' });
    } catch (error) {
      console.error('Disable 2FA error:', error);
      res.status(500).json({ message: 'Failed to disable 2FA' });
    }
  },

  // Request password reset
  async requestPasswordReset(req, res) {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Generate reset token
      const resetToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
      await user.save();

      // Send reset email
      await sendEmail({
        to: email,
        subject: 'Password Reset Request',
        template: 'password-reset',
        data: {
          resetLink: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
        }
      });

      res.json({ message: 'Password reset email sent' });
    } catch (error) {
      console.error('Password reset request error:', error);
      res.status(500).json({ message: 'Failed to request password reset' });
    }
  },

  // Reset password
  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      if (!validatePassword(newPassword)) {
        return res.status(400).json({ 
          message: 'Password must be at least 8 characters long and contain letters, numbers, and special characters' 
        });
      }

      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }

      user.password = newPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      res.json({ message: 'Password reset successful' });
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ message: 'Failed to reset password' });
    }
  },

  // Refresh access token
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token required' });
      }

      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const accessToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.json({ accessToken });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(401).json({ message: 'Invalid refresh token' });
    }
  }
};

module.exports = authController; 