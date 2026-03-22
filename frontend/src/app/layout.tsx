import "./globals.css";
import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { AppFrame } from "@/components/AppFrame";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Qyzen",
  description: "AI-powered quiz platform"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className="font-sans antialiased text-ink-900 tracking-tight">
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}

