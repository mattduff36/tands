/**
 * Email Service Module for Taylors & Smiths Bouncy Castles
 * Handles automated email sending for booking confirmations and agreements
 */

import nodemailer from 'nodemailer';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromAddress: string;
  enabled: boolean;
  debug: boolean;
}

export interface BookingEmailData {
  bookingId: number;
  bookingRef: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  castleName: string;
  date: string;
  startDate: string;
  endDate: string;
  eventDuration?: number;
  eventAddress?: string;
  totalCost: number;
  deposit: number;
  notes?: string;
  agreementUrl?: string;
}

// Format hire duration for display in emails
function formatHireDuration(eventDuration?: number): string {
  if (!eventDuration) {
    return 'Standard hire duration';
  }
  
  if (eventDuration === 24) {
    return '24 Hours (Over Night)';
  } else if (eventDuration === 8) {
    return '8 Hours (10:00 - 18:00)';
  } else {
    return `${eventDuration} Hours`;
  }
}

// Get email configuration from environment variables
function getEmailConfig(): EmailConfig {
  return {
    host: process.env.EMAIL_SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_SMTP_PORT || '587'),
    secure: process.env.EMAIL_SMTP_SECURE === 'true',
    user: process.env.EMAIL_SMTP_USER || '',
    pass: process.env.EMAIL_SMTP_PASS || '',
    fromName: process.env.EMAIL_FROM_NAME || 'Taylors & Smiths Bouncy Castles',
    fromAddress: process.env.EMAIL_FROM_ADDRESS || '',
    enabled: process.env.EMAIL_ENABLED === 'true',
    debug: process.env.EMAIL_DEBUG === 'true'
  };
}

