import type { Metadata } from "next";
import { Albert_Sans, Barlow } from "next/font/google";
import "./globals.css";
import Navbar from '../components/Navbar';

const albertSans = Albert_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const barlow = Barlow({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Backlog | Backspaced",
  description: "Backlog is a collection of projects that I've worked on.",
  icons: {
    icon: [
      { url: "/favicon.png", media: "(prefers-color-scheme: light)" },
      { url: "/favicon-dark.png", media: "(prefers-color-scheme: dark)" },
    ],
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`light ${albertSans.variable} ${barlow.variable}`}>
      <head>
        <meta name="robots" content="noindex,nofollow" />
      </head>
      <body className="min-h-screen bg-[var(--bg)]">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
