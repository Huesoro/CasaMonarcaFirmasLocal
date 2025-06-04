import type React from "react"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/hooks/use-auth"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Toaster } from "@/components/ui/toaster" // <-- ✅ IMPORTANTE
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Casa Monarca",
  description: "Plataforma para gestión de donaciones y procesos",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
              <Toaster /> 
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