// Create nodemailer transporter
function createTransporter() {
  const config = getEmailConfig();
  
  if (!config.user || !config.pass) {
    throw new Error('Email SMTP credentials not configured. Please set EMAIL_SMTP_USER and EMAIL_SMTP_PASS environment variables.');
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
}

// Generate tracking pixel HTML for email opens
function generateTrackingPixel(bookingId: number): string {
  const trackingEnabled = process.env.EMAIL_TRACKING_PIXEL_ENABLED === 'true';
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  if (!trackingEnabled) return '';
  
  return `<img src="${baseUrl}/api/email/track/open/${bookingId}" width="1" height="1" style="display:none;" alt="" />`;
}

// Send agreement email to customer
export async function sendAgreementEmail(bookingData: BookingEmailData): Promise<boolean> {
  const config = getEmailConfig();
  
  if (!config.enabled) {
    console.log('Email service disabled. Would send agreement email to:', bookingData.customerEmail);
    return false;
  }

  try {
    const transporter = createTransporter();
    const baseUrl = process.env.NEXT_PUBLIC_AGREEMENT_BASE_URL || 'http://localhost:3000/hire-agreement';
    const agreementUrl = `${baseUrl}?ref=${bookingData.bookingRef}`;
    const trackingPixel = generateTrackingPixel(bookingData.bookingId);

    const mailOptions = {
      from: `"${config.fromName}" <${config.fromAddress}>`,
      to: bookingData.customerEmail,
      subject: `Hire Agreement - ${bookingData.bookingRef} | ${config.fromName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Hire Agreement Required</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">🏰 Hire Agreement Required</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Your booking is confirmed - please sign the agreement</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <p style="font-size: 18px; margin-top: 0;">Hi ${bookingData.customerName},</p>
            
            <p>Great news! Your bouncy castle booking has been <strong>confirmed</strong> and we're excited to make your event amazing! 🎉</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #667eea;">📋 Booking Details</h3>
              <p><strong>Booking Reference:</strong> ${bookingData.bookingRef}</p>
              <p><strong>Customer Name:</strong> ${bookingData.customerName}</p>
              <p><strong>Contact Number:</strong> ${bookingData.customerPhone}</p>
              <p><strong>Bouncy Castle:</strong> ${bookingData.castleName}</p>
              ${bookingData.eventAddress ? `<p><strong>Event Address:</strong> ${bookingData.eventAddress}</p>` : ''}
              <p><strong>Event Date:</strong> ${new Date(bookingData.date).toLocaleDateString('en-GB', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
              <p><strong>Hire Duration:</strong> ${formatHireDuration(bookingData.eventDuration)}</p>
              <p><strong>Special Requests:</strong> ${bookingData.notes || '[none]'}</p>
              <p><strong>Total Cost:</strong> £${bookingData.totalCost.toFixed(2)}</p>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;"><strong>⚠️ Action Required:</strong> Please sign the hire agreement to complete your booking.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${agreementUrl}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                📝 Sign Hire Agreement
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px;">
              <strong>Need help?</strong> Reply to this email or call us. We're here to ensure your event is perfect!<br>
              <br>
              Best regards,<br>
              <strong>${config.fromName}</strong><br>
              Making memories, one bounce at a time! 🎈
            </p>
            
            <p style="font-size: 12px; color: #999; text-align: center; margin-top: 20px;">
              Booking Reference: ${bookingData.bookingRef} | This is an automated message
            </p>
          </div>
          ${trackingPixel}
        </body>
        </html>
      `,
      text: `
Hi ${bookingData.customerName},

Your bouncy castle booking has been confirmed! 

Booking Details:
- Booking Reference: ${bookingData.bookingRef}
- Customer Name: ${bookingData.customerName}
- Contact Number: ${bookingData.customerPhone}
- Bouncy Castle: ${bookingData.castleName}${bookingData.eventAddress ? `
- Event Address: ${bookingData.eventAddress}` : ''}
- Event Date: ${new Date(bookingData.date).toLocaleDateString('en-GB')}
- Hire Duration: ${formatHireDuration(bookingData.eventDuration)}
- Special Requests: ${bookingData.notes || '[none]'}
- Total Cost: £${bookingData.totalCost.toFixed(2)}

ACTION REQUIRED: Please sign the hire agreement to complete your booking.
Agreement Link: ${agreementUrl}

Best regards,
${config.fromName}
      `
    };

    const result = await transporter.sendMail(mailOptions);
    
    if (config.debug) {
      console.log('Agreement email sent successfully:', result.messageId);
      console.log('Preview URL:', nodemailer.getTestMessageUrl(result));
    }

    // Track email sent (disabled - database schema doesn't include email tracking columns)
    // await trackAgreementEmailInteraction(bookingData.bookingId, 'email_sent', {
    //   to: bookingData.customerEmail,
    //   subject: mailOptions.subject,
    //   messageId: result.messageId
    // });

    return true;
  } catch (error) {
    console.error('Error sending agreement email:', error);
    return false;
  }
}

// Send booking received email when a new booking is submitted
export async function sendBookingReceivedEmail(bookingData: BookingEmailData): Promise<boolean> {
  const config = getEmailConfig();
  
  if (!config.enabled) {
    console.log('Email service disabled. Would send booking received email to:', bookingData.customerEmail);
    return false;
  }

  try {
    const transporter = createTransporter();
    const trackingPixel = generateTrackingPixel(bookingData.bookingId);

    const mailOptions = {
      from: `"${config.fromName}" <${config.fromAddress}>`,
      to: bookingData.customerEmail,
      subject: `Booking Request Received - ${bookingData.bookingRef} | ${config.fromName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Booking Request Received</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">📋 Booking Request Received!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Thank you for your booking request</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <p style="font-size: 18px; margin-top: 0;">Hi ${bookingData.customerName},</p>
            
            <p>Thank you for your bouncy castle booking request! We've received all your details and someone from our team will be in touch with you soon to confirm your booking and arrange the hire agreement.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #667eea;">📋 Your Booking Request</h3>
              <p><strong>Booking Reference:</strong> ${bookingData.bookingRef}</p>
              <p><strong>Customer Name:</strong> ${bookingData.customerName}</p>
              <p><strong>Contact Number:</strong> ${bookingData.customerPhone}</p>
              <p><strong>Bouncy Castle:</strong> ${bookingData.castleName}</p>
              ${bookingData.eventAddress ? `<p><strong>Event Address:</strong> ${bookingData.eventAddress}</p>` : ''}
              <p><strong>Event Date:</strong> ${new Date(bookingData.date).toLocaleDateString('en-GB', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
              <p><strong>Hire Duration:</strong> ${formatHireDuration(bookingData.eventDuration)}</p>
              <p><strong>Special Requests:</strong> ${bookingData.notes || '[none]'}</p>
              <p><strong>Total Cost:</strong> £${bookingData.totalCost.toFixed(2)}</p>
            </div>
            
            <div style="background: #e3f2fd; border: 1px solid #2196f3; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #1976d2;"><strong>📞 What happens next?</strong></p>
              <ul style="margin: 10px 0; padding-left: 20px; color: #1976d2;">
                <li>We'll review your booking request within 24 hours</li>
                <li>Someone from our team will call or email you to confirm availability</li>
                <li>Once confirmed, you'll receive a hire agreement to sign</li>
                <li>After signing, your booking will be fully confirmed</li>
              </ul>
            </div>
            
            <p>If you have any questions or need to make changes to your request, please don't hesitate to get in touch by replying to this email or giving us a call.</p>
            
            <p style="font-size: 14px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px;">
              Thank you for choosing us for your special event! We look forward to making it unforgettable.<br>
              <br>
              Best regards,<br>
              <strong>${config.fromName}</strong><br>
              Making memories, one bounce at a time! 🎈
            </p>
            
            <p style="font-size: 12px; color: #999; text-align: center; margin-top: 20px;">
              Booking Reference: ${bookingData.bookingRef} | This is an automated message
            </p>
          </div>
          ${trackingPixel}
        </body>
        </html>
      `,
      text: `
Hi ${bookingData.customerName},

Thank you for your bouncy castle booking request! We've received all your details and someone from our team will be in touch with you soon.

Your Booking Request:
- Booking Reference: ${bookingData.bookingRef}
- Customer Name: ${bookingData.customerName}
- Contact Number: ${bookingData.customerPhone}
- Bouncy Castle: ${bookingData.castleName}${bookingData.eventAddress ? `
- Event Address: ${bookingData.eventAddress}` : ''}
- Event Date: ${new Date(bookingData.date).toLocaleDateString('en-GB')}
- Hire Duration: ${formatHireDuration(bookingData.eventDuration)}
- Special Requests: ${bookingData.notes || '[none]'}
- Total Cost: £${bookingData.totalCost.toFixed(2)}

What happens next?
- We'll review your booking request within 24 hours
- Someone from our team will call or email you to confirm availability
- Once confirmed, you'll receive a hire agreement to sign
- After signing, your booking will be fully confirmed

Best regards,
${config.fromName}
      `
    };

    const result = await transporter.sendMail(mailOptions);
    
    if (config.debug) {
      console.log('Booking received email sent successfully:', result.messageId);
      console.log('Preview URL:', nodemailer.getTestMessageUrl(result));
    }

    return true;
  } catch (error) {
    console.error('Error sending booking received email:', error);
    return false;
  }
}

// Send confirmation email after agreement is signed
export async function sendConfirmationEmail(bookingData: BookingEmailData): Promise<boolean> {
  const config = getEmailConfig();
  
  if (!config.enabled) {
    console.log('Email service disabled. Would send confirmation email to:', bookingData.customerEmail);
    return false;
  }

  try {
    const transporter = createTransporter();
    const trackingPixel = generateTrackingPixel(bookingData.bookingId);

    const mailOptions = {
      from: `"${config.fromName}" <${config.fromAddress}>`,
      to: bookingData.customerEmail,
      subject: `Booking Confirmed - ${bookingData.bookingRef} | ${config.fromName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Booking Confirmed</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #00b894 0%, #00a085 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">✅ Booking Confirmed!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Everything is ready for your event</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <p style="font-size: 18px; margin-top: 0;">Hi ${bookingData.customerName},</p>
            
            <p>Fantastic! Your hire agreement has been signed and your booking is now <strong>fully confirmed</strong>. We can't wait to help make your event incredible! 🎉</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #00b894; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #00b894;">🎯 Your Confirmed Booking</h3>
              <p><strong>Booking Reference:</strong> ${bookingData.bookingRef}</p>
              <p><strong>Customer Name:</strong> ${bookingData.customerName}</p>
              <p><strong>Contact Number:</strong> ${bookingData.customerPhone}</p>
              <p><strong>Bouncy Castle:</strong> ${bookingData.castleName}</p>
              ${bookingData.eventAddress ? `<p><strong>Event Address:</strong> ${bookingData.eventAddress}</p>` : ''}
              <p><strong>Event Date:</strong> ${new Date(bookingData.date).toLocaleDateString('en-GB', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
              <p><strong>Hire Duration:</strong> ${formatHireDuration(bookingData.eventDuration)}</p>
              <p><strong>Special Requests:</strong> ${bookingData.notes || '[none]'}</p>
              <p><strong>Total Cost:</strong> £${bookingData.totalCost.toFixed(2)}</p>
              <p><strong>Deposit Paid:</strong> £${bookingData.deposit.toFixed(2)}</p>
            </div>
            
            <div style="background: #d1f2eb; border: 1px solid #00b894; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #00b894;"><strong>🚚 What happens next?</strong></p>
              <ul style="margin: 10px 0; padding-left: 20px; color: #00b894;">
                <li>We'll call you closer to the date to confirm delivery details</li>
                <li>Our team will arrive on time to set up your bouncy castle</li>
                <li>Safety briefing will be provided on-site</li>
                <li>Collection will be arranged at the agreed time</li>
              </ul>
            </div>
            
            <p>Please keep this email as your booking confirmation. If you need to make any changes or have questions, just reply to this email or give us a call.</p>
            
            <p style="font-size: 14px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px;">
              Thank you for choosing us for your special event! We're committed to making it unforgettable.<br>
              <br>
              Best regards,<br>
              <strong>${config.fromName}</strong><br>
              Making memories, one bounce at a time! 🎈
            </p>
            
            <p style="font-size: 12px; color: #999; text-align: center; margin-top: 20px;">
              Booking Reference: ${bookingData.bookingRef} | Keep this email for your records
            </p>
          </div>
          ${trackingPixel}
        </body>
        </html>
      `,
      text: `
Hi ${bookingData.customerName},

Your booking is now fully confirmed! 

Booking Details:
- Booking Reference: ${bookingData.bookingRef}
- Customer Name: ${bookingData.customerName}
- Contact Number: ${bookingData.customerPhone}
- Bouncy Castle: ${bookingData.castleName}${bookingData.eventAddress ? `
- Event Address: ${bookingData.eventAddress}` : ''}
- Event Date: ${new Date(bookingData.date).toLocaleDateString('en-GB')}
- Hire Duration: ${formatHireDuration(bookingData.eventDuration)}
- Special Requests: ${bookingData.notes || '[none]'}
- Total Cost: £${bookingData.totalCost.toFixed(2)}
- Deposit Paid: £${bookingData.deposit.toFixed(2)}

What happens next?
- We'll call you closer to the date to confirm delivery details
- Our team will arrive on time to set up your bouncy castle
- Safety briefing will be provided on-site
- Collection will be arranged at the agreed time

Thank you for choosing ${config.fromName}!
      `
    };

    const result = await transporter.sendMail(mailOptions);
    
    if (config.debug) {
      console.log('Confirmation email sent successfully:', result.messageId);
      console.log('Preview URL:', nodemailer.getTestMessageUrl(result));
    }

    return true;
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return false;
  }
}

// Test email configuration
export async function testEmailConfiguration(): Promise<{ success: boolean; message: string; details?: any }> {
  const config = getEmailConfig();
  
  if (!config.enabled) {
    return { success: false, message: 'Email service is disabled (EMAIL_ENABLED=false)' };
  }

  if (!config.user || !config.pass) {
    return { success: false, message: 'Email SMTP credentials not configured' };
  }

  try {
    const transporter = createTransporter();
    await transporter.verify();
    
    return { 
      success: true, 
      message: 'Email configuration is valid and SMTP server is reachable',
      details: {
        host: config.host,
        port: config.port,
        secure: config.secure,
        user: config.user,
        fromName: config.fromName,
        fromAddress: config.fromAddress
      }
    };
  } catch (error: any) {
    return { 
      success: false, 
      message: `Email configuration test failed: ${error.message}`,
      details: error
    };
  }
}