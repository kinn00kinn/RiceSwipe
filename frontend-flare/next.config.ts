import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // ▼▼▼ 追加設定: Cloudflare Workers向けにNode.jsモジュールを無効化 ▼▼▼
  webpack: (config) => {
    // AWS SDKなどが fs, net などを読み込もうとしてもエラーにならないよう、
    // 空のモジュール (false) に置き換えます。
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      child_process: false,
    };
    return config;
  },
  // ▲▲▲ 追加設定ここまで ▲▲▲
};

export default nextConfig;

// Enable calling `getCloudflareContext()` in `next dev`.
// See https://opennext.js.org/cloudflare/bindings#local-access-to-bindings.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
