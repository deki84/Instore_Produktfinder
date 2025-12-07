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

export const metadata: Metadata = {
  title: "Obi Instore Produktfinder",
  description: "KI gestützter Produktfinder für den Einsatz im OBI Markt",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
         className={`${geistSans.variable} ${geistMono.variable} antialiased`}
         >
         <div className="flex min-h-screen w-full max-w-3xl flex-col justify-between bg-white dark:bg-black sm:items-start">
        {children}
      </div>
      </body>
    </html>
  );
}
