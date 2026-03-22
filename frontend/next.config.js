/** @type {import('next').NextConfig} */
const backendOrigin = (process.env.BACKEND_ORIGIN || "https://qyzen-ai-quiz-app.onrender.com").replace(/\/$/, "");

const nextConfig = {
  reactStrictMode: true,
  // Exposed at build time so client code can choose same-origin `/api` on Vercel (see src/lib/api.ts).
  env: {
    NEXT_PUBLIC_API_PROXY: process.env.VERCEL ? "1" : ""
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendOrigin}/api/:path*`
      }
    ];
  }
};

module.exports = nextConfig;

