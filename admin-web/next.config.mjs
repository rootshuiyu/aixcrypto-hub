/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 在开发模式下，忽略某些错误
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // 自定义 webpack 配置（如果需要）
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // 忽略 MetaMask 扩展相关的错误
      config.ignoreWarnings = [
        ...(config.ignoreWarnings || []),
        {
          module: /chrome-extension/,
        },
        {
          message: /MetaMask/,
        },
        {
          message: /ethereum/,
        },
      ];
    }
    return config;
  },
};

export default nextConfig;

