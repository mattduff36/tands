"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

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

  const handleSubmitAgreement = async () => {
    if (!hasAgreed || !bookingDetails) {
      toast.error("Please agree to the terms and conditions");
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
        }),
      });

      if (response.ok) {
        toast.success("Hire agreement signed successfully!");
        // Redirect to success page
        const responseData = await response.json();
        window.location.href = `/hire-agreement/success?bookingRef=${bookingDetails.bookingRef}&agreementSignedAt=${responseData.agreementSignedAt}`;
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!bookingDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Booking Not Found</h1>
          <p className="text-gray-600 mb-6">The booking reference provided could not be found.</p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
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
                  <p><strong>Deposit:</strong> £{bookingDetails.deposit}</p>
                  <p><strong>Payment Method:</strong> {bookingDetails.paymentMethod === 'cash' ? 'Cash on Delivery' : 'Bank Transfer'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
                    <p><strong>Payment Method:</strong> {bookingDetails.paymentMethod === 'cash' ? 'Cash' : 'Bank Transfer'}</p>
                    <p><strong>Amount Paid:</strong> £{bookingDetails.totalPrice}</p>
                    <p><strong>Deposit Paid:</strong> £{bookingDetails.deposit}</p>
                    <p><strong>Balance Due:</strong> £{bookingDetails.totalPrice - bookingDetails.deposit}</p>
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

        {/* Submit Button */}
        {hasAgreed && (
          <div className="text-center">
            <Button
              onClick={handleSubmitAgreement}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 px-8 py-3 text-lg"
            >
              {isSubmitting ? "Submitting..." : "Submit Agreement"}
            </Button>
            <p className="text-sm text-gray-600 mt-2">
              By clicking submit, you electronically sign this hire agreement
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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