// Este componente permanece como Server Component
import dynamic from 'next/dynamic'

// Importación dinámica del ClientProvider para evitar problemas de bundling
const ClientProvider = dynamic(() => import('./ClientProvider'), {
  ssr: true, // Mantener SSR habilitado ya que necesitamos el AuthProvider
})

export default function RootProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Aseguramos que el ClientProvider se carga de manera óptima
    <ClientProvider>{children}</ClientProvider>
  );
}