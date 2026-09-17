/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remote avatars come from DummyJSON and Vercel Blob, so the built-in
  // optimizer is skipped rather than allow-listing every host.
  images: { unoptimized: true },
  // Do not generate agent instruction files inside the project.
  agentRules: false,
};

export default nextConfig;
