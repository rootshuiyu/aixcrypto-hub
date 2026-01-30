/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true
  },
  // 支持 src 目录
  // Next.js 默认支持 src/app 目录结构
};

module.exports = nextConfig;

