import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate a friendly booking reference from a string (like event ID)
export function generateFriendlyBookingRef(input: string): string {
  // Create a hash from the input string to generate a consistent number
  const hash = input.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  const friendlyNumber = Math.abs(hash) % 999 + 1;
  return `TS${friendlyNumber.toString().padStart(3, '0')}`;
}
