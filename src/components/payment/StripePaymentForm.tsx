'use client';

import { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import stripePromise, { STRIPE_APPEARANCE } from '@/lib/stripe';
import { StripeCheckoutForm } from './StripeCheckoutForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StripePaymentFormProps {
  bookingRef: string;
  customerName: string;
  customerEmail: string;
  depositAmount: number; // Amount to be paid (deposit or full amount depending on payment method)
  paymentType?: 'deposit' | 'full'; // Type of payment being made
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
}

export function StripePaymentForm({
  bookingRef,
  customerName,
  customerEmail,
  depositAmount,
  paymentType = 'deposit',
  onPaymentSuccess,
  onPaymentError,
}: StripePaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Create payment intent when component mounts
    createPaymentIntent();
  }, [bookingRef, depositAmount]);

  const createPaymentIntent = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch('/api/payments/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingRef,
          amount: Math.round(depositAmount * 100), // Convert to pence
          customerName,
          customerEmail,
          description: `${paymentType === 'full' ? 'Full payment' : 'Deposit payment'} for bouncy castle booking ${bookingRef}`,
          paymentType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize payment';
      setError(errorMessage);
      onPaymentError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border-2 border-green-200">
        <CardContent className="pt-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Initializing secure payment...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-50 border-2 border-red-200">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Payment Initialization Failed</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={createPaymentIntent}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Try Again
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!clientSecret) {
    return null;
  }

  const options = {
    clientSecret,
    appearance: STRIPE_APPEARANCE,
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <Card className="bg-white/90 backdrop-blur-sm border-2 border-green-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-800 flex items-center">
            <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            {paymentType === 'full' ? 'Secure Full Payment' : 'Secure Deposit Payment'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
            <div className="flex justify-between items-center">
              <span className="font-medium text-blue-800">
                {paymentType === 'full' ? 'Total Amount:' : 'Deposit Required:'}
              </span>
              <span className="font-bold text-blue-800 text-lg">£{depositAmount.toFixed(2)}</span>
            </div>
            <p className="text-sm text-blue-700 mt-2">
              {paymentType === 'full' 
                ? 'This is the complete payment for your booking.' 
                : 'This secures your booking. The remaining balance will be collected on delivery.'
              }
            </p>
          </div>

          <StripeCheckoutForm
            bookingRef={bookingRef}
            customerName={customerName}
            customerEmail={customerEmail}
            depositAmount={depositAmount}
            onPaymentSuccess={onPaymentSuccess}
            onPaymentError={onPaymentError}
          />

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 1L5 6l5 5 5-5-5-5zM10 11l5 5-5 5-5-5 5-5z" clipRule="evenodd" />
              </svg>
              <span>Secured by Stripe • PCI DSS Level 1 Compliant</span>
            </div>
            <div className="flex items-center justify-center space-x-4 mt-2">
              <img src="https://js.stripe.com/v3/fingerprinted/img/visa-729c05c240c4bdb47b03ac81d9945bfe.svg" alt="Visa" className="h-6" />
              <img src="https://js.stripe.com/v3/fingerprinted/img/mastercard-4d8844094130711885b5e41b28c9848f.svg" alt="Mastercard" className="h-6" />
              <img src="https://js.stripe.com/v3/fingerprinted/img/amex-a49b82f46c5cd31dc8da393d35ca2eb7.svg" alt="American Express" className="h-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Elements>
  );
}