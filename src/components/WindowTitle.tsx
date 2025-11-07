import Head from 'next/head'
import Image from 'next/image'

export default function WindowTitle() {
  return (
    <Head>
      <title>Sistema de Votos IPUC</title>
      <link rel="icon" href="/favicon.ico" />
      {/* Imagen extra pequeña para la pestaña del navegador */}
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href="/icons/icon-16x16.png"
      />
      {/* Imagen pequeña para la pestaña del navegador */}
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href="/icons/icon-32x32.png"
      />
      {/* Imagen para dispositivos Apple */}
      <link
        rel="apple-touch-icon"
        sizes="180x180"
        href="/LogoIpuc.png"
      />
      {/* Imagen grande para PWA */}
      <link
        rel="icon"
        type="image/png"
        sizes="192x192"
        href="/icons/icon-192x192.png"
      />
    </Head>
  )
}