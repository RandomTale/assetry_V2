/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  // Added empty turbopack config to fix the Next 16 turbopack/webpack compatibility error:
  turbopack: {},
  // Suppress Wagmi/Viem build warnings
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    return config
  },
};

export default nextConfig;
