/** @format */
import nodemailer from 'nodemailer';

// Email configuration
const emailConfig = {
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

// Create transporter
const transporter = nodemailer.createTransporter(emailConfig);

/**
 * Send email function
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param html - HTML content
 * @param text - Plain text content (optional)
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<void> {
  try {
    // Skip email sending in development if no SMTP config
    if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
      console.log('📧 DEV MODE - Email would be sent:', {
        to,
        subject,
        html,
        text,
      });
      return;
    }

    // Verify transporter configuration
    if (!process.env.SMTP_HOST) {
      throw new Error('SMTP_HOST is required for email sending');
    }

    const mailOptions = {
      from: {
        name: 'Kajen Traders',
        address: process.env.SMTP_USER || 'noreply@kajentraders.com',
      },
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags as fallback
    };

    const info = await transporter.sendMail(mailOptions);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Email sent successfully:', {
        to,
        subject,
        messageId: info.messageId,
      });
    }
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    throw error;
  }
}

/**
 * Send email verification email
 * @param to - User email address
 * @param verificationUrl - Verification URL
 */
export async function sendEmailVerification(
  to: string,
  verificationUrl: string
): Promise<void> {
  const subject = 'Verify Your Email - Kajen Traders';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Verify Your Email</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        .button {
          display: inline-block;
          background: #007bff;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Welcome to Kajen Traders!</h1>
        <p>Please verify your email address to complete your registration.</p>
      </div>
      
      <h2>Verify Your Email</h2>
      <p>Thank you for signing up with Kajen Traders. To complete your registration and start using our services, please verify your email address by clicking the button below:</p>
      
      <div style="text-align: center;">
        <a href="${verificationUrl}" class="button">Verify Email Address</a>
      </div>
      
      <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
      <p><a href="${verificationUrl}">${verificationUrl}</a></p>
      
      <p><strong>Important:</strong> This verification link will expire in 24 hours for security reasons.</p>
      
      <div class="footer">
        <p>If you didn't create an account with Kajen Traders, please ignore this email.</p>
        <p>For support, contact us at support@kajentraders.com</p>
      </div>
    </body>
    </html>
  `;

  await sendEmail(to, subject, html);
}

/**
 * Send password reset email
 * @param to - User email address
 * @param resetUrl - Password reset URL
 */
export async function sendPasswordReset(
  to: string,
  resetUrl: string
): Promise<void> {
  const subject = 'Reset Your Password - Kajen Traders';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Reset Your Password</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        .button {
          display: inline-block;
          background: #dc3545;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Password Reset Request</h1>
        <p>We received a request to reset your password.</p>
      </div>
      
      <h2>Reset Your Password</h2>
      <p>To reset your password, please click the button below:</p>
      
      <div style="text-align: center;">
        <a href="${resetUrl}" class="button">Reset Password</a>
      </div>
      
      <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      
      <p><strong>Important:</strong> This password reset link will expire in 1 hour for security reasons.</p>
      
      <div class="footer">
        <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
        <p>For support, contact us at support@kajentraders.com</p>
      </div>
    </body>
    </html>
  `;

  await sendEmail(to, subject, html);
}
