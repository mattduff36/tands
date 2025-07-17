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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSubmitting(false);
    setIsSubmitted(true);

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
    <form className="flex flex-col flex-1 h-full" autoComplete="off" onSubmit={handleSubmit}>
      <label htmlFor="name" className="mb-1 font-semibold text-blue-900" tabIndex={0} aria-label="Name">Name</label>
      <input
        id="name"
        name="name"
        type="text"
        className="bg-white border border-blue-200 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        tabIndex={0}
        aria-label="Name input"
      />
      <label htmlFor="email" className="mb-1 font-semibold text-blue-900" tabIndex={0} aria-label="Email">Email</label>
      <input
        id="email"
        name="email"
        type="email"
        className="bg-white border border-blue-200 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        tabIndex={0}
        aria-label="Email input"
      />
      <label htmlFor="phone" className="mb-1 font-semibold text-blue-900" tabIndex={0} aria-label="Phone number (optional)">Phone number (optional)</label>
      <input
        id="phone"
        name="phone"
        type="tel"
        className="bg-white border border-blue-200 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        tabIndex={0}
        aria-label="Phone number input (optional)"
      />
      <label htmlFor="message" className="mb-1 font-semibold text-blue-900" tabIndex={0} aria-label="Message">Message</label>
      <textarea
        id="message"
        name="message"
        className="bg-white border border-blue-200 rounded-lg px-4 py-2 mb-4 min-h-[100px] flex-1 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
        required
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        tabIndex={0}
        aria-label="Message textarea"
      />
      <button
        type="submit"
        className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-colors duration-200"
        tabIndex={0}
        aria-label="Send Message"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Submitting..." : "Send Message"}
      </button>
    </form>
  );
} 