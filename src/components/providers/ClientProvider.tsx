'use client'

import { AuthProvider } from "@/lib/context/AuthContext";
import { OrganizationProvider } from "@/lib/context/OrganizationContext";
import { QueryProvider } from "@/components/providers/QueryProvider";

export default function ClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <AuthProvider>
        <OrganizationProvider>{children}</OrganizationProvider>
      </AuthProvider>
    </QueryProvider>
  );
}