/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    ZHIPU_API_KEY: process.env.ZHIPU_API_KEY,
  },
};

module.exports = nextConfig;
