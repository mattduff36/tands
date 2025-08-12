"use client";

import { useState, useEffect, useRef } from "react";
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
// Using an inline dropdown for reliability instead of Popover
import { haversineMiles } from "@/lib/utils/distance";
import { BUSINESS_LOCATION } from "@/lib/config/business";

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
  const [addressCoordinates, setAddressCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [addressSuggestions, setAddressSuggestions] = useState<Array<{ id: string; label: string; coordinates: { lat: number; lng: number } | null }>>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [distanceMiles, setDistanceMiles] = useState<number | null>(null);
  const latestAutocompleteId = useRef(0);
  const suppressNextAutocompleteRef = useRef(false);

  const [eventDuration, setEventDuration] = useState(8); // Default 8 hours
  const [specialRequests, setSpecialRequests] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [selectedPaymentDetails, setSelectedPaymentDetails] = useState("25% deposit required when booking confirmed, balance paid in cash upon delivery");
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

  // Debounced address autocomplete
  useEffect(() => {
    if (suppressNextAutocompleteRef.current) {
      // Skip one autocomplete cycle right after a user selects a suggestion
      suppressNextAutocompleteRef.current = false;
      return;
    }
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    async function runAutocomplete(query: string, requestId: number) {
      try {
        setIsLoadingSuggestions(true);
        setShowAddressDropdown(true);
        const res = await fetch(`/api/addresses/autocomplete?q=${encodeURIComponent(query)}&limit=8`);
        if (requestId !== latestAutocompleteId.current) return; // stale
        if (!res.ok) {
          setAddressSuggestions([]);
          setShowAddressDropdown(true);
          return;
        }
        const data = await res.json();
        const suggestions = Array.isArray(data.suggestions) ? data.suggestions : [];
        setAddressSuggestions(suggestions);
        setShowAddressDropdown(true);
      } catch (e) {
        if (requestId !== latestAutocompleteId.current) return; // stale
        setAddressSuggestions([]);
        setShowAddressDropdown(true);
      } finally {
        if (requestId === latestAutocompleteId.current) setIsLoadingSuggestions(false);
      }
    }

    if (address && address.trim().length >= 3) {
      // Reset selected coords if user edits text after selecting
      setAddressCoordinates(null);
      setDistanceMiles(null);
      timeoutId = setTimeout(() => {
        const newId = latestAutocompleteId.current + 1;
        latestAutocompleteId.current = newId;
        runAutocomplete(address.trim(), newId);
      }, 250);
    } else {
      setAddressSuggestions([]);
      setShowAddressDropdown(false);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      // Bump id to invalidate any in-flight result
      latestAutocompleteId.current += 1;
    };
  }, [address]);

  // When we have coordinates, compute distance
  useEffect(() => {
    if (addressCoordinates) {
      const miles = haversineMiles(BUSINESS_LOCATION.coordinates, addressCoordinates);
      setDistanceMiles(Math.round(miles * 10) / 10);
    } else {
      setDistanceMiles(null);
    }
  }, [addressCoordinates]);

  async function handleSelectAddressSuggestion(s: { id: string; label: string; coordinates: { lat: number; lng: number } | null }) {
    try {
      suppressNextAutocompleteRef.current = true;
      setAddress(s.label);
      setShowAddressDropdown(false);
      setAddressSuggestions([]);
      // Resolve to normalized address + coords (reverse geocode if needed)
      const res = await fetch('/api/addresses/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: s.label, coordinates: s.coordinates }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.coordinates?.lat && data?.coordinates?.lng) {
          setAddressCoordinates({ lat: data.coordinates.lat, lng: data.coordinates.lng });
        } else {
          setAddressCoordinates(null);
        }
        // Keep the user's selected label in the input to avoid confusion
      } else {
        setAddressCoordinates(s.coordinates);
      }
    } catch (e) {
      setAddressCoordinates(s.coordinates);
    }
  }

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
    
    if (!selectedCastleId || !date || !name || !email || !phone || !address) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedCastle = castles.find(c => c.id.toString() === selectedCastleId);
      
      // Create datetime strings based on event duration
      const eventStartTime = new Date(date);
      eventStartTime.setHours(10, 0, 0, 0); // Start at 10:00 AM
      
      const eventEndTime = new Date(date);
      if (eventDuration === 8) {
        // 8 hours: 10:00 - 18:00
        eventEndTime.setHours(18, 0, 0, 0);
      } else if (eventDuration === 24) {
        // 24 hours (overnight): 10:00 - 23:59
        eventEndTime.setHours(23, 59, 0, 0);
      }
      
      const bookingData = {
        castleId: parseInt(selectedCastleId), // Convert to number
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        eventDate: eventStartTime.toISOString(),
        eventDuration: eventDuration,
        eventStartTime: eventStartTime.toISOString(),
        eventEndTime: eventEndTime.toISOString(),
        eventAddress: address,
        specialRequests: specialRequests || undefined,
        isOvernight: eventDuration === 24,
        totalPrice: selectedCastle ? Math.floor(selectedCastle.price) + (eventDuration === 24 ? 20 : 0) : 0,
        paymentMethod: paymentMethod,
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div className="space-y-2 relative">
            <Label htmlFor="address" className="text-sm font-medium">
              Event Address *
            </Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onFocus={() => setShowAddressDropdown(address.trim().length >= 3)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setShowAddressDropdown(false);
              }}
              placeholder="Start typing your UK address..."
              required
              className="bg-white"
              autoComplete="street-address"
            />
            {showAddressDropdown && (
              <div className="absolute z-50 left-0 right-0 mt-1 max-h-72 overflow-auto rounded-md border bg-white shadow">
                {isLoadingSuggestions ? (
                  <div className="p-3 text-sm text-gray-600">Searching addresses…</div>
                ) : addressSuggestions.length === 0 ? (
                  <div className="p-3 text-sm text-gray-600">No suggestions</div>
                ) : (
                  <ul className="divide-y divide-gray-100" role="listbox" aria-label="Address suggestions">
                    {addressSuggestions.map((s) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleSelectAddressSuggestion(s)}
                        >
                          <span className="text-sm text-gray-900">{s.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {typeof distanceMiles === 'number' && distanceMiles > 35 ? (
              <div className="mt-2 rounded-md border border-red-300 bg-red-50 p-2 text-sm text-red-800">
                Due to the distance (about {distanceMiles} miles from Edwinstowe), this request will likely not be accepted.
              </div>
            ) : typeof distanceMiles === 'number' && distanceMiles > 20 ? (
              <div className="mt-2 rounded-md border border-yellow-300 bg-yellow-50 p-2 text-sm text-yellow-800">
                Heads up: the event looks to be about {distanceMiles} miles from Edwinstowe. There may be an additional charge, and during busy periods we may not be able to approve bookings this far away.
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration" className="text-sm font-medium">
            Event Duration *
          </Label>
          <Select value={eventDuration.toString()} onValueChange={(value) => setEventDuration(parseInt(value))}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="8">8 hours (Standard)</SelectItem>
              <SelectItem value="24">24 hours (Overnight)</SelectItem>
            </SelectContent>
          </Select>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setPaymentMethod("cash");
                setSelectedPaymentDetails("25% deposit required when booking confirmed, balance paid in cash upon delivery");
              }}
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
              onClick={() => {
                setPaymentMethod("online");
                setSelectedPaymentDetails("Pay online in full when the booking is confirmed, before signing the hire agreement");
              }}
              className={`p-3 rounded-md border-2 transition-all duration-200 text-sm font-medium ${
                paymentMethod === "online"
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              Online Payment
            </button>
          </div>
          
          {/* Payment Method Details */}
          {selectedPaymentDetails && (
            <div className={`mt-3 p-3 rounded-md border-2 ${
              paymentMethod === "cash"
                ? "border-green-500 bg-green-50"
                : "border-blue-500 bg-blue-50"
            }`}>
              <p className={`text-sm ${
                paymentMethod === "cash"
                  ? "text-green-700"
                  : "text-blue-700"
              }`}>{selectedPaymentDetails}</p>
            </div>
          )}
        </div>

        {/* Pricing Summary */}
        {selectedCastleId && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Booking Summary</h3>
            {(() => {
              const selectedCastle = castles.find(c => c.id.toString() === selectedCastleId);
              if (!selectedCastle) return null;
              
              const basePrice = Math.floor(selectedCastle.price);
              const overnightSurcharge = eventDuration === 24 ? 20 : 0; // £20 surcharge for 24-hour bookings
              const totalPrice = basePrice + overnightSurcharge;
              const deposit = Math.floor(totalPrice * 0.25);
              
              return (
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Castle: {selectedCastle.name}</span>
                    <span>£{basePrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration: {eventDuration} hours</span>
                    <span>{overnightSurcharge > 0 ? `£${overnightSurcharge}` : '-'}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-1">
                    <span>Total Price:</span>
                    <span>£{totalPrice}</span>
                  </div>

                </div>
              );
            })()}
          </div>
        )}



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