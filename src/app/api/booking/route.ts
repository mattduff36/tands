import { NextRequest, NextResponse } from 'next/server';
import { createPendingBooking } from '@/lib/database/bookings';
import nodemailer from 'nodemailer';

const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const contactEmail = process.env.CONTACT_EMAIL;

export async function POST(req: NextRequest) {
  try {
    const bookingData = await req.json();
    
    // Validate required fields
    const { 
      castleId, 
      castleName, 
      date, 
      customerName, 
      customerEmail, 
      customerPhone, 
      customerAddress, 
      paymentMethod, 
      totalPrice, 
      deposit 
    } = bookingData;

    if (!castleId || !castleName || !date || !customerName || !customerEmail || !customerPhone || !customerAddress || !paymentMethod || !totalPrice) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields.' 
      }, { status: 400 });
    }

    // Basic email format validation
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(customerEmail)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid email format.' 
      }, { status: 400 });
    }

    // Create pending booking in database
    const pendingBooking = await createPendingBooking({
      castleId: parseInt(castleId),
      castleName,
      date,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      paymentMethod,
      totalPrice,
      deposit: deposit || Math.floor(totalPrice * 0.3), // Default to 30% deposit if not provided
      notes: bookingData.notes || ''
    });

    // Send email notification (if email is configured)
    if (smtpUser && smtpPass && contactEmail) {
      try {
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
          subject: `New Booking Request - ${customerName}`,
          text: `
New booking request received:

Booking Reference: ${pendingBooking.bookingRef}
Customer: ${customerName}
Email: ${customerEmail}
Phone: ${customerPhone}
Address: ${customerAddress}
Castle: ${castleName}
Date: ${date}
Payment Method: ${paymentMethod}
Total Price: £${totalPrice}
Deposit: £${pendingBooking.deposit}

Please review and confirm this booking in the admin panel.
          `,
          replyTo: customerEmail,
        };

        await transporter.sendMail(mailOptions);
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't fail the booking if email fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      bookingRef: pendingBooking.bookingRef,
      message: 'Booking request submitted successfully. We will contact you within 24 hours to confirm your booking.'
    });

  } catch (error: any) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Unknown error.' 
    }, { status: 500 });
  }
} 