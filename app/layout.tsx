import ActivityTracker from "./components/activity-tracker";
import PageTransition from "./components/page-transition";
import AnimatedBg from "./components/ui/animated-bg";
import CustomCursor from "./components/ui/custom-cursor";
import CursorSpotlight from "./components/ui/cursor-spotlight";
import ScrollProgressBar from "./components/ui/scroll-progress";
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
  title: "no NAME",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AnimatedBg />
        <CursorSpotlight />
        <CustomCursor />
        <ScrollProgressBar />
        <ActivityTracker />
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
