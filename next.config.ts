import type { NextConfig } from 'next';

const isGithubActions = process.env.GITHUB_ACTIONS || false;
const repoName = process.env.NEXT_PUBLIC_BASE_PATH || 'neighbourly_trust2';
const basePath = isGithubActions ? `/${repoName}` : '';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: basePath,
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
