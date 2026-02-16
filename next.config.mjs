/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['@supabase/supabase-js'],

  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        'localhost:3001',
        'sistema-contable-ipuc.vercel.app',
      ],
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

  // Rewrites for multi-tenant org-slug URLs
  // These are applied to client-side navigation (Link/router.push)
  // unlike middleware rewrites which only work server-side
  rewrites: async () => ({
    beforeFiles: [
      {
        source: '/:slug/dashboard/:path*',
        destination: '/dashboard/:path*',
      },
      {
        source: '/:slug/dashboard',
        destination: '/dashboard',
      },
    ],
  }),

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

export default nextConfig