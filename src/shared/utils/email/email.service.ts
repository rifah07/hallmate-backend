import { Resend } from 'resend';
import { env } from '@/config/env.config';
import logger from '../logger.util';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  /**
   * Send email
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      // If no API key in development, just log
      if (!process.env.RESEND_API_KEY && env.NODE_ENV === 'development') {
        logger.info('📧 Email would be sent (dev mode):');
        logger.info(`To: ${options.to}`);
        logger.info(`Subject: ${options.subject}`);
        logger.info(`Body: ${options.html.substring(0, 100)}...`);
        return;
      }

      await resend.emails.send({
        from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
        to: env.NODE_ENV === 'development' ? 'rifahsajida7@gmail.com' : options.to,
        subject: options.subject,
        html: options.html,
      });

      logger.info(`✅ Email sent to ${options.to}`);
    } catch (error) {
      logger.error('❌ Email sending failed:', error);
      throw new Error('Failed to send email');
    }
  }

  /**
   * Send OTP email for password reset
   */
  async sendPasswordResetOTP(email: string, name: string, otp: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .otp-box { background: #fff; border: 2px dashed #3498db; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #777; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Dear <strong>${name}</strong>,</p>
              <p>We received a request to reset your password for your HallMate account.</p>
              
              <p><strong>Your Password Reset OTP:</strong></p>
              <div class="otp-box">${otp}</div>
              
              <div class="warning">
                <strong>⚠️ Important:</strong>
                <ul style="margin: 10px 0;">
                  <li>This OTP is valid for <strong>15 minutes</strong> only</li>
                  <li>Do not share this OTP with anyone</li>
                  <li>If you didn't request this, please ignore this email</li>
                </ul>
              </div>
              
              <p>To reset your password, enter this OTP in the password reset form.</p>
              
              <p>If you have any questions, please contact the hall office.</p>
              
              <p>Best regards,<br>HallMate Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; 2026 HallMate. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Password Reset OTP - HallMate',
      html,
    });
  }

  /**
   * Send password changed confirmation
   */
  async sendPasswordChangedConfirmation(email: string, name: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #27ae60; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #777; }
            .alert { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Password Changed Successfully</h1>
            </div>
            <div class="content">
              <p>Dear <strong>${name}</strong>,</p>
              
              <div class="alert">
                <p><strong>Your password has been changed successfully.</strong></p>
              </div>
              
              <p>If you did not make this change, please contact the hall office immediately.</p>
              
              <p>For security reasons, you may want to:</p>
              <ul>
                <li>Review your recent account activity</li>
                <li>Ensure your email account is secure</li>
                <li>Use a strong, unique password</li>
              </ul>
              
              <p>Best regards,<br>HallMate Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; 2026 HallMate. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Password Changed - HallMate',
      html,
    });
  }
}

export default new EmailService();
