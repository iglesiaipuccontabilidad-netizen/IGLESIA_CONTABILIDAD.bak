// Este componente permanece como Server Component
import ClientProvider from './ClientProvider'

export default function RootProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientProvider>{children}</ClientProvider>
  );
}