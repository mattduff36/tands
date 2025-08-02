import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import ConditionalLayout from '@/components/layout/ConditionalLayout';
import QueryProvider from '@/components/providers/QueryProvider';
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from '@vercel/analytics/react';
import { LocalBusinessStructuredData } from '@/components/seo/StructuredData';

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://www.bouncy-castle-hire.com'),
  title: {
    default: "T&S Bouncy Castle Hire | Fun & Safe Castle Hire in Edwinstowe",
    template: "%s | T&S Bouncy Castle Hire"
  },
  description: "Professional bouncy castle hire service in Edwinstowe and surrounding areas. Fully insured, safe, and fun inflatables for parties, events, and celebrations. Serving Nottinghamshire since 2024.",
  keywords: [
    "bouncy castle hire Edwinstowe",
    "bouncy castle rental Nottinghamshire", 
    "inflatable hire Mansfield",
    "party rentals Newark",
    "children's entertainment Worksop",
    "safe bouncy castles",
    "insured bouncy castle hire",
    "birthday party equipment",
    "event hire Sherwood Forest",
    "local bouncy castle company"
  ].join(", "),
  authors: [{ name: "T&S Bouncy Castle Hire" }],
  creator: "T&S Bouncy Castle Hire",
  publisher: "T&S Bouncy Castle Hire",
  category: "Entertainment Services",
  classification: "Local Business - Party Equipment Rental",
  openGraph: {
    title: "T&S Bouncy Castle Hire | Fun & Safe Castle Hire in Edwinstowe",
    description: "Professional bouncy castle hire service in Edwinstowe and surrounding areas. Fully insured, safe, and fun inflatables for parties, events, and celebrations.",
    url: "https://www.bouncy-castle-hire.com",
    siteName: "T&S Bouncy Castle Hire",
    images: [
      {
        url: "/IMG_2360.JPEG",
        width: 1200,
        height: 630,
        alt: "T&S Bouncy Castle Hire - Colorful bouncy castle at party",
      },
      {
        url: "/favicon/android-chrome-512x512.png",
        width: 512,
        height: 512,
        alt: "T&S Bouncy Castle Hire Logo",
      },
    ],
    locale: "en_GB",
    type: "website",
    countryName: "United Kingdom",
  },
  twitter: {
    card: "summary_large_image",
    title: "T&S Bouncy Castle Hire | Fun & Safe Castle Hire in Edwinstowe",
    description: "Professional bouncy castle hire service in Edwinstowe and surrounding areas. Fully insured, safe, and fun inflatables for parties, events, and celebrations.",
    images: ["/IMG_2360.JPEG"],
    creator: "@tandscastles", // Replace with actual Twitter handle when available
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  // verification: {
  //   google: "your-google-verification-code", // Will be added after Google Search Console setup
  //   // yandex: "your-yandex-verification-code",
  //   // bing: "your-bing-verification-code",
  // },
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
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-TKVJT9MKYB"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-TKVJT9MKYB');
          `}
        </Script>

        <QueryProvider>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </QueryProvider>
        <Toaster />
        <Analytics />
        <LocalBusinessStructuredData />
      </body>
    </html>
  );
}
