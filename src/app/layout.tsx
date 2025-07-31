import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import ConditionalLayout from '@/components/layout/ConditionalLayout';
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from '@vercel/analytics/react';

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "T&S Bouncy Castle Hire | Fun & Safe Castle Hire in Edwinstowe",
  description: "T&S Bouncy Castle Hire",
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <ConditionalLayout>
          {children}
        </ConditionalLayout>
        <Toaster />
      <Analytics />
      </body>
    </html>
  );
}
