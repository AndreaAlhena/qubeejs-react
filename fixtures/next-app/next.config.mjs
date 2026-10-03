/** @type {import('next').NextConfig} */
const nextConfig = {
  // The fixture is copied out of the repository before it is built: keep Next from looking for a
  // workspace root above it.
  outputFileTracingRoot: import.meta.dirname,
};

export default nextConfig;
