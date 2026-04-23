/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // 暂时禁用构建时的 ESLint 检查
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 暂时禁用构建时的类型检查
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'jzai.pro',
        pathname: '/**',
      },
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
      {
        protocol: 'https',
        hostname: 'tempfile.aiquickdraw.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.aiquickdraw.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
