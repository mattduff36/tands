'use client';

import { useState } from 'react';
import {
  useStripe,
  useElements,
  PaymentElement,
  AddressElement,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface StripeCheckoutFormProps {
  bookingRef: string;
  customerName: string;
  customerEmail: string;
  depositAmount: number;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
}

export function StripeCheckoutForm({
  bookingRef,
  customerName,
  customerEmail,
  depositAmount,
  onPaymentSuccess,
  onPaymentError,
}: StripeCheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success?bookingRef=${bookingRef}`,
          receipt_email: customerEmail,
        },
        redirect: 'if_required', // Handle success in the same page
      });

      if (error) {
        // Show error to customer (e.g., insufficient funds)
        const errorMessage = error.message || 'An unexpected error occurred.';
        setMessage(errorMessage);
        onPaymentError(errorMessage);
        toast.error(errorMessage);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded
        setMessage('Payment succeeded!');
        toast.success('Payment successful! Your deposit has been processed.');
        onPaymentSuccess(paymentIntent.id);
      } else {
        // Payment requires additional action or failed
        setMessage('Payment status: ' + paymentIntent?.status);
        onPaymentError('Payment could not be completed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setMessage(errorMessage);
      onPaymentError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const paymentElementOptions = {
    layout: 'tabs' as const,
    defaultValues: {
      billingDetails: {
        name: customerName,
        email: customerEmail,
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Element */}
      <div className="space-y-2">
        <h3 className="font-medium text-gray-900">Payment Information</h3>
        <PaymentElement options={paymentElementOptions} />
      </div>

      {/* Address Element */}
      <div className="space-y-2">
        <h3 className="font-medium text-gray-900">Billing Address</h3>
        <AddressElement 
          options={{
            mode: 'billing',
            defaultValues: {
              name: customerName,
            },
          }} 
        />
      </div>

      {/* Error Message */}
      {message && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-red-700 text-sm">{message}</p>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isLoading || !stripe || !elements}
        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-lg transform transition hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing Payment...
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Pay Deposit £{depositAmount.toFixed(2)}
          </div>
        )}
      </Button>

      <div className="text-center">
        <p className="text-xs text-gray-500">
          Your payment is secured with 256-bit SSL encryption
        </p>
      </div>
    </form>
  );
}