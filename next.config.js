/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
  // Configuración específica para el Service Worker
  headers: async () => {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ]
  },
  webpack: (config, { dev, isServer }) => {
    // Desactivar la caché de webpack temporalmente para resolver problemas de compilación
    config.cache = false;
    if (isServer) {
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        chunkIds: 'deterministic',
      }
      
      // Asegurar que los módulos del servidor tengan IDs consistentes
      config.output = {
        ...config.output,
        strictModuleExceptionHandling: true,
      }
    }

    // Optimizaciones generales de webpack
    config.optimization = {
      ...config.optimization,
      runtimeChunk: isServer ? false : 'single',
      minimize: !dev,
      moduleIds: 'deterministic',
      chunkIds: 'deterministic',
    }

    return config
  },
  experimental: {
    // Habilitar características experimentales de manera más específica
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
    // Mejorar el manejo de módulos
    optimizePackageImports: ['@/components', '@/lib'],
    webpackBuildWorker: true
  },
  compiler: {
    // Remover console.logs en producción
    removeConsole: process.env.NODE_ENV === 'production',
  }
}

module.exports = nextConfig