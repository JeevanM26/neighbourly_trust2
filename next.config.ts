import type { NextConfig } from 'next';

const isGithubActions = process.env.GITHUB_ACTIONS || false;
const repoName = process.env.NEXT_PUBLIC_BASE_PATH || 'neighborly-trust';
const basePath = isGithubActions ? `/${repoName}` : '';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  images: {
    unoptimized: true,
  },
  typescript: {
    // TypeScript safety checks remain enabled
  },
  eslint: {
    // ESLint runs as a dedicated CI step, not during build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
