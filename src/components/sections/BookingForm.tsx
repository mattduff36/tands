"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

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
    
    if (!selectedCastleId || !date || !name || !email || !phone || !address) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedCastle = castles.find(c => c.id.toString() === selectedCastleId);
      
      const bookingData = {
        castleId: selectedCastleId,
        castleName: selectedCastle?.name,
        date: format(date, "yyyy-MM-dd"),
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        customerAddress: address,
        paymentMethod,
        totalPrice: selectedCastle ? Math.floor(selectedCastle.price) : 0,
        deposit: selectedCastle ? Math.floor(selectedCastle.price * 0.3) : 0,
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
      <div className="max-w-2xl mx-auto p-8 text-center">
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
    <div className="max-w-2xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Castle Selection */}
        <div className="space-y-2">
          <Label htmlFor="castle" className="text-sm font-medium">
            Select Bouncy Castle *
          </Label>
          <Select value={selectedCastleId} onValueChange={setSelectedCastleId}>
            <SelectTrigger>
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

        {/* Date Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Event Date *
          </Label>
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(selectedDate) => {
                  setDate(selectedDate);
                  setPopoverOpen(false);
                }}
                disabled={isBeforeToday}
                initialFocus
              />
            </PopoverContent>
          </Popover>
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
            />
          </div>
        </div>

        {/* Payment Method */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Preferred Payment Method</Label>
          <RadioGroup 
            value={paymentMethod} 
            onValueChange={setPaymentMethod}
            className="flex flex-col space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="cash" id="cash" />
              <Label htmlFor="cash" className="text-sm">Cash on delivery</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="bank_transfer" id="bank_transfer" />
              <Label htmlFor="bank_transfer" className="text-sm">Bank transfer</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Pricing Summary */}
        {selectedCastleId && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Booking Summary</h3>
            {(() => {
              const selectedCastle = castles.find(c => c.id.toString() === selectedCastleId);
              if (!selectedCastle) return null;
              
              const totalPrice = Math.floor(selectedCastle.price);
              const deposit = Math.floor(totalPrice * 0.3);
              
              return (
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Castle: {selectedCastle.name}</span>
                    <span>£{totalPrice}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Deposit (30%):</span>
                    <span>£{deposit}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Remaining balance due on delivery:</span>
                    <span>£{totalPrice - deposit}</span>
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