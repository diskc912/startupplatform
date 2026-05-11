import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // ui-avatars.com fallback avatars
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
      // Supabase Storage
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      // Cloudflare R2
      {
        protocol: 'https',
        hostname: 'pub-9e3d61eaf0d94d4084bc1e17da78985e.r2.dev',
      },
      // Google User Profile Pictures
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
}

export default nextConfig
