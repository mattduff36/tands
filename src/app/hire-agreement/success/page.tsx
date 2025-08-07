"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

function HireAgreementSuccessContent() {
  const searchParams = useSearchParams();
  const bookingRef = searchParams.get("bookingRef");
  const [agreementSignedAt, setAgreementSignedAt] = useState<string>("");

  useEffect(() => {
    if (searchParams.get("agreementSignedAt")) {
      setAgreementSignedAt(searchParams.get("agreementSignedAt")!);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8 pt-24 sm:pt-28">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="text-center">
          <CardHeader>
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
              Hire Agreement Signed Successfully!
            </CardTitle>
            {bookingRef && (
              <Badge variant="secondary" className="mx-auto">
                {bookingRef}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Thank you for signing the hire agreement. Your booking has been confirmed and we look forward to providing you with a fantastic bouncy castle experience!
              </p>
              
              {agreementSignedAt && (
                <p className="text-sm text-gray-500">
                  Agreement signed on {format(new Date(agreementSignedAt), "EEEE, MMMM do, yyyy 'at' h:mm a")}
                </p>
              )}
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">What happens next?</h3>
              <ul className="text-sm text-gray-700 space-y-1 text-left">
                <li>• We'll contact you within 24 hours to confirm delivery details</li>
                <li>• Your castle will be delivered on the agreed date</li>
                <li>• Payment will be collected upon delivery</li>
                <li>• We'll provide safety instructions and setup on the day</li>
              </ul>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Important Reminders</h3>
              <ul className="text-sm text-gray-700 space-y-1 text-left">
                <li>• Please ensure someone is available for delivery and collection</li>
                <li>• Have the delivery address ready and accessible</li>
                <li>• Prepare payment method (cash on delivery or online payment)</li>
                <li>• Review safety instructions before use</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => window.location.href = '/'}
                className="bg-red-600 hover:bg-red-700"
              >
                Return to Homepage
              </Button>
              <Button
                onClick={() => window.location.href = '/contact'}
                variant="outline"
              >
                Contact Us
              </Button>
            </div>

            <p className="text-xs text-gray-500">
              A copy of your signed agreement has been sent to your email address. 
              Please keep this for your records.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function HireAgreementSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-24 sm:pt-28">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading success page...</p>
        </div>
      </div>
    }>
      <HireAgreementSuccessContent />
    </Suspense>
  );
} 