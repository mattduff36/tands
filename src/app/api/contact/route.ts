import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { contactSchema, validateAndSanitize } from '@/lib/validation/schemas';
import { createSanitizedErrorResponse, logSafeError } from '@/lib/utils/error-sanitizer';

const smtpUser = process.env.EMAIL_SMTP_USER;
const smtpPass = process.env.EMAIL_SMTP_PASS;
const contactEmail = process.env.CONTACT_EMAIL;
const fromName = process.env.EMAIL_FROM_NAME;
const fromAddress = process.env.EMAIL_FROM_ADDRESS;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate and sanitize input data
    let validatedData;
    try {
      validatedData = validateAndSanitize(contactSchema, body);
    } catch (error) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid contact form data', 
        details: error instanceof Error ? error.message : 'Validation failed' 
      }, { status: 400 });
    }

    const { name, email, phone, subject, message } = validatedData;
    if (!smtpUser || !smtpPass || !contactEmail) {
      return NextResponse.json({ success: false, error: 'Server email configuration error.' }, { status: 500 });
    }
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_SMTP_PORT || '587'),
      secure: process.env.EMAIL_SMTP_SECURE === 'true',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
    const mailOptions = {
      from: fromAddress ? `"${fromName}" <${fromAddress}>` : smtpUser,
      to: contactEmail,
      subject: subject || `Contact Form Submission from ${name}`,
      text: `Name: ${name}\nEmail: ${email}${phone ? `\nPhone: ${phone}` : ''}\nSubject: ${subject || 'General Inquiry'}\nMessage: ${message}`,
      replyTo: email,
    };
    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    logSafeError(error, 'contact-form');
    const sanitizedError = createSanitizedErrorResponse(error, 'email', 500);
    return NextResponse.json(sanitizedError, { status: 500 });
  }
} 