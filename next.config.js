/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    ZHIPU_API_KEY: process.env.ZHIPU_API_KEY,
    PORT: process.env.PORT || '8080',
  },
  // Configure for Azure App Service
  output: 'standalone',
  // Optimize for Azure
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  swcMinify: true,
  experimental: {
    outputFileTracingRoot: undefined,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

module.exports = nextConfig;
