import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enhanced security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  },

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons'],
  },

  // Turbopack configuration
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    domains: [], // Add allowed image domains here
    minimumCacheTTL: 60,
  },

  // Bundle analyzer (enable only when needed)
  // webpack: (config, { dev, isServer }) => {
  //   if (!dev && !isServer) {
  //     config.plugins.push(
  //       new (require('@next/bundle-analyzer'))({
  //         enabled: process.env.ANALYZE === 'true',
  //       })
  //     );
  //   }
  //   return config;
  // },

  // Environment validation
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Compression
  compress: true,

  // Power optimizations
  poweredByHeader: false,

  // React strict mode
  reactStrictMode: true,

  // Output configuration
  output: 'standalone',

  // Redirects for security
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/dashboard',
        permanent: false,
      },
    ];
  },

  // TypeScript configuration
  typescript: {
    // Type checking is handled by GitHub Actions/CI
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    // ESLint checking is handled by GitHub Actions/CI
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
