import type { Metadata } from "next";
import { Suspense } from "react";
import RootProvider from "@/components/providers/RootProvider";
import WindowTitle from "@/components/WindowTitle";
import "./globals.css";
import "@/styles/layout.css";

// Usando system-ui directamente en lugar de cargar Inter
const inter = {
  variable: "--font-sans"
};

export const metadata: Metadata = {
  title: "Sistema de Votos IPUC",
  description: "Sistema de gestión de votos y compromisos financieros para la IPUC",
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/favicon.ico' }
    ],
    apple: [
      { url: '/icons/apple-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    shortcut: ['/icons/favicon-32.png']
  },
  themeColor: '#2563eb',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Sistema de Votos IPUC',
    startupImage: ['/icons/apple-icon.png']
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
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
      <WindowTitle />
      <body className="font-sans antialiased min-h-screen bg-background text-foreground">
        <Suspense fallback={<LoadingFallback />}>
          <RootProvider>{children}</RootProvider>
        </Suspense>
      </body>
    </html>
  );
}
