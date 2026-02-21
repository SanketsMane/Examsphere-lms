/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',


  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Increase from default 1mb
    },
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    loader: 'custom',
    loaderFile: './lib/image-loader.ts',
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "avatar.vercel.sh"
      },
      {
        protocol: "https",
        hostname: "*.fly.storage.tigris.dev"
      },
      {
        protocol: "https",
        hostname: "randomuser.me",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "flagcdn.com",
      },
      {
        protocol: "https",
        hostname: "github.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "kidokool-sanket-dev.s3.us-west-2.amazonaws.com",
      },
      // Merged from next.config.js
      {
          protocol: 'https',
          hostname: 's3.ap-southeast-2.amazonaws.com',
      },
      {
          protocol: 'https',
          hostname: 's3.**.amazonaws.com',
      },
      {
          protocol: 'https',
          hostname: '**.s3.**.amazonaws.com',
      },
      {
          protocol: "https",
          hostname: "ui-avatars.com",
      },
      {
          protocol: "https",
          hostname: "i.pravatar.cc",
      }
    ],
  },

  async headers() {
    return [
      {
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(self), geolocation=(), browsing-topics=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
