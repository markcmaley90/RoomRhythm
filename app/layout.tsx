import type { Metadata } from "next";
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

// TODO(launch): Add public/og-image.png (1200×630) before launch. The openGraph
// and twitter cards below reference /og-image.png and will 404 until it exists.
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
