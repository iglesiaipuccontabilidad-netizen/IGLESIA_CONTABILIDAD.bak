import { Metadata } from 'next'

export async function generateMetadata({ params }: any): Promise<Metadata> {
  return {
    title: `Pago del Voto ${params.votoId}`,
  }
}

export default async function Page({ params }: any) {
  const { votoId } = params

  return (
    <div>
      <h1>Pago del Voto {votoId}</h1>
      {/* Aquí irá el contenido de la página */}
    </div>
  )
}
