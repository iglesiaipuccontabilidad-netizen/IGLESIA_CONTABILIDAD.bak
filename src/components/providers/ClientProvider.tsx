'use client'

import { AuthProvider } from "@/lib/context/AuthContext";
import { Suspense } from "react";

const SimpleLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-gray-600 font-medium">Cargando...</p>
    </div>
  </div>
);

export default function ClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<SimpleLoader />}>
      <AuthProvider>{children}</AuthProvider>
    </Suspense>
  );
}