/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@asitha/node-print-client', '@asitha/escpos', '@asitha/types'],
};

module.exports = nextConfig;
