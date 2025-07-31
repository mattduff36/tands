"use client";

import { useReducer, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// State interface for better type safety
interface ContactFormState {
  formData: {
    name: string;
    email: string;
    phone: string;
    message: string;
  };
  ui: {
    isSubmitting: boolean;
    isSubmitted: boolean;
  };
}

// Action types for reducer
type ContactFormAction =
  | { type: 'UPDATE_FIELD'; field: keyof ContactFormState['formData']; value: string }
  | { type: 'SET_SUBMITTING'; isSubmitting: boolean }
  | { type: 'SET_SUBMITTED'; isSubmitted: boolean }
  | { type: 'RESET_FORM' };

// Initial state
const initialState: ContactFormState = {
  formData: {
    name: '',
    email: '',
    phone: '',
    message: '',
  },
  ui: {
    isSubmitting: false,
    isSubmitted: false,
  },
};

// Reducer function for consolidated state management
function contactFormReducer(state: ContactFormState, action: ContactFormAction): ContactFormState {
  switch (action.type) {
    case 'UPDATE_FIELD':
      return {
        ...state,
        formData: {
          ...state.formData,
          [action.field]: action.value,
        },
      };
    case 'SET_SUBMITTING':
      return {
        ...state,
        ui: {
          ...state.ui,
          isSubmitting: action.isSubmitting,
        },
      };
    case 'SET_SUBMITTED':
      return {
        ...state,
        ui: {
          ...state.ui,
          isSubmitted: action.isSubmitted,
        },
      };
    case 'RESET_FORM':
      return {
        ...initialState,
        ui: {
          ...state.ui,
          isSubmitted: true,
        },
      };
    default:
      return state;
  }
}

export const ContactForm = memo(function ContactForm() {
  const [state, dispatch] = useReducer(contactFormReducer, initialState);

  // Memoized handlers to prevent unnecessary re-renders
  const handleFieldChange = useCallback((field: keyof ContactFormState['formData']) => {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      dispatch({ type: 'UPDATE_FIELD', field, value: e.target.value });
    };
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: 'SET_SUBMITTING', isSubmitting: true });
    dispatch({ type: 'SET_SUBMITTED', isSubmitted: false });
    
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: state.formData.name,
          email: state.formData.email,
          phone: state.formData.phone,
          message: state.formData.message,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success("Form Submitted!", {
          description: "Thank you for your message. We will get back to you shortly.",
        });
        dispatch({ type: 'RESET_FORM' });
      } else {
        toast.error("Submission failed", {
          description: data.error || "An error occurred. Please try again.",
        });
      }
    } catch (error: any) {
      toast.error("Submission failed", {
        description: error.message || "An error occurred. Please try again.",
      });
    } finally {
      dispatch({ type: 'SET_SUBMITTING', isSubmitting: false });
    }
  }, [state.formData]);

  return (
    <form className="flex flex-col flex-1 h-full" autoComplete="off" onSubmit={handleSubmit}>
      <label htmlFor="name" className="mb-1 font-semibold text-blue-900" tabIndex={0} aria-label="Name">Name</label>
      <input
        id="name"
        name="name"
        type="text"
        className="bg-white border border-blue-200 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
        required
        value={state.formData.name}
        onChange={handleFieldChange('name')}
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
        value={state.formData.email}
        onChange={handleFieldChange('email')}
        tabIndex={0}
        aria-label="Email input"
      />
      <label htmlFor="phone" className="mb-1 font-semibold text-blue-900" tabIndex={0} aria-label="Phone number (optional)">Phone number (optional)</label>
      <input
        id="phone"
        name="phone"
        type="tel"
        className="bg-white border border-blue-200 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
        value={state.formData.phone}
        onChange={handleFieldChange('phone')}
        tabIndex={0}
        aria-label="Phone number input (optional)"
      />
      <label htmlFor="message" className="mb-1 font-semibold text-blue-900" tabIndex={0} aria-label="Message">Message</label>
      <textarea
        id="message"
        name="message"
        className="bg-white border border-blue-200 rounded-lg px-4 py-2 mb-4 min-h-[100px] flex-1 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
        required
        value={state.formData.message}
        onChange={handleFieldChange('message')}
        tabIndex={0}
        aria-label="Message textarea"
      />
      <button
        type="submit"
        className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-colors duration-200"
        tabIndex={0}
        aria-label="Send Message"
        disabled={state.ui.isSubmitting}
      >
        {state.ui.isSubmitting ? "Submitting..." : "Send Message"}
      </button>
    </form>
  );
}); 