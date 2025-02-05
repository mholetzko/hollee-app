import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Header } from "./components/Header"
import { ThemeProvider } from "./components/ThemeProvider"
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Workout Builder",
  description: "Sync your ride with your favorite beats",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <Header />
          <main className="pt-16">
            {children}
          </main>
        </ThemeProvider>
        <SpeedInsights />
      </body>
    </html>
  )
}