/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  experimental: {
    outputFileTracingIncludes: {
      "/api/**/*": ["./prisma/dev.db", "./prisma/**/*"],
    },
  },
};

export default nextConfig;
