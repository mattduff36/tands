import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import ConditionalLayout from '@/components/layout/ConditionalLayout';
import QueryProvider from '@/components/providers/QueryProvider';
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from '@vercel/analytics/react';

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "T&S Bouncy Castle Hire | Fun & Safe Castle Hire in Edwinstowe",
  description: "Professional bouncy castle hire service in Edwinstowe and surrounding areas. Fully insured, safe, and fun inflatables for parties, events, and celebrations.",
  keywords: "bouncy castle hire, Edwinstowe, inflatable hire, party rentals, children's entertainment, safe bouncy castles",
  authors: [{ name: "T&S Bouncy Castle Hire" }],
  openGraph: {
    title: "T&S Bouncy Castle Hire | Fun & Safe Castle Hire in Edwinstowe",
    description: "Professional bouncy castle hire service in Edwinstowe and surrounding areas. Fully insured, safe, and fun inflatables for parties, events, and celebrations.",
    url: "https://tandsbouncycastles.co.uk",
    siteName: "T&S Bouncy Castle Hire",
    images: [
      {
        url: "/favicon/android-chrome-512x512.png",
        width: 512,
        height: 512,
        alt: "T&S Bouncy Castle Hire Logo",
      },
      {
        url: "/tands_logo.png",
        width: 240,
        height: 64,
        alt: "T&S Bouncy Castle Hire Logo",
      },
    ],
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "T&S Bouncy Castle Hire | Fun & Safe Castle Hire in Edwinstowe",
    description: "Professional bouncy castle hire service in Edwinstowe and surrounding areas. Fully insured, safe, and fun inflatables for parties, events, and celebrations.",
    images: ["/favicon/android-chrome-512x512.png"],
  },
  icons: {
    icon: [
      { url: '/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/favicon/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'icon', url: '/favicon/favicon.ico' },
    ],
  },
  manifest: '/favicon/site.webmanifest',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <QueryProvider>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </QueryProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
