import { Metadata } from 'next'

export async function generateMetadata({ params }: any): Promise<Metadata> {
  return {
    title: `Pago del Voto ${params.id}`,
  }
}

export default async function Page({ params }: any) {
  const { id } = params

  return (
    <div>
      <h1>Pago del Voto {id}</h1>
      {/* Aquí irá el contenido de la página */}
    </div>
  )
}
