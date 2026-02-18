import type { Metadata } from "next";
import { Work_Sans } from "next/font/google";
import "./globals.css";
import Navbar from '../components/Navbar';

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.onmates.com"),
  title: "Projecten | Onmates®",
  description: "Onmates® projecten: lijst met projecten, URLs, tags, partners en screenshots.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`light ${workSans.variable}`}>
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
