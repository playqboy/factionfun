import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Factions.fun — On-Chain Group Chat for Top Holders",
  description:
    "Private chat rooms for the top 10 holders of any Pump.fun token. Enter the top 10 to gain access.",
  openGraph: {
    title: "Factions.fun — On-Chain Group Chat for Top Holders",
    description:
      "Private chat rooms for the top 10 holders of any Pump.fun token. Enter the top 10 to gain access.",
    url: "https://factions.fun",
    siteName: "Factions.fun",
    type: "website",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "Factions.fun" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Factions.fun — On-Chain Group Chat for Top Holders",
    description:
      "Private chat rooms for the top 10 holders of any Pump.fun token.",
    images: ["/logo.png"],
  },
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png", sizes: "512x512" },
      { url: "/logo.png", type: "image/png", sizes: "32x32" },
      { url: "/logo.png", type: "image/png", sizes: "16x16" },
    ],
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
