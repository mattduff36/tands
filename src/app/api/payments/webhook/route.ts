import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { STRIPE_CONFIG } from '@/lib/stripe';
import { updateBookingPaymentStatus } from '@/lib/database/bookings';

const stripe = new Stripe(STRIPE_CONFIG.secretKey, {
  apiVersion: '2025-07-30.basil',
});

const endpointSecret = STRIPE_CONFIG.webhookSecret;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = headers();
  const sig = headersList.get('stripe-signature');

  let event: Stripe.Event;

  try {
    if (!sig || !endpointSecret) {
      throw new Error('Missing signature or endpoint secret');
    }

    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment succeeded:', paymentIntent.id);
        
        // Update booking with payment information
        await handlePaymentSuccess(paymentIntent);
        break;
      }
      
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment failed:', paymentIntent.id);
        
        // Handle payment failure
        await handlePaymentFailure(paymentIntent);
        break;
      }
      
      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment canceled:', paymentIntent.id);
        
        // Handle payment cancellation
        await handlePaymentCancellation(paymentIntent);
        break;
      }
      
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook event:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  try {
    const bookingRef = paymentIntent.metadata.bookingRef;
    const paymentType = paymentIntent.metadata.type as 'deposit' | 'full';
    
    if (!bookingRef) {
      console.error('No booking reference found in payment intent metadata');
      return;
    }

    console.log(`Processing successful payment for booking ${bookingRef}: ${paymentIntent.id}`);
    
    // Update booking in database with payment information
    await updateBookingPaymentStatus(bookingRef, {
      paymentStatus: 'paid',
      paymentIntentId: paymentIntent.id,
      paymentAmount: paymentIntent.amount, // Already in pence
      paymentType: paymentType || 'deposit',
    });

    console.log(`Successfully updated booking ${bookingRef} with payment status: paid`);

    // TODO: Send confirmation email to customer
    // await sendPaymentConfirmationEmail(paymentIntent.metadata.customerEmail, paymentIntent);
    
  } catch (error) {
    console.error('Error updating booking after payment success:', error);
    throw error; // Re-throw to ensure webhook returns error status
  }
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  try {
    const bookingRef = paymentIntent.metadata.bookingRef;
    const paymentType = paymentIntent.metadata.type as 'deposit' | 'full';
    
    if (!bookingRef) {
      console.error('No booking reference found in payment intent metadata');
      return;
    }

    console.log(`Processing failed payment for booking ${bookingRef}: ${paymentIntent.id}`);
    
    // Get failure reason from payment intent
    const failureReason = paymentIntent.last_payment_error?.message || 'Payment failed';
    
    // Update booking status to reflect payment failure
    await updateBookingPaymentStatus(bookingRef, {
      paymentStatus: 'failed',
      paymentIntentId: paymentIntent.id,
      paymentType: paymentType || 'deposit',
      failureReason: failureReason,
    });

    console.log(`Successfully updated booking ${bookingRef} with payment status: failed`);
    
    // TODO: Send failure notification email
    // await sendPaymentFailureEmail(paymentIntent.metadata.customerEmail, paymentIntent);
    
  } catch (error) {
    console.error('Error handling payment failure:', error);
    throw error; // Re-throw to ensure webhook returns error status
  }
}

async function handlePaymentCancellation(paymentIntent: Stripe.PaymentIntent) {
  try {
    const bookingRef = paymentIntent.metadata.bookingRef;
    const paymentType = paymentIntent.metadata.type as 'deposit' | 'full';
    
    if (!bookingRef) {
      console.error('No booking reference found in payment intent metadata');
      return;
    }

    console.log(`Processing canceled payment for booking ${bookingRef}: ${paymentIntent.id}`);
    
    // Update booking status to reflect payment cancellation
    await updateBookingPaymentStatus(bookingRef, {
      paymentStatus: 'cancelled',
      paymentIntentId: paymentIntent.id,
      paymentType: paymentType || 'deposit',
    });

    console.log(`Successfully updated booking ${bookingRef} with payment status: cancelled`);
    
  } catch (error) {
    console.error('Error handling payment cancellation:', error);
    throw error; // Re-throw to ensure webhook returns error status
  }
}