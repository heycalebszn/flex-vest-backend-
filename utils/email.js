const sgMail = require('@sendgrid/mail');
const fs = require('fs').promises;
const path = require('path');

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Email templates
const templates = {
  welcome: {
    subject: 'Welcome to FlexVest',
    template: 'welcome'
  },
  'password-reset': {
    subject: 'Reset Your Password',
    template: 'password-reset'
  },
  'savings-reminder': {
    subject: 'Savings Goal Reminder',
    template: 'savings-reminder'
  },
  'interest-earned': {
    subject: 'Interest Earned Update',
    template: 'interest-earned'
  },
  'maturity-alert': {
    subject: 'Fixed Savings Maturity Alert',
    template: 'maturity-alert'
  }
};

/**
 * Load and compile email template
 * @param {string} templateName - Name of the template to load
 * @param {Object} data - Data to inject into template
 */
async function loadTemplate(templateName, data) {
  try {
    const templatePath = path.join(__dirname, '../templates/email', `${templateName}.html`);
    let template = await fs.readFile(templatePath, 'utf8');
    
    // Replace template variables
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      template = template.replace(regex, data[key]);
    });

    return template;
  } catch (error) {
    console.error(`Error loading template ${templateName}:`, error);
    throw error;
  }
}

/**
 * Send email using SendGrid
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.template - Template name
 * @param {Object} options.data - Template data
 */
async function sendEmail({ to, subject, template, data = {} }) {
  try {
    const html = await loadTemplate(template, data);
    
    const msg = {
      to,
      from: process.env.EMAIL_FROM,
      subject: subject || templates[template].subject,
      html
    };

    await sgMail.send(msg);
    console.log(`Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

/**
 * Send batch emails using SendGrid
 * @param {Array<Object>} emails - Array of email objects
 */
async function sendBatchEmails(emails) {
  try {
    const messages = await Promise.all(
      emails.map(async ({ to, subject, template, data = {} }) => {
        const html = await loadTemplate(template, data);
        return {
          to,
          from: process.env.EMAIL_FROM,
          subject: subject || templates[template].subject,
          html
        };
      })
    );

    await sgMail.send(messages);
    console.log(`Batch emails sent successfully to ${emails.length} recipients`);
    return true;
  } catch (error) {
    console.error('Error sending batch emails:', error);
    throw error;
  }
}

module.exports = {
  sendEmail,
  sendBatchEmails
}; 