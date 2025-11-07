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
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  }
};

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="p-4 rounded-lg bg-gray-50 flex items-center gap-3">
        <div className="w-5 h-5 border-t-2 border-blue-500 rounded-full animate-spin"></div>
        <span className="text-sm text-gray-600">Cargando...</span>
      </div>
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} bg-background`}>
      <body className="font-sans antialiased min-h-screen bg-background text-foreground">
        <Suspense fallback={<LoadingFallback />}>
          <RootProvider>{children}</RootProvider>
        </Suspense>
      </body>
    </html>
  );
}
