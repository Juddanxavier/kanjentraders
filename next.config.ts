import { loadEnvConfig } from '@next/env';
import type { NextConfig } from "next";

// Load environment variables based on NODE_ENV
const projectDir = process.cwd();
loadEnvConfig(projectDir);

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

  // Turbopack handles module resolution and bundling
  // No webpack configuration needed

  // Environment variables - make them available to the app
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    SHIPPO_API_KEY: process.env.SHIPPO_API_KEY,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
    REDIS_URL: process.env.REDIS_URL,
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
    ignoreBuildErrors: true,
  },

  // ESLint configuration
  eslint: {
    // ESLint checking is handled by GitHub Actions/CI
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
