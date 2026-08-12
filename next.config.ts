import type { NextConfig } from 'next';
import path from 'path';

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
    // Safety checks enabled
  },
  eslint: {
    // Safety checks enabled
  }
};

export default nextConfig;
