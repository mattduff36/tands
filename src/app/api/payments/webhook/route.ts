import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { STRIPE_CONFIG } from '@/lib/stripe';

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
    
    if (!bookingRef) {
      console.error('No booking reference found in payment intent metadata');
      return;
    }

    // Update booking in database with payment information
    // This would typically be a database call to update the booking record
    console.log(`Updating booking ${bookingRef} with successful payment ${paymentIntent.id}`);
    
    // Example database update (replace with your actual database logic):
    /*
    await updateBooking(bookingRef, {
      paymentStatus: 'paid',
      paymentIntentId: paymentIntent.id,
      depositAmount: paymentIntent.amount / 100, // Convert from pence to pounds
      paymentDate: new Date(),
      paymentMethod: 'stripe',
    });
    */

    // Send confirmation email to customer
    // await sendPaymentConfirmationEmail(paymentIntent.metadata.customerEmail, paymentIntent);
    
  } catch (error) {
    console.error('Error updating booking after payment success:', error);
  }
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  try {
    const bookingRef = paymentIntent.metadata.bookingRef;
    
    if (!bookingRef) {
      console.error('No booking reference found in payment intent metadata');
      return;
    }

    console.log(`Payment failed for booking ${bookingRef}: ${paymentIntent.id}`);
    
    // Update booking status to reflect payment failure
    // await updateBooking(bookingRef, { paymentStatus: 'failed' });
    
    // Send failure notification email
    // await sendPaymentFailureEmail(paymentIntent.metadata.customerEmail, paymentIntent);
    
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

async function handlePaymentCancellation(paymentIntent: Stripe.PaymentIntent) {
  try {
    const bookingRef = paymentIntent.metadata.bookingRef;
    
    if (!bookingRef) {
      console.error('No booking reference found in payment intent metadata');
      return;
    }

    console.log(`Payment canceled for booking ${bookingRef}: ${paymentIntent.id}`);
    
    // Update booking status to reflect payment cancellation
    // await updateBooking(bookingRef, { paymentStatus: 'cancelled' });
    
  } catch (error) {
    console.error('Error handling payment cancellation:', error);
  }
}