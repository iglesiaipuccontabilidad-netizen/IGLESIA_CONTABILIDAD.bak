import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import RootProvider from "@/components/providers/RootProvider";
import "./globals.css";
import "@/styles/layout.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Sistema de Votos IPUC",
  description: "Sistema de gestión de votos y compromisos financieros para la IPUC",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} bg-background`}>
      <body className="font-sans antialiased min-h-screen bg-background text-foreground">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        }>
          <RootProvider>{children}</RootProvider>
        </Suspense>
      </body>
    </html>
  );
}
