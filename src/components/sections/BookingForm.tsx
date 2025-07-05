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
import { castles, Castle } from "@/lib/castle-data";

export function BookingForm() {
  const searchParams = useSearchParams();
  const initialCastleId = searchParams.get("castle");

  const [selectedCastleId, setSelectedCastleId] = useState<string | undefined>(initialCastleId || undefined);
  const [date, setDate] = useState<Date | undefined>();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  // This is a mock of unavailable dates. In a real app, this would come from a database.
  const unavailableDates = [
    new Date(2024, 7, 20),
    new Date(2024, 7, 21),
    new Date(2024, 8, 5),
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCastleId || !date || !name || !email || !address) {
        toast.error("Please fill out all required fields.");
        return;
    }

    const selectedCastle = castles.find(c => c.id.toString() === selectedCastleId);

    const bookingDetails = {
        castle: selectedCastle?.name,
        date: format(date, "PPP"),
        name,
        email,
        phone,
        address,
        paymentMethod,
        price: `£${selectedCastle?.price}`
    };

    console.log("Booking Submitted:", bookingDetails);

    toast.success("Booking Request Sent!", {
        description: `We've received your request for the ${selectedCastle?.name} on ${format(date, "PPP")}. We will contact you shortly to confirm.`,
    });

    // Reset form
    setSelectedCastleId(undefined);
    setDate(undefined);
    setName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setPaymentMethod("cash");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Castle Selection */}
      <div>
        <Label className="text-lg font-semibold">1. Choose Your Castle</Label>
        <Select value={selectedCastleId} onValueChange={setSelectedCastleId} required>
          <SelectTrigger className="w-full mt-2">
            <SelectValue placeholder="Select a bouncy castle..." />
          </SelectTrigger>
          <SelectContent>
            {castles.map((castle) => (
              <SelectItem key={castle.id} value={castle.id.toString()}>
                {castle.name} - £{castle.price}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date Selection */}
      <div>
        <Label className="text-lg font-semibold">2. Select Your Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal mt-2",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
              disabled={(day) =>
                day < new Date() ||
                unavailableDates.some(
                  (unavailableDate) =>
                    day.getFullYear() === unavailableDate.getFullYear() &&
                    day.getMonth() === unavailableDate.getMonth() &&
                    day.getDate() === unavailableDate.getDate()
                )
              }
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Personal Details */}
      <div>
        <Label className="text-lg font-semibold">3. Your Details</Label>
        <div className="mt-2 space-y-4">
            <div>
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
                <Label htmlFor="address">Delivery Address</Label>
                <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} required />
            </div>
        </div>
      </div>

      {/* Payment Method */}
      <div>
        <Label className="text-lg font-semibold">4. Payment Method</Label>
        <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="mt-2">
            <div className="flex items-center space-x-2">
                <RadioGroupItem value="cash" id="cash" />
                <Label htmlFor="cash">Cash on Delivery</Label>
            </div>
            <div className="flex items-center space-x-2">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card">Credit/Debit Card (Pay on Delivery)</Label>
            </div>
        </RadioGroup>
        <p className="text-sm text-muted-foreground mt-2">
            Please note: For card payments, we will bring a card machine on the day of delivery. No online payment is taken at this time.
        </p>
      </div>

      {/* Submit Button */}
      <Button type="submit" size="lg" className="w-full">
        Request to Book
      </Button>
    </form>
  );
} 