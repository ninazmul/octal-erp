import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Octal ERP - Academic, Staff, Payroll & Financial Management",
    template: "%s | Octal ERP",
  },
  description:
    "Integrated academic operations, student admissions, batch management, payment collections, instructor batch payouts, staff management, payroll, and financial management for Octal.",
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
      "Integrated academic operations, student admissions, batch management, payment collections, instructor batch payouts, staff management, payroll, and financial management for Octal.",
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
        <body className="font-sans antialiased" suppressHydrationWarning>
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
