import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development", // Matikan PWA di development agar tidak conflict cache saat live reload
});

const nextConfig: NextConfig = {
  turbopack: {},
  /* config options here */
};

export default withSerwist(nextConfig);
