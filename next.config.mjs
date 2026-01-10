import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'localhost:3001']
    },
    turbo: {
      root: __dirname
    }
  },
  webpack: (config, { isServer }) => {
    // Optimizaciones de Webpack
    config.cache = {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename]
      }
    }
    return config
  }
}

export default nextConfig