import { loadStripe } from '@stripe/stripe-js';

// This is your publishable key (safe to share publicly)
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default stripePromise;

export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  secretKey: process.env.STRIPE_SECRET_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
} as const;

// Currency and locale settings
export const PAYMENT_CONFIG = {
  currency: 'gbp',
  locale: 'en-GB',
  country: 'GB',
} as const;

// Stripe appearance customization to match T&S brand
export const STRIPE_APPEARANCE = {
  theme: 'stripe' as const,
  variables: {
    colorPrimary: '#dc2626', // Red-600 to match T&S brand
    colorBackground: '#ffffff',
    colorText: '#374151', // Gray-700
    colorDanger: '#ef4444', // Red-500
    fontFamily: 'Poppins, system-ui, sans-serif',
    spacingUnit: '4px',
    borderRadius: '8px',
  },
  rules: {
    '.Input': {
      border: '1px solid #d1d5db',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    },
    '.Input:focus': {
      border: '1px solid #dc2626',
      boxShadow: '0 0 0 3px rgba(220, 38, 38, 0.1)',
    },
    '.Label': {
      color: '#374151',
      fontWeight: '500',
    },
  },
};