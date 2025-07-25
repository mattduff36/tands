/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'd98nzplymhizhheh.public.blob.vercel-storage.com', // Vercel Blob storage
    ],
  },
};

module.exports = nextConfig;
