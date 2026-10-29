import type { Metadata } from "next";
import { Inter, DM_Serif_Display } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-dm-serif",
});

export const metadata: Metadata = {
  title: {
    default: "Octal ERP - Academic, Staff, Payroll & Financial Management",
    template: "%s | Octal ERP",
  },
  description:
    "Integrated academic operations, student admissions, batch management, referral tracking, payment collections, instructor commissions, staff management, payroll, and financial management for Octal.",
  icons: {
    icon: [
      { url: "/erp-logo.png", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: [
      { url: "/apple-icon.png", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    siteName: "Octal ERP",
    title: "Octal ERP",
    description:
      "Integrated academic operations, student admissions, batch management, referral tracking, payment collections, instructor commissions, staff management, payroll, and financial management for Octal.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${inter.variable} ${dmSerif.variable} font-sans antialiased`}
          suppressHydrationWarning
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
