/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ['@supabase/supabase-js'],
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
    optimizePackageImports: ['@/components', '@/lib'],
    webpackBuildWorker: true
  },
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
    config.cache = false;
    if (isServer) {
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        chunkIds: 'deterministic',
      }
      config.output = {
        ...config.output,
        strictModuleExceptionHandling: true,
      }
    }

    config.optimization = {
      ...config.optimization,
      runtimeChunk: isServer ? false : 'single',
      minimize: !dev,
      moduleIds: 'deterministic',
      chunkIds: 'deterministic',
    }

    return config
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  }
}

module.exports = nextConfig