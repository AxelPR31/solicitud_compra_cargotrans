import path from "path";
import type { NextConfig } from "next";

const excelJsBrowser = path.join(
  __dirname,
  "node_modules/exceljs/dist/exceljs.min.js",
);

const nextConfig: NextConfig = {
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
