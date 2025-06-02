/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      process.env.NEXT_PUBLIC_SUPABASE_STORAGE_DOMAIN,
    ].filter(Boolean), // filter out undefined if env is missing
  },
}

module.exports = nextConfig 