import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from '../components/Navbar';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Backlog | Backspaced",
  description: "Backlog is a collection of projects that I've worked on.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <head>
        <meta name="robots" content="noindex,nofollow" />
      </head>
      <body className={`${inter.className} bg-gray-50`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
