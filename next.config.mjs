/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'localhost:3001']
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
  },
  outputFileTracingRoot: "/home/juanda/ipuc-contabilidad"
}

export default nextConfig