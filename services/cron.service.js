const cron = require('node-cron');
const User = require('../models/user.model');
const Transaction = require('../models/transaction.model');
const { sendEmail } = require('../utils/email');

// Calculate and add interest for fixed savings (runs daily at midnight)
cron.schedule('0 0 * * *', async () => {
  try {
    console.log('Running daily interest calculations...');

    const users = await User.find({
      'fixedSave': { 
        $elemMatch: { 
          isMatured: false,
          maturityDate: { $gt: new Date() }
        }
      }
    });

    for (const user of users) {
      for (const fixedSave of user.fixedSave) {
        if (!fixedSave.isMatured) {
          // Calculate daily interest
          const dailyInterestRate = fixedSave.interestRate / 365;
          const dailyInterest = (fixedSave.amount * dailyInterestRate) / 100;

          // Create interest transaction
          const transaction = new Transaction({
            user: user._id,
            type: 'interest',
            savingsType: 'fixed',
            fixedSaveId: fixedSave._id,
            amount: dailyInterest,
            currency: 'USDT',
            status: 'completed',
            method: 'internal',
            description: `Daily interest earned on fixed savings`
          });

          // Update balances
          user.totalBalance += dailyInterest;
          fixedSave.transactions.push(transaction._id);

          await Promise.all([
            transaction.save(),
            user.save()
          ]);

          // Send notification if significant interest earned
          if (dailyInterest >= 1) { // Only notify for interest >= 1 USDT
            await sendEmail({
              to: user.email,
              template: 'interest-earned',
              data: {
                amount: dailyInterest.toFixed(2),
                totalAmount: fixedSave.amount,
                interestRate: fixedSave.interestRate
              }
            });
          }
        }
      }
    }

    console.log('Daily interest calculations completed');
  } catch (error) {
    console.error('Error in daily interest calculation:', error);
  }
});

// Check for matured fixed savings (runs daily at 1 AM)
cron.schedule('0 1 * * *', async () => {
  try {
    console.log('Checking for matured fixed savings...');

    const users = await User.find({
      'fixedSave': { 
        $elemMatch: { 
          isMatured: false,
          maturityDate: { $lte: new Date() }
        }
      }
    });

    for (const user of users) {
      for (const fixedSave of user.fixedSave) {
        if (!fixedSave.isMatured && new Date(fixedSave.maturityDate) <= new Date()) {
          fixedSave.isMatured = true;

          // Send maturity notification
          await sendEmail({
            to: user.email,
            template: 'maturity-alert',
            data: {
              amount: fixedSave.amount,
              interestRate: fixedSave.interestRate,
              maturityDate: fixedSave.maturityDate.toDateString()
            }
          });
        }
      }
      await user.save();
    }

    console.log('Maturity check completed');
  } catch (error) {
    console.error('Error in maturity check:', error);
  }
});

// Check savings goals progress (runs daily at 2 AM)
cron.schedule('0 2 * * *', async () => {
  try {
    console.log('Checking savings goals progress...');

    const users = await User.find({
      'goalSave': { $exists: true, $not: { $size: 0 } }
    });

    for (const user of users) {
      for (const goal of user.goalSave) {
        const deadline = new Date(goal.deadline);
        const today = new Date();
        const daysRemaining = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

        // Alert if goal is behind schedule
        if (daysRemaining > 0) {
          const expectedProgress = (1 - daysRemaining / 30) * goal.targetAmount;
          if (goal.currentAmount < expectedProgress) {
            await sendEmail({
              to: user.email,
              template: 'savings-reminder',
              data: {
                goalName: goal.name,
                currentAmount: goal.currentAmount,
                targetAmount: goal.targetAmount,
                daysRemaining,
                requiredDaily: (goal.targetAmount - goal.currentAmount) / daysRemaining
              }
            });
          }
        }
        // Alert if goal deadline is reached
        else if (daysRemaining === 0) {
          await sendEmail({
            to: user.email,
            template: 'goal-deadline',
            data: {
              goalName: goal.name,
              currentAmount: goal.currentAmount,
              targetAmount: goal.targetAmount,
              achieved: goal.currentAmount >= goal.targetAmount
            }
          });
        }
      }
    }

    console.log('Goals progress check completed');
  } catch (error) {
    console.error('Error in goals progress check:', error);
  }
});

// Clean up old notifications (runs weekly on Sunday at 3 AM)
cron.schedule('0 3 * * 0', async () => {
  try {
    console.log('Cleaning up old notifications...');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    await Transaction.deleteMany({
      type: { $in: ['interest'] },
      createdAt: { $lt: thirtyDaysAgo },
      amount: { $lt: 1 } // Only delete small interest transactions
    });

    console.log('Notifications cleanup completed');
  } catch (error) {
    console.error('Error in notifications cleanup:', error);
  }
});

module.exports = {
  // Export any functions that might be needed elsewhere
}; 