import path from "path";
import type { NextConfig } from "next";

const excelJsBrowser = path.join(
  __dirname,
  "node_modules/exceljs/dist/exceljs.min.js",
);

const API_DEV_TARGET =
  process.env.API_DEV_PROXY_TARGET?.trim() || "http://127.0.0.1:7500";

const nextConfig: NextConfig = {
  async rewrites() {
    if (process.env.NODE_ENV === "production") return [];
    return [
      {
        source: "/backend/:path*",
        destination: `${API_DEV_TARGET}/:path*`,
      },
    ];
  },
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      exceljs$: excelJsBrowser,
    };

    if (config.resolve) {
      config.resolve.symlinks = false;
      config.resolve.plugins = config.resolve.plugins || [];
      config.resolve.plugins.push({
        apply: (resolver: any) => {
          resolver.getHook("resolved").tapAsync(
            "NormalizeCasingPlugin",
            (request: any, resolveContext: any, callback: any) => {
              if (request.path) {
                request.path = request.path.toLowerCase();
              }
              callback();
            }
          );
        },
      });
    }
    return config;
  },
};

export default nextConfig;
