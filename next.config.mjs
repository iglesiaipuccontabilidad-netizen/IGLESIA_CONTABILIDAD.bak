import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['@supabase/supabase-js'],

  // Turbopack configuración top-level (Next.js 16+)
  turbopack: {
    root: __dirname,
  },

  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'localhost:3001'],
    },
    optimizePackageImports: ['@/components', '@/lib'],
  },

  headers: async () => [
    {
      source: '/sw.js',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=0, must-revalidate',
        },
      ],
    },
  ],

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  webpack: (config) => {
    config.cache = {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
      },
    }
    return config
  },
}

export default nextConfig