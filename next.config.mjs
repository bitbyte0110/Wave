const gatewayTarget = process.env.INTERNAL_GATEWAY_URL || "http://localhost:8080"

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
        destination: `${gatewayTarget}/api/v1/:path*`,
      },
      {
        source: "/ws/:path*",
        destination: `${gatewayTarget}/ws/:path*`,
      },
    ];
  },
}

export default nextConfig
