/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Keep the PostgreSQL driver as a Node.js external (it is server-only and
  // must never be bundled for the browser).
  serverExternalPackages: ["pg"],
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 414, 640, 768, 1024, 1280, 1536, 1920],
  },
};

export default nextConfig;
