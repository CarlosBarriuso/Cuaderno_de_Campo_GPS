/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true, // Disable Image Optimization API for Docker
  },
  // Add any other Next.js config options here
}

module.exports = nextConfig
