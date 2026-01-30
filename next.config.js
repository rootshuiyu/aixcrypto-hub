/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // 启用 standalone 输出（Docker 友好）
  output: 'standalone',
  
  // 实验性功能
  experimental: {
    typedRoutes: true,
    // 优化包大小
    optimizePackageImports: ['framer-motion', '@tanstack/react-query', 'lucide-react'],
  },
  
  // 生产环境禁用 source map（防止反编译）
  productionBrowserSourceMaps: false,
  
  // SWC 编译器配置
  swcMinify: true,
  
  // 自定义 Webpack 配置
  webpack: (config, { isServer, dev }) => {
    if (!dev && !isServer) {
      // 生产环境前端代码优化
      config.optimization = {
        ...config.optimization,
        minimize: true,
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            defaultVendors: {
              test: /[\\/]node_modules[\\/]/,
              priority: -10,
              reuseExistingChunk: true,
              name: 'vendors',
            },
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
          },
        },
      };
      
      // Terser 混淆配置
      const TerserPlugin = require('terser-webpack-plugin');
      config.optimization.minimizer = [
        new TerserPlugin({
          parallel: true,
          terserOptions: {
            ecma: 2020,
            compress: {
              drop_console: true,      // 移除 console.log
              drop_debugger: true,     // 移除 debugger
              pure_funcs: [
                'console.log',
                'console.info',
                'console.debug',
                'console.warn',
              ],
              passes: 2,               // 多次压缩
            },
            mangle: {
              safari10: true,
              // 变量名混淆
              properties: {
                regex: /^_private_|^__internal__/,
              },
            },
            output: {
              comments: false,         // 移除注释
              ascii_only: true,
            },
          },
          extractComments: false,
        }),
      ];
    }
    
    return config;
  },
  
  // 环境变量（编译时注入）
  env: {
    BUILD_TIME: new Date().toISOString(),
    BUILD_VERSION: process.env.npm_package_version || '1.0.0',
  },
  
  // 图片优化
  images: {
    domains: ['localhost'],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  
  // 重定向配置
  async redirects() {
    return [];
  },
  
  // 头部配置
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
