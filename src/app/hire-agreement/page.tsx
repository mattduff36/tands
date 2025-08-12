"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { toast } from "sonner";
import { StripePaymentForm } from "@/components/payment/StripePaymentForm";

interface BookingDetails {
  bookingRef: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  castleName: string;
  date: string;
  totalPrice: number;
  deposit: number;
  paymentMethod: string;
}

function HireAgreementContent() {
  const searchParams = useSearchParams();
  const bookingRef = searchParams.get("ref") || searchParams.get("bookingRef");
  
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');
  const [isEditingPaymentMethod, setIsEditingPaymentMethod] = useState(false);
  const [newPaymentMethod, setNewPaymentMethod] = useState("");

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (bookingRef) {
      fetchBookingDetails();
    } else {
      setIsLoading(false);
    }
  }, [bookingRef]);

    const fetchBookingDetails = async () => {
    try {
      const response = await fetch(`/api/bookings/${bookingRef}`);
      if (response.ok) {
        const data = await response.json();
        if (data.booking) {
          const booking = data.booking;
          setBookingDetails({
            bookingRef: booking.bookingRef,
            customerName: booking.customerName,
            customerEmail: booking.customerEmail,
            customerPhone: booking.customerPhone,
            customerAddress: booking.customerAddress,
            castleName: booking.castleName,
            date: booking.date,
            totalPrice: booking.totalPrice,
            deposit: booking.deposit,
            paymentMethod: booking.paymentMethod,
          });
        }
      } else {
        console.error('Failed to fetch booking:', response.status, response.statusText);
        toast.error("Failed to load booking details");
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
      toast.error("Failed to load booking details");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentIntentId: string) => {
    setPaymentCompleted(true);
    setPaymentIntentId(paymentIntentId);
    toast.success("Payment successful! You can now complete the hire agreement.");
  };

  const handlePaymentError = (error: string) => {
    toast.error(`Payment failed: ${error}`);
    setPaymentCompleted(false);
  };

  const handlePaymentMethodChange = async (method: string) => {
    if (!bookingDetails) return;

    try {
      const response = await fetch(`/api/bookings/${bookingDetails.bookingRef}/update-payment-method`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethod: method,
        }),
      });

      if (response.ok) {
        setBookingDetails({
          ...bookingDetails,
          paymentMethod: method,
        });
        setIsEditingPaymentMethod(false);
        toast.success("Payment method updated successfully!");
      } else {
        throw new Error('Failed to update payment method');
      }
    } catch (error) {
      console.error('Error updating payment method:', error);
      toast.error("Failed to update payment method. Please try again.");
    }
  };

  const getPaymentMethodDisplay = (method: string) => {
    switch (method) {
      case 'cash':
        return 'Cash on Delivery';
      case 'online':
        return 'Online Payment';
      case 'card':
        return 'Card on Delivery';
      case 'bank_transfer':
        return 'Bank Transfer'; // Legacy support
      default:
        return method;
    }
  };

  const getPaymentAmountDue = () => {
    if (!bookingDetails) return 0;
    
    if (bookingDetails.paymentMethod === 'online') {
      return bookingDetails.totalPrice; // Full amount for online payment
    } else {
      return bookingDetails.deposit; // Just deposit for cash on delivery
    }
  };

  const handleSubmitAgreement = async () => {
    if (!hasAgreed || !bookingDetails || !paymentCompleted) {
      toast.error("Please complete payment and agree to the terms and conditions");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/bookings/${bookingDetails.bookingRef}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agreementSigned: true,
          agreementSignedAt: new Date().toISOString(),
          paymentIntentId,
          paymentCompleted: true,
        }),
      });

      if (response.ok) {
        toast.success("Hire agreement signed successfully!");
        // Redirect to success page
        const responseData = await response.json();
        window.location.href = `/hire-agreement/success?bookingRef=${bookingDetails.bookingRef}&agreementSignedAt=${responseData.agreementSignedAt}&paymentCompleted=true`;
      } else {
        throw new Error('Failed to submit agreement');
      }
    } catch (error) {
      console.error('Error submitting agreement:', error);
      toast.error("Failed to submit agreement. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-24 sm:pt-28">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!bookingDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-24 sm:pt-28">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Booking Not Found</h1>
          <p className="text-gray-600 mb-6">The booking reference provided could not be found.</p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 pt-24 sm:pt-28">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Hire Agreement</h1>
          <p className="text-gray-600">Please read and agree to the terms and conditions below</p>
        </div>

        {/* Booking Details Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Booking Details</span>
              <Badge variant="secondary">{bookingDetails.bookingRef}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Customer Information</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Name:</strong> {bookingDetails.customerName}</p>
                  <p><strong>Email:</strong> {bookingDetails.customerEmail}</p>
                  <p><strong>Phone:</strong> {bookingDetails.customerPhone}</p>
                  <p><strong>Address:</strong> {bookingDetails.customerAddress}</p>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Hire Details</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Castle:</strong> {bookingDetails.castleName}</p>
                  <p><strong>Date:</strong> {format(new Date(bookingDetails.date), "EEEE, MMMM do, yyyy")}</p>
                  <p><strong>Total Cost:</strong> £{bookingDetails.totalPrice}</p>
                  <div className="flex items-center justify-between">
                    <p><strong>Payment Method:</strong> {getPaymentMethodDisplay(bookingDetails.paymentMethod)}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditingPaymentMethod(true);
                        setNewPaymentMethod(bookingDetails.paymentMethod);
                      }}
                      className="ml-2"
                    >
                      Change
                    </Button>
                  </div>
                  {bookingDetails.paymentMethod === 'online' && (
                    <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                      <p className="text-blue-700 text-xs"><strong>Online Payment:</strong> Full amount (£{bookingDetails.totalPrice}) will be charged when you sign this agreement.</p>
                    </div>
                  )}
                  {bookingDetails.paymentMethod === 'cash' && (
                    <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                      <p className="text-green-700 text-xs"><strong>Cash on Delivery:</strong> Deposit of £{bookingDetails.deposit} required now, remaining £{bookingDetails.totalPrice - bookingDetails.deposit} paid on delivery.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Change Modal */}
        {isEditingPaymentMethod && (
          <Card className="mb-8 border-2 border-blue-500">
            <CardHeader>
              <CardTitle className="text-blue-700">Change Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-3">
                  <label className="text-sm font-medium">Select new payment method:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewPaymentMethod("cash")}
                      className={`p-3 rounded-md border-2 transition-all duration-200 text-sm font-medium ${
                        newPaymentMethod === "cash"
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      Cash on Delivery
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewPaymentMethod("online")}
                      className={`p-3 rounded-md border-2 transition-all duration-200 text-sm font-medium ${
                        newPaymentMethod === "online"
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      Online Payment
                    </button>
                  </div>
                </div>
                
                {newPaymentMethod === 'online' && (
                  <div className="p-3 bg-blue-50 rounded border border-blue-200">
                    <p className="text-blue-700 text-sm">
                      <strong>Online Payment:</strong> You will pay the full amount (£{bookingDetails?.totalPrice}) online when you sign this agreement.
                    </p>
                  </div>
                )}
                
                {newPaymentMethod === 'cash' && (
                  <div className="p-3 bg-green-50 rounded border border-green-200">
                    <p className="text-green-700 text-sm">
                      <strong>Cash on Delivery:</strong> You will pay a deposit of £{bookingDetails?.deposit} now, and the remaining £{(bookingDetails?.totalPrice || 0) - (bookingDetails?.deposit || 0)} will be paid in cash upon delivery.
                    </p>
                  </div>
                )}
                
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => handlePaymentMethodChange(newPaymentMethod)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Update Payment Method
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditingPaymentMethod(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Terms and Conditions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>T&S Bouncy Castle Hire - Hire Agreement & Safety Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-sm text-gray-700 mb-6">
              <p>This Hire Agreement ("Agreement") is between T&S Bouncy Castle Hire ("Company") and the individual or organization hiring the equipment ("Hirer"). By signing, the Hirer agrees to the following terms and conditions.</p>
            </div>

            {/* Point 1 */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">1. Hire Period & Delivery</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-4">
                <li>The hire period commences on the date and time specified by the Hirer and terminates as agreed.</li>
                <li>Delivery and collection within a 20‑mile radius of Edwinstowe, UK is included; additional charges apply beyond this radius.</li>
              </ul>
            </div>

            {/* Point 2 */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">2. Payment & Deposit</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-4">
                <li>A non‑refundable deposit of 25% of the total hire fee is required to secure your booking.</li>
                <li>The remaining balance is due on the hire date.</li>
              </ul>
            </div>

            {/* Point 3 */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">3. Cancellation Policy</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-4">
                <li>Cancellations made more than 7 days before the hire date: full refund of balance (deposit retained).</li>
                <li>Cancellations less than 7 days before: no refund / full balance still to be paid.</li>
              </ul>
            </div>

            {/* Point 4 */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">4. Use & Safety Instructions</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-4">
                <li>Inflatables must be secured to the ground per manufacturer's instructions on a level, debris‑free surface.</li>
                <li>A responsible adult (17+) must supervise at all times; do not allow adults and children to use simultaneously except for assisting.</li>
                <li>No shoes, glasses, jewellery, badges, food, drink, gum, pets, toys or sharp objects on or near the equipment.</li>
                <li>No somersaults, climbing, hanging on walls, or bouncing on the front step.</li>
                <li>Stop use if the surface becomes wet or in rain; evacuate immediately if the blower fails.</li>
                <li>No use by persons under the influence of alcohol, drugs, or with medical conditions aggravated by physical activity.</li>
              </ul>
            </div>

            {/* Point 5 */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">5. Liability & Insurance</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-4">
                <li>All users do so at their own risk. The Company holds public liability insurance up to £1 million; certificate available on request.</li>
                <li>The Company is not liable for indirect, special or consequential losses.</li>
                <li>The Hirer is responsible for all loss, damage or injury resulting from misuse or negligent use and agrees to cover any repair or replacement costs.</li>
              </ul>
            </div>

            {/* Point 6 */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">6. Equipment Condition</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-4">
                <li>The Hirer confirms that the equipment has been inspected and is in good working order before use.</li>
                <li>Any defects must be reported immediately; continued use constitutes acceptance of condition.</li>
              </ul>
            </div>

            {/* Point 7 */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">7. Governing Law</h3>
              <p className="text-sm text-gray-700 ml-4">This Agreement is governed by the laws of England and Wales.</p>
            </div>

            {/* Point 8 */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">8. Pre‑Use Checklist</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-4">
                <li>Area clear, level & debris‑free</li>
                <li>Equipment securely anchored</li>
                <li>Blower connected, powered & airflow unobstructed</li>
                <li>No visible tears, damage or hazards</li>
              </ul>
            </div>

            {/* Point 9 - Populated with booking details */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">9. Booking & Declaration Details</h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                  <div>
                    <p><strong>Customer Name:</strong> {bookingDetails.customerName}</p>
                    <p><strong>Address:</strong> {bookingDetails.customerAddress}</p>
                    <p><strong>Contact Number:</strong> {bookingDetails.customerPhone}</p>
                    <p><strong>Email:</strong> {bookingDetails.customerEmail}</p>
                  </div>
                  <div>
                    <p><strong>Bouncy Castle Hired:</strong> {bookingDetails.castleName}</p>
                    <p><strong>Hire Date:</strong> {format(new Date(bookingDetails.date), "EEEE, MMMM do, yyyy")}</p>
                    <p><strong>Payment Method:</strong> {getPaymentMethodDisplay(bookingDetails.paymentMethod)}</p>
                    {bookingDetails.paymentMethod === 'online' ? (
                      <>
                        <p><strong>Amount to Pay:</strong> £{bookingDetails.totalPrice} (Full Amount)</p>
                        <p><strong>Payment Due:</strong> Upon signing this agreement</p>
                      </>
                    ) : (
                      <>
                        <p><strong>Deposit Due:</strong> £{bookingDetails.deposit}</p>
                        <p><strong>Balance Due on Delivery:</strong> £{bookingDetails.totalPrice - bookingDetails.deposit}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Point 10 */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">10. Rules</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 ml-4">
                <li>No shoes, glasses, jewellery, or sharp objects allowed.</li>
                <li>No food, drink, chewing gum or pets on or near the equipment.</li>
                <li>Do not climb on the walls or bounce on the front step.</li>
                <li>No somersaults or rough play.</li>
                <li>No use under the influence of alcohol or drugs.</li>
                <li>Children and adults should not use the castle at the same time.</li>
                <li>A responsible adult (17+) must supervise at all times.</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Agreement Checkbox */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="agreement"
                checked={hasAgreed}
                onCheckedChange={(checked) => setHasAgreed(checked as boolean)}
                className="mt-1"
              />
              <div className="flex-1">
                <label htmlFor="agreement" className="text-sm text-gray-700 leading-relaxed">
                  I confirm that I have read and understood the safety instructions, rules, liability terms, and agree to abide by them during the hire period. I confirm the equipment was delivered in good condition and understand I am liable for any damage or misuse.
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Section - Shows after checkbox is checked */}
        {hasAgreed && !paymentCompleted && (
          <div className="mb-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Secure Your Booking
              </h2>
              <p className="text-gray-600">
                {bookingDetails.paymentMethod === 'online' 
                  ? `Complete your full payment (£${bookingDetails.totalPrice}) to finalize the hire agreement`
                  : `Complete your deposit payment (£${bookingDetails.deposit}) to finalize the hire agreement`
                }
              </p>
            </div>
            
            <StripePaymentForm
              bookingRef={bookingDetails.bookingRef}
              customerName={bookingDetails.customerName}
              customerEmail={bookingDetails.customerEmail}
              depositAmount={getPaymentAmountDue()}
              paymentType={bookingDetails.paymentMethod === 'online' ? 'full' : 'deposit'}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
            />
          </div>
        )}

        {/* Payment Success Confirmation */}
        {paymentCompleted && (
          <Card className="mb-8 bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-green-800">Payment Successful!</h3>
                  <p className="text-sm text-green-700">
                    Your deposit of £{bookingDetails.deposit} has been processed. You can now complete the hire agreement.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button - Only shows after payment is completed */}
        {hasAgreed && paymentCompleted && (
          <div className="text-center">
            <Button
              onClick={handleSubmitAgreement}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 px-8 py-3 text-lg"
            >
              {isSubmitting ? "Submitting..." : "Complete Hire Agreement"}
            </Button>
            <p className="text-sm text-gray-600 mt-2">
              By clicking complete, you electronically sign this hire agreement
            </p>
          </div>
        )}

        {/* Instructions when only checkbox is checked */}
        {hasAgreed && !paymentCompleted && (
          <div className="text-center">
            <p className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-4">
              💡 <strong>Next Step:</strong> Complete the secure deposit payment above to finalize your hire agreement
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HireAgreementPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-24 sm:pt-28">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading hire agreement...</p>
        </div>
      </div>
    }>
      <HireAgreementContent />
    </Suspense>
  );
} 