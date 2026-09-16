/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@asitha/client', '@asitha/escpos', '@asitha/types'],
};

module.exports = nextConfig;
