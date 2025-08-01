"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { Castle } from "@/lib/database/castles";

export function BookingForm() {
  const searchParams = useSearchParams();
  const initialCastleId = searchParams.get("castle");

  const [castles, setCastles] = useState<Castle[]>([]);
  const [isLoadingCastles, setIsLoadingCastles] = useState(true);
  const [selectedCastleId, setSelectedCastleId] = useState<string | undefined>(initialCastleId || undefined);
  const [date, setDate] = useState<Date | undefined>();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [postcode, setPostcode] = useState("");
  const [eventDuration, setEventDuration] = useState(8); // Default 8 hours
  const [specialRequests, setSpecialRequests] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Fetch castles data
  const fetchCastles = async () => {
    setIsLoadingCastles(true);
    try {
      const response = await fetch('/api/castles');
      if (response.ok) {
        const data = await response.json();
        setCastles(data);
      } else {
        console.error('Failed to fetch castles');
      }
    } catch (error) {
      console.error('Error fetching castles:', error);
    } finally {
      setIsLoadingCastles(false);
    }
  };

  // Load castles when component mounts
  useEffect(() => {
    fetchCastles();
  }, []);

  // Helper to check if a date is before today (ignoring time)
  const isBeforeToday = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d < today;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCastleId || !date || !name || !email || !phone || !address || !postcode || !agreedToTerms) {
      toast.error("Please fill in all required fields and agree to terms");
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedCastle = castles.find(c => c.id.toString() === selectedCastleId);
      
      // Create datetime string for eventDate (start of day)
      const eventDateTime = new Date(date);
      eventDateTime.setHours(9, 0, 0, 0); // Default to 9 AM
      
      const bookingData = {
        castleId: parseInt(selectedCastleId), // Convert to number
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        eventDate: eventDateTime.toISOString(),
        eventDuration: eventDuration,
        eventAddress: address,
        eventPostcode: postcode,
        specialRequests: specialRequests || undefined,
        agreedToTerms: agreedToTerms,
        isOvernight: false,
        totalPrice: selectedCastle ? Math.floor(selectedCastle.price) : 0,
      };

      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit booking');
      }

      setIsSubmitted(true);
      toast.success("Booking request submitted successfully!");
      
    } catch (error) {
      console.error('Error submitting booking:', error);
      toast.error("Failed to submit booking. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Request Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for your booking request. We'll contact you within 24 hours to confirm your booking and arrange payment.
          </p>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-red-600 hover:bg-red-700"
          >
            Make Another Booking
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
                {/* Castle and Date Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="castle" className="text-sm font-medium">
              Select Bouncy Castle *
            </Label>
            <Select value={selectedCastleId} onValueChange={setSelectedCastleId}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Choose a bouncy castle" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingCastles ? (
                  <SelectItem value="loading" disabled>Loading castles...</SelectItem>
                ) : (
                  castles.map((castle) => (
                    <SelectItem key={castle.id} value={castle.id.toString()}>
                      {castle.name} - £{Math.floor(castle.price)} per day
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Event Date *
            </Label>
            <Input
              type="date"
              value={date ? format(date, "yyyy-MM-dd") : ""}
              onChange={(e) => {
                const selectedDate = e.target.value ? new Date(e.target.value) : undefined;
                setDate(selectedDate);
              }}
              min={format(new Date(), "yyyy-MM-dd")}
              className="bg-white"
              required
            />
          </div>
        </div>

        {/* Customer Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Full Name *
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              required
              className="bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
              className="bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">
              Phone Number *
            </Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="07xxx xxxxxx"
              required
              className="bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-medium">
              Event Address *
            </Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Event location address"
              required
              className="bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="postcode" className="text-sm font-medium">
              Postcode *
            </Label>
            <Input
              id="postcode"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value.toUpperCase())}
              placeholder="SW1A 1AA"
              required
              className="bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration" className="text-sm font-medium">
              Event Duration (hours) *
            </Label>
            <Select value={eventDuration.toString()} onValueChange={(value) => setEventDuration(parseInt(value))}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4">4 hours</SelectItem>
                <SelectItem value="6">6 hours</SelectItem>
                <SelectItem value="8">8 hours (Standard)</SelectItem>
                <SelectItem value="12">12 hours</SelectItem>
                <SelectItem value="24">24 hours (Overnight)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Special Requests */}
        <div className="space-y-2">
          <Label htmlFor="requests" className="text-sm font-medium">
            Special Requests (Optional)
          </Label>
          <Textarea
            id="requests"
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            placeholder="Any special requests or additional information..."
            className="bg-white min-h-[80px]"
            maxLength={500}
          />
        </div>

        {/* Payment Method */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Preferred Payment Method</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod("cash")}
              className={`p-3 rounded-md border-2 transition-all duration-200 text-sm font-medium ${
                paymentMethod === "cash"
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              Cash on Delivery
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("bank_transfer")}
              className={`p-3 rounded-md border-2 transition-all duration-200 text-sm font-medium ${
                paymentMethod === "bank_transfer"
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              Bank Transfer
            </button>
          </div>
        </div>

        {/* Pricing Summary */}
        {selectedCastleId && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Booking Summary</h3>
            {(() => {
              const selectedCastle = castles.find(c => c.id.toString() === selectedCastleId);
              if (!selectedCastle) return null;
              
              const basePrice = Math.floor(selectedCastle.price);
              const totalPrice = basePrice; // For now, same price regardless of duration
              const deposit = Math.floor(totalPrice * 0.3);
              
              return (
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Castle: {selectedCastle.name}</span>
                    <span>£{basePrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration: {eventDuration} hours</span>
                    <span>-</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-1">
                    <span>Total Price:</span>
                    <span>£{totalPrice}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Deposit Required (30%):</span>
                    <span>£{deposit}</span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Terms and Conditions */}
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="terms"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mt-1 h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
            required
          />
          <Label htmlFor="terms" className="text-sm text-gray-700 leading-relaxed">
            I agree to the{" "}
            <a href="/terms" target="_blank" className="text-red-600 hover:text-red-700 underline">
              terms and conditions
            </a>{" "}
            and{" "}
            <a href="/hire-agreement" target="_blank" className="text-red-600 hover:text-red-700 underline">
              hire agreement
            </a>
            . I understand that a 30% deposit is required to confirm the booking. *
          </Label>
        </div>

        {/* Submit Button */}
        <Button 
          type="submit" 
          className="w-full bg-red-600 hover:bg-red-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit Booking Request"}
        </Button>

        <p className="text-xs text-gray-600 text-center">
          * Required fields. We'll contact you within 24 hours to confirm your booking.
        </p>
      </form>
    </div>
  );
} 