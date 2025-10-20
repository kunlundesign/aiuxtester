/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    // 生产环境下的图片域名配置
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.azurewebsites.net',
      },
    ],
  },
  // 🔧 文件追踪根目录
  outputFileTracingRoot: __dirname,
  
  // 🔒 安全修复：移除 env 配置，避免API密钥泄露到前端
  // API密钥只在服务端使用，通过 process.env 直接访问
  
  // 🚀 性能优化
  compress: true,
  poweredByHeader: false,
  
  // 📦 为容器部署优化
  output: 'standalone',
  
  // 🔧 实验性特性
  experimental: {
    serverComponentsExternalPackages: ['@google/generative-ai'],
  },
};

module.exports = nextConfig;
