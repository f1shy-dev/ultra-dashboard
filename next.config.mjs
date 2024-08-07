import million from "million/compiler";
// import MillionCompiler from "@million/lint";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.mzstatic.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    swcPlugins: [
      // ["@swc-jotai/debug-label", {}],
      // ["@swc-jotai/react-refresh", {}],
    ],
    turbo: true,
  },
};

export default million.next(nextConfig, { auto: { rsc: true }, rsc: true });
// export default MillionCompiler.next({ rsc: true, auto: { rsc: true } })(
// 	nextConfig,
// );
