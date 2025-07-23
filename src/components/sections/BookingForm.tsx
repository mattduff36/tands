"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Calendar as CalendarIcon, AlertCircle, CheckCircle } from "lucide-react";
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
import type { Castle } from "@/lib/castle-storage";

// Types for availability data
interface DayAvailability {
  date: string;
  status: 'available' | 'partially_booked' | 'fully_booked' | 'unavailable' | 'maintenance';
  availableSlots: number;
  totalSlots: number;
  reason?: string;
}

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
  
  // Availability data from API
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(true);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [selectedDateAvailability, setSelectedDateAvailability] = useState<string | null>(null);

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

  // Fetch availability data from API
  const fetchAvailability = async () => {
    setIsLoadingAvailability(true);
    setAvailabilityError(null);
    
    try {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + 60); // Next 60 days
      
      const startDate = today.toISOString().split('T')[0];
      const endDate = futureDate.toISOString().split('T')[0];
      
      const response = await fetch(`/api/availability?start=${startDate}&end=${endDate}&format=summary`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch availability');
      }
      
      const data = await response.json();
      setAvailability(data.availability || []);
    } catch (error) {
      console.error('Error fetching availability:', error);
      setAvailabilityError('Unable to load availability. Please try again.');
      toast.error('Failed to load availability', {
        description: 'Using offline mode. Some dates may not be accurate.',
      });
    } finally {
      setIsLoadingAvailability(false);
    }
  };

  // Check availability for selected castle and date
  const checkSelectedDateAvailability = async (selectedDate: Date, castleId: string) => {
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const castle = castles.find(c => c.id.toString() === castleId);
      
      const response = await fetch('/api/availability/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: dateStr,
          startTime: '10:00',
          endTime: '16:00',
          castle: castle?.name
        }),
      });
      
      const result = await response.json();
      
      if (result.available) {
        setSelectedDateAvailability('✅ This date and castle are available!');
        toast.success('Date available!', {
          description: `${castle?.name} is available on ${selectedDate.toLocaleDateString()}`,
        });
      } else {
        setSelectedDateAvailability(`⚠️ ${result.reason}`);
        if (result.type === 'conflict' || result.type === 'castle_unavailable') {
          toast.warning('Date not available', {
            description: result.reason,
          });
        }
      }
    } catch (error) {
      console.error('Error checking date availability:', error);
      setSelectedDateAvailability('❓ Unable to check availability');
    }
  };

  // Load availability when component mounts and set up real-time synchronization
  useEffect(() => {
    fetchAvailability();
    
    // Set up polling for real-time synchronization (every 30 seconds)
    const intervalId = setInterval(() => {
      fetchAvailability();
    }, 30000); // 30 seconds
    
    // Cleanup interval on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, []);
  
  // Add visibility change listener for immediate refresh when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchAvailability();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Check availability when date and castle are selected
  useEffect(() => {
    if (date && selectedCastleId) {
      checkSelectedDateAvailability(date, selectedCastleId);
    } else {
      setSelectedDateAvailability(null);
    }
  }, [date, selectedCastleId]);

  // Helper to determine if a date should be disabled
  const isDateDisabled = (day: Date): boolean => {
    if (isBeforeToday(day)) return true;
    
    const dateStr = day.toISOString().split('T')[0];
    const dayAvailability = availability.find(a => a.date === dateStr);
    
    if (!dayAvailability) {
      // If we don't have data, allow the date (fail gracefully)
      return false;
    }
    
    // Disable if fully booked, unavailable, or under maintenance
    return dayAvailability.status === 'fully_booked' ||
           dayAvailability.status === 'unavailable' ||
           dayAvailability.status === 'maintenance';
  };

  // Get status message for calendar date
  const getDateStatusMessage = (day: Date): string => {
    const dateStr = day.toISOString().split('T')[0];
    const dayAvailability = availability.find(a => a.date === dateStr);
    
    if (!dayAvailability) return '';
    
    switch (dayAvailability.status) {
      case 'available':
        return '✅ Available';
      case 'partially_booked':
        return '🟡 Limited availability';
      case 'fully_booked':
        return '🔴 Fully booked';
      case 'unavailable':
        return `❌ ${dayAvailability.reason || 'Unavailable'}`;
      case 'maintenance':
        return `🔧 ${dayAvailability.reason || 'Maintenance'}`;
      default:
        return '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setIsSubmitted(false);
    
    // Double-check availability before submitting
    if (date && selectedCastleId) {
      try {
        const dateStr = date.toISOString().split('T')[0];
        const castle = castles.find(c => c.id.toString() === selectedCastleId);
        
        const availabilityCheck = await fetch('/api/availability/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            date: dateStr,
            startTime: '10:00',
            endTime: '16:00',
            castle: castle?.name
          }),
        });
        
        const availabilityResult = await availabilityCheck.json();
        
        if (!availabilityResult.available) {
          toast.error('Date no longer available', {
            description: availabilityResult.reason,
          });
          setIsSubmitting(false);
          return;
        }
      } catch (error) {
        console.warn('Could not verify availability, proceeding with booking request');
      }
    }
    
    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          date: date ? date.toISOString().split("T")[0] : "",
          message: `Castle: ${selectedCastleId ? castles.find(c => c.id.toString() === selectedCastleId)?.name : ""}\nAddress: ${address}\nPayment: ${paymentMethod}`
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Booking request sent!", {
          description: "Thank you for your booking request. We will contact you soon.",
        });
        setSelectedCastleId(undefined);
        setDate(undefined);
        setName("");
        setEmail("");
        setPhone("");
        setAddress("");
        setPaymentMethod("cash");
        setSelectedDateAvailability(null);
        setIsSubmitted(true);
        // Refresh availability data
        fetchAvailability();
      } else {
        toast.error("Booking failed", {
          description: data.error || "An error occurred. Please try again.",
        });
      }
    } catch (error: any) {
      toast.error("Booking failed", {
        description: error.message || "An error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 h-full w-full max-w-full" autoComplete="off">
      <label htmlFor="castle" className="mb-1 font-semibold text-blue-900 text-base sm:text-base" tabIndex={0} aria-label="Choose Your Castle">Choose Your Castle</label>
      <Select value={selectedCastleId} onValueChange={setSelectedCastleId} required>
        <SelectTrigger className="bg-white border border-blue-200 rounded-lg px-3 py-2 sm:px-4 sm:py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full text-base">
          <SelectValue placeholder={<span className="text-base text-muted-foreground">Select a bouncy castle...</span>} />
        </SelectTrigger>
        <SelectContent className="max-w-xs w-full sm:max-w-md">
          {isLoadingCastles ? (
            <SelectItem value="loading" disabled>
              Loading castles...
            </SelectItem>
          ) : (
            castles.map((castle) => (
              <SelectItem key={castle.id} value={castle.id.toString()}>
                {castle.name} - £{castle.price}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      <label htmlFor="date" className="mb-1 font-semibold text-blue-900 text-base sm:text-base" tabIndex={0} aria-label="Select Your Date">Select Your Date</label>
      
      {/* Availability status message */}
      {isLoadingAvailability && (
        <div className="mb-2 flex items-center text-sm text-blue-600">
          <div className="animate-spin mr-2 h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          Loading availability...
        </div>
      )}
      
      {availabilityError && (
        <div className="mb-2 flex items-center text-sm text-orange-600">
          <AlertCircle className="mr-2 h-4 w-4" />
          {availabilityError}
        </div>
      )}
      
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex items-center bg-white border border-blue-200 rounded-lg px-3 py-2 sm:px-4 sm:py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full justify-start text-left font-normal text-base",
              !date && "text-muted-foreground"
            )}
            tabIndex={0}
            aria-label="Date picker"
            onClick={() => setPopoverOpen(true)}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span className="text-base text-muted-foreground">Pick a date</span>}
          </button>
        </PopoverTrigger>
        <PopoverContent className="max-w-xs w-full sm:max-w-md p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(selectedDate) => {
              setDate(selectedDate);
              if (selectedDate) setPopoverOpen(false);
            }}
            initialFocus
            disabled={isDateDisabled}
            modifiers={{
              available: (day) => {
                const dateStr = day.toISOString().split('T')[0];
                const dayAvailability = availability.find(a => a.date === dateStr);
                return dayAvailability?.status === 'available';
              },
              partiallyBooked: (day) => {
                const dateStr = day.toISOString().split('T')[0];
                const dayAvailability = availability.find(a => a.date === dateStr);
                return dayAvailability?.status === 'partially_booked';
              },
              fullyBooked: (day) => {
                const dateStr = day.toISOString().split('T')[0];
                const dayAvailability = availability.find(a => a.date === dateStr);
                return dayAvailability?.status === 'fully_booked';
              }
            }}
            modifiersStyles={{
              available: { backgroundColor: '#dcfce7', color: '#166534' },
              partiallyBooked: { backgroundColor: '#fef3c7', color: '#92400e' },
              fullyBooked: { backgroundColor: '#fecaca', color: '#991b1b', textDecoration: 'line-through' }
            }}
          />
        </PopoverContent>
      </Popover>
      
      {/* Selected date availability feedback */}
      {selectedDateAvailability && (
        <div className={cn(
          "mb-4 p-3 rounded-lg text-sm",
          selectedDateAvailability.includes('✅') ? 'bg-green-50 text-green-800 border border-green-200' :
          selectedDateAvailability.includes('⚠️') ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
          'bg-blue-50 text-blue-800 border border-blue-200'
        )}>
          {selectedDateAvailability}
        </div>
      )}
      <label htmlFor="name" className="mb-1 font-semibold text-blue-900 text-base sm:text-base" tabIndex={0} aria-label="Full Name">Full Name</label>
      <input
        id="name"
        name="name"
        type="text"
        className="bg-white border border-blue-200 rounded-lg px-3 py-2 sm:px-4 sm:py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full text-base"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        tabIndex={0}
        aria-label="Full Name input"
      />
      <label htmlFor="email" className="mb-1 font-semibold text-blue-900 text-base sm:text-base" tabIndex={0} aria-label="Email">Email</label>
      <input
        id="email"
        name="email"
        type="email"
        className="bg-white border border-blue-200 rounded-lg px-3 py-2 sm:px-4 sm:py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full text-base"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        tabIndex={0}
        aria-label="Email input"
      />
      <label htmlFor="phone" className="mb-1 font-semibold text-blue-900 text-base sm:text-base" tabIndex={0} aria-label="Phone">Phone</label>
      <input
        id="phone"
        name="phone"
        type="tel"
        className="bg-white border border-blue-200 rounded-lg px-3 py-2 sm:px-4 sm:py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full text-base"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        tabIndex={0}
        aria-label="Phone input"
      />
      <label htmlFor="address" className="mb-1 font-semibold text-blue-900 text-base sm:text-base" tabIndex={0} aria-label="Delivery Address">Delivery Address</label>
      <textarea
        id="address"
        name="address"
        className="bg-white border border-blue-200 rounded-lg px-3 py-2 sm:px-4 sm:py-2 mb-4 min-h-[100px] flex-1 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none w-full text-base"
        required
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        tabIndex={0}
        aria-label="Delivery Address textarea"
      />
      <label className="mb-1 font-semibold text-blue-900 text-base sm:text-base" tabIndex={0} aria-label="Payment Method">Payment Method</label>
      <div className="mb-4 flex flex-col gap-3">
        <label htmlFor="cash" className={`flex items-center gap-3 p-2 sm:p-3 rounded-xl border transition-all duration-200 cursor-pointer ${paymentMethod === 'cash' ? 'bg-blue-50 border-blue-400 shadow' : 'border-blue-200 bg-white hover:bg-blue-50'}`} tabIndex={0} aria-label="Cash on Delivery">
          <input
            type="radio"
            id="cash"
            name="paymentMethod"
            value="cash"
            checked={paymentMethod === 'cash'}
            onChange={() => setPaymentMethod('cash')}
            className="h-6 w-6 border-2 border-blue-400 focus:ring-2 focus:ring-blue-400 accent-blue-500 transition-all duration-200"
            aria-checked={paymentMethod === 'cash'}
          />
          <span className="font-medium text-blue-900 select-none">Cash on Delivery</span>
        </label>
        <label htmlFor="card" className={`flex items-center gap-3 p-2 sm:p-3 rounded-xl border transition-all duration-200 cursor-pointer ${paymentMethod === 'card' ? 'bg-blue-50 border-blue-400 shadow' : 'border-blue-200 bg-white hover:bg-blue-50'}`} tabIndex={0} aria-label="Credit/Debit Card (Pay on Delivery)">
          <input
            type="radio"
            id="card"
            name="paymentMethod"
            value="card"
            checked={paymentMethod === 'card'}
            onChange={() => setPaymentMethod('card')}
            className="h-6 w-6 border-2 border-blue-400 focus:ring-2 focus:ring-blue-400 accent-blue-500 transition-all duration-200"
            aria-checked={paymentMethod === 'card'}
          />
          <span className="font-medium text-blue-900 select-none">Credit/Debit Card (Pay on Delivery)</span>
        </label>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Please note: For card payments, we will bring a card machine on the day of delivery. No online payment is taken at this time.
      </p>
      <button
        type="submit"
        className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 sm:px-6 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-colors duration-200 w-full text-base"
        tabIndex={0}
        aria-label="Request to Book"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Submitting..." : "Request to Book"}
      </button>
    </form>
  );
} 