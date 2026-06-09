import { SerwistProviderWrapper } from "@/components/SerwistProviderWrapper";
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ImCalc — импортный калькулятор",
  description: "Мобильное веб-приложение для расчёта импортной себестоимости",
  applicationName: "ImCalc",
  appleWebApp: {
    capable: true,
    title: "ImCalc",
    statusBarStyle: "default"
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f3ed"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <SerwistProviderWrapper>{children}</SerwistProviderWrapper>
      </body>
    </html>
  );
}
