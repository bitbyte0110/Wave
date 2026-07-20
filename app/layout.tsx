import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import type { Metadata } from "next"
import { ThemeProvider } from "@/contexts/theme-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Crypto Dashboard",
  description: "A modern cryptocurrency trading dashboard",
  generator: "v0.dev",
  metadataBase: new URL("https://crypto-dashboard.example.com"),
  openGraph: {
    title: "Crypto Dashboard - Modern Trading Platform",
    description:
      "Track, analyze, and trade cryptocurrencies with our advanced dashboard featuring real-time data, portfolio analytics, and AI-powered insights.",
    images: [
      {
        url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-04-21%20at%2000.01.09-1DI8PlTigyTXyu5nPuXVjFdbqYc5Av.png",
        width: 1200,
        height: 630,
        alt: "Cryptocurrency Trading Dashboard Interface",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Crypto Dashboard - Modern Trading Platform",
    description:
      "Track, analyze, and trade cryptocurrencies with our advanced dashboard featuring real-time data, portfolio analytics, and AI-powered insights.",
    images: [
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-04-21%20at%2000.01.09-1DI8PlTigyTXyu5nPuXVjFdbqYc5Av.png",
    ],
    creator: "@author_karas",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
