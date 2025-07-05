"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real application, you would handle form submission here
    // e.g., send data to an API endpoint
    console.log({ name, email, phone, message });

    toast.success("Form Submitted!", {
        description: "Thank you for your message. We will get back to you shortly."
    });

    // Reset form
    setName("");
    setEmail("");
    setPhone("");
    setMessage("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="name">Full Name</Label>
        <Input 
          id="name" 
          name="name" 
          type="text" 
          autoComplete="name" 
          required 
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="email">Email Address</Label>
        <Input 
          id="email" 
          name="email" 
          type="email" 
          autoComplete="email" 
          required 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="phone">Phone Number (Optional)</Label>
        <Input 
          id="phone" 
          name="phone" 
          type="tel" 
          autoComplete="tel" 
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="message">Message</Label>
        <Textarea 
          id="message" 
          name="message" 
          rows={4} 
          required 
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
      <div>
        <Button type="submit" className="w-full">
          Send Message
        </Button>
      </div>
    </form>
  );
} 