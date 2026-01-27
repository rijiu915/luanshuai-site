/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'pub-15ea01688b984f9f900edca1c6917f4c.r2.dev',
      },
      {
        protocol: 'https',
        hostname: 'slelguoygbfzlpylpxfs.supabase.co',
      },
    ],
  },
};

module.exports = nextConfig;