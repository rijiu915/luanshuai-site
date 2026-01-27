/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'images.unsplash.com',
      'images.pexels.com',
      'plus.unsplash.com',
      'pub-15ea01688b984f9f900edca1c6917f4c.r2.dev',
      'slelguoygbfzlpylpxfs.supabase.co'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pub-15ea01688b984f9f900edca1c6917f4c.r2.dev',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'slelguoygbfzlpylpxfs.supabase.co',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;