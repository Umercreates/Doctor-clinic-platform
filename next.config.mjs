import { buildContentSecurityPolicy, commonSecurityHeaders, privateAreaHeaders } from "./server/security/headers.js";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Browser source maps stay disabled in production (Next.js default); no
  // experimental flags are enabled.
  // Keep the PostgreSQL driver as a Node.js external (it is server-only and
  // must never be bundled for the browser).
  serverExternalPackages: ["pg"],
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 414, 640, 768, 1024, 1280, 1536, 1920],
    // Only images under /public are optimised; no remote hosts are allowed.
    remotePatterns: [],
    dangerouslyAllowSVG: false,
  },
  async headers() {
    return [
      // Every response: transport/embedding/sniffing protections.
      { source: "/(.*)", headers: commonSecurityHeaders() },
      // Public site: static CSP (see server/security/headers.js for the rationale).
      { source: "/((?!dashboard|api).*)", headers: [{ key: "Content-Security-Policy", value: buildContentSecurityPolicy({ scope: "public" }) }] },
      // Dashboard pages get a per-request nonce CSP from proxy.js; API responses are JSON.
      { source: "/dashboard/:path*", headers: privateAreaHeaders() },
      { source: "/api/:path*", headers: [...privateAreaHeaders(), { key: "Content-Security-Policy", value: "default-src 'none'; frame-ancestors 'none'" }] },
    ];
  },
};

export default nextConfig;
