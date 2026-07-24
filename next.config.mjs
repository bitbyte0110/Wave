/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "http://gateway:8080/api/v1/:path*",
      },
      {
        source: "/ws/:path*",
        destination: "http://gateway:8080/ws/:path*",
      },
    ];
  },
}

export default nextConfig
