import { env } from '@/config/env.config';
import logger from '../logger.util';
import { escapeHtml } from '../escape-html.util';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  /**
   * Sends through Resend's HTTP API (free, no card). Until a domain is
   * verified in Resend, it only delivers to the Resend account's own address.
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    // Without a key, outside production, log instead of sending
    if (!env.RESEND_API_KEY) {
      if (env.NODE_ENV === 'production') throw new Error('RESEND_API_KEY is not set');
      logger.info(`📧 Email (not sent, no RESEND_API_KEY) to ${options.to}: ${options.subject}`);
      logger.debug(options.html);
      return;
    }

    // In development, all mail can go to one inbox instead of real people
    const to = env.NODE_ENV === 'development' && env.DEV_EMAIL_TO ? env.DEV_EMAIL_TO : options.to;
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: `${env.EMAIL_FROM_NAME} <${env.EMAIL_FROM}>`,
        to: [to],
        subject: options.subject,
        html: options.html,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      // The body explains (unverified domain, quota...); never log the key
      logger.error(`Email to ${to} failed: ${res.status} ${await res.text()}`);
      throw new Error('Email could not be sent');
    }
    logger.info(`📧 Email sent to ${to}: ${options.subject}`);
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
              <p>Dear <strong>${escapeHtml(name)}</strong>,</p>
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
              <p>Dear <strong>${escapeHtml(name)}</strong>,</p>
              
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

  /**
   * Send welcome email with OTP for new users (USER MODULE)
   */
  async sendWelcomeEmail(email: string, name: string, otp: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .otp-box { background: #fff; border: 2px solid #4F46E5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; color: #4F46E5; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #777; }
            .info-box { background: #e0e7ff; border-left: 4px solid #4F46E5; padding: 15px; margin: 20px 0; }
            .steps { background: #fff; padding: 20px; margin: 20px 0; border-radius: 5px; }
            .steps ol { margin: 10px 0; padding-left: 20px; }
            .steps li { margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to HallMate!</h1>
            </div>
            <div class="content">
              <p>Dear <strong>${escapeHtml(name)}</strong>,</p>
              
              <p>Your HallMate account has been created successfully by the hall administration.</p>
              
              <div class="info-box">
                <p><strong>📝 Next Step: Set Your Password</strong></p>
                <p>Use the One-Time Password (OTP) below to complete your first-time login and set your permanent password.</p>
              </div>
              
              <p><strong>Your One-Time Password (OTP):</strong></p>
              <div class="otp-box">${otp}</div>
              
              <div class="steps">
                <p><strong>How to complete your setup:</strong></p>
                <ol>
                  <li>Go to the HallMate login page</li>
                  <li>Select "First-Time Login"</li>
                  <li>Enter your University ID and this OTP</li>
                  <li>Create a strong permanent password</li>
                  <li>Start using HallMate!</li>
                </ol>
              </div>
              
              <div class="info-box">
                <strong>⚠️ Security Notice:</strong>
                <ul style="margin: 10px 0;">
                  <li>This OTP is valid for <strong>24 hours</strong></li>
                  <li>Keep this OTP confidential</li>
                  <li>You'll be required to change your password on first login</li>
                </ul>
              </div>
              
              <p>If you have any questions or didn't expect this email, please contact the hall administration.</p>
              
              <p>Best regards,<br><strong>HallMate Team</strong></p>
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
      subject: '🎉 Welcome to HallMate - Set Your Password',
      html,
    });
  }

  /**
   * Send account deletion notification (USER MODULE)
   */
  /** In-app notifications that also matter by email (decisions, bills, account changes). */
  async sendNotificationEmail(
    email: string,
    name: string,
    title: string,
    message: string,
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: `HallMate: ${title}`,
      html: `<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #2d2a32;">
        <div style="max-width: 560px; margin: 0 auto; padding: 24px;">
          <p>Dear <strong>${escapeHtml(name)}</strong>,</p>
          <h2 style="font-size: 18px; color: #4a3b5c;">${escapeHtml(title)}</h2>
          <p>${escapeHtml(message)}</p>
          <p style="font-size: 12px; color: #777;">Sign in to HallMate to see the details.</p>
        </div></body></html>`,
    });
  }

  async sendAccountDeletionEmail(email: string, name: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #777; }
            .alert { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
            .contact-box { background: #fff; padding: 20px; margin: 20px 0; border: 1px solid #ddd; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Account Deletion Notice</h1>
            </div>
            <div class="content">
              <p>Dear <strong>${escapeHtml(name)}</strong>,</p>
              
              <div class="alert">
                <p><strong>Your HallMate account has been deleted by a hall administrator.</strong></p>
              </div>
              
              <p>This means:</p>
              <ul>
                <li>You can no longer access your HallMate account</li>
                <li>Your personal data has been removed from the system</li>
                <li>All your applications and records have been archived</li>
              </ul>
              
              <div class="contact-box">
                <p><strong> Think this is a mistake?</strong></p>
                <p>If you believe your account was deleted in error, please contact the hall administration immediately:</p>
                <ul style="margin: 10px 0;">
                  <li><strong>Hall Office:</strong> Visit during office hours (9 AM - 5 PM)</li>
                  <li><strong>Provost Office:</strong> For urgent matters</li>
                  <li><strong>Email:</strong> halloffice@university.edu.bd</li>
                </ul>
              </div>
              
              <p>If you have any questions, please don't hesitate to reach out to the hall administration.</p>
              
              <p>Best regards,<br><strong>HallMate Team</strong></p>
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
      subject: '⚠️ Account Deletion Notice - HallMate',
      html,
    });
  }
}

export default new EmailService();
