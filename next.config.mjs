/** @type {import('next').NextConfig} */
export default {
  experimental: {
    // File BRK bisa berisi ribuan baris; default 1 MB terlalu kecil untuk server action impor
    serverActions: { bodySizeLimit: "100mb" },
    serverActions: {
      bodySizeLimit: "100mb", 
      allowedOrigins: [
        "localhost:3000",
        "*.devtunnels.ms",
        "*.asse.devtunnels.ms",
      ],
    },
  },
};