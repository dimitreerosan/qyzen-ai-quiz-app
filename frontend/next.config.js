/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  // Exposed at build time so client code uses same-origin `/api` on Vercel (proxied by app/api/[...path]/route.ts).
  env: {
    NEXT_PUBLIC_API_PROXY: process.env.VERCEL ? "1" : ""
  }
};

module.exports = nextConfig;

