/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable webpack transpilation of the uuid package
  transpilePackages: ['uuid'],
  
  // Other Next.js configuration options as needed
  reactStrictMode: true,
  
  // Configure image domains for next/image
  images: {
    domains: ['v3.fal.media', 'image.pollinations.ai'],
  },
  
  // Configure webpack to handle node modules
  webpack: (config, { isServer }) => {
    // Fix module resolution for packages that need it
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }
    
    return config;
  },
};

module.exports = nextConfig;