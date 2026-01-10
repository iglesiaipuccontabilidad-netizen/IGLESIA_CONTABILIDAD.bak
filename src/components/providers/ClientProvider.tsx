'use client'

import { AuthProvider } from "@/lib/context/AuthContext";
import { QueryProvider } from "@/components/providers/QueryProvider";

export default function ClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <AuthProvider>{children}</AuthProvider>
    </QueryProvider>
  );
}