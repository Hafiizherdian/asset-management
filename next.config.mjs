/** @type {import('next').NextConfig} */
export default {
  experimental: {
    // File BRK bisa berisi ribuan baris; default 1 MB terlalu kecil untuk server action impor
    serverActions: { bodySizeLimit: "100mb" },
  },
};