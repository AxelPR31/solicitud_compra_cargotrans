import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
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
