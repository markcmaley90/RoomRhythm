import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Pinterest site claiming. Pinterest issues a token and looks for it as a
// <meta name="p:domain_verify"> on the homepage; claiming the domain is what
// attributes every pin from this site to our profile and unlocks pin analytics.
// Env var rather than a hardcoded token so it can be set at deploy time, and so
// an unconfigured build emits no stray meta tag. See docs/gtm-social-profiles.md.
const pinterestVerify = process.env.NEXT_PUBLIC_PINTEREST_VERIFY;

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001"),
  title: {
    default: "RoomRhythm — The Screen That Runs Your Room",
    template: "%s | RoomRhythm",
  },
  description:
    "Free classroom screen for focus blocks, breaks, and timed exams. The only classroom timer that can also run test day — with extended-time accommodations built in.",
  openGraph: {
    title: "RoomRhythm — The Screen That Runs Your Room",
    description:
      "Free classroom screen for focus blocks, breaks, and timed exams. The only classroom timer that can also run test day — with extended-time accommodations built in.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
  },
  ...(pinterestVerify
    ? { verification: { other: { "p:domain_verify": pinterestVerify } } }
    : {}),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Cookieless analytics. Renders nothing when the env var is unset, so
            local dev and any unconfigured deploy send no requests at all. */}
        {plausibleDomain && (
          <Script
            defer
            strategy="afterInteractive"
            data-domain={plausibleDomain}
            src="https://plausible.io/js/script.js"
          />
        )}
        {children}
      </body>
    </html>
  );
}
