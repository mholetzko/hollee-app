/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['i.scdn.co', 'mosaic.scdn.co'],
    unoptimized: process.env.NODE_ENV === 'development',
  },
}

module.exports = nextConfig 