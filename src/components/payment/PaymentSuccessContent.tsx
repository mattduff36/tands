'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const bookingRef = searchParams.get('bookingRef');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Add any additional verification or tracking here
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-24 sm:pt-28">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Confirming your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8 pt-24 sm:pt-28">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="bg-white shadow-xl border-0">
          <CardHeader className="text-center pb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
              Payment Successful! 🎉
            </CardTitle>
            <p className="text-lg text-gray-600">
              Your deposit has been processed successfully
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {bookingRef && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-blue-900">Booking Reference:</span>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {bookingRef}
                  </Badge>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 text-lg">What happens next?</h3>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-sm font-semibold">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Confirmation Email</p>
                    <p className="text-gray-600 text-sm">You'll receive a payment receipt and booking confirmation email shortly.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-sm font-semibold">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Booking Secured</p>
                    <p className="text-gray-600 text-sm">Your booking is now confirmed and secured in our calendar.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-sm font-semibold">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Delivery Day</p>
                    <p className="text-gray-600 text-sm">We'll deliver and set up your bouncy castle. The remaining balance is due on delivery.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-medium text-yellow-800 text-sm">Important Reminder</p>
                  <p className="text-yellow-700 text-sm">Please keep this booking reference safe. You'll need it for any future correspondence about your booking.</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={() => window.location.href = '/'}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Return to Homepage
                </Button>
                <Button 
                  onClick={() => window.location.href = '/contact'}
                  variant="outline"
                  className="flex-1"
                >
                  Contact Us
                </Button>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  Need help? Call us on{' '}
                  <a href="tel:+447123456789" className="text-blue-600 hover:underline">
                    07123 456789
                  </a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}