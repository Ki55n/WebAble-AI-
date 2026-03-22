import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  subsets: ["latin"],
  style: "italic",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "WebAble AI - Intelligent Accessibility Platform",
    template: "%s | WebAble AI",
  },

  description:
    "WebAble AI is an intelligent accessibility platform that scans websites, detects WCAG issues, and generates AI-powered remediation suggestions and developer-ready tickets.",

  keywords: [
    "WebAble AI",
    "accessibility",
    "a11y",
    "WCAG",
    "web accessibility",
    "AI accessibility",
    "automated accessibility testing",
    "accessibility audit",
  ],

  authors: [{ name: "WebAble AI" }],
  creator: "WebAble AI",
  publisher: "WebAble AI",

  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "https://webable-ai.vercel.app"
  ),

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "WebAble AI",

    title: "WebAble AI - Intelligent Accessibility Platform",

    description:
      "Scan your website, detect accessibility issues, and generate AI-powered fixes instantly with WebAble AI.",

    images: [
      {
        url: "/openGraph.png",
        width: 1200,
        height: 630,
        alt: "WebAble AI - Accessibility Platform",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title: "WebAble AI - Intelligent Accessibility Platform",

    description:
      "AI-powered accessibility testing tool that detects issues and generates fixes for WCAG compliance.",

    images: ["/openGraph.png"],

    creator: "@webableai",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
    ],
  },

  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${instrumentSans.variable} ${instrumentSerif.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
