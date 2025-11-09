/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // For Vercel optimization
  typescript: {
    // Disable type checking during production build to avoid env-specific React type mismatches
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;