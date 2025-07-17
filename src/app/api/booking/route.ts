import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const contactEmail = process.env.CONTACT_EMAIL;

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, date, message } = await req.json();
    if (!name || !email || !phone || !date) {
      return NextResponse.json({ success: false, error: 'Missing required fields.' }, { status: 400 });
    }
    // Basic email format validation
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ success: false, error: 'Invalid email format.' }, { status: 400 });
    }
    if (!smtpUser || !smtpPass || !contactEmail) {
      return NextResponse.json({ success: false, error: 'Server email configuration error.' }, { status: 500 });
    }
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
    const mailOptions = {
      from: smtpUser,
      to: contactEmail,
      subject: `Booking Form Submission from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nDate: ${date}\nMessage: ${message || ''}`,
      replyTo: email,
    };
    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Unknown error.' }, { status: 500 });
  }
} 