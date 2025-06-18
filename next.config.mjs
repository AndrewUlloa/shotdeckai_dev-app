/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['fal.media', 'v3.fal.media', 'imagedelivery.net'], // Add any other domains you need
    unoptimized: true, // Disable optimization since Cloudflare Pages doesn't support Next.js Image API
  },
};

export default nextConfig;
