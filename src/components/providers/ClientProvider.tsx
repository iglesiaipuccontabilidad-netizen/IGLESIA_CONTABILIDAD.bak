'use client'

import { AuthProvider } from "@/lib/context/AuthContext";
import { Suspense, useEffect, useState } from "react";

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="p-4 rounded-lg bg-gray-50 flex items-center gap-3">
        <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
        </svg>
        <span className="text-sm text-gray-600">Cargando...</span>
      </div>
    </div>
  );
}

export default function ClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // No renderizar nada hasta que el componente esté montado para evitar errores de hidratación
  if (!mounted) {
    return <LoadingFallback />;
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthProvider>{children}</AuthProvider>
    </Suspense>
  );
}