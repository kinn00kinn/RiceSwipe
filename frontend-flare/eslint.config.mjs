// @ts-check

import tseslint from "typescript-eslint";
import nextConfig from "eslint-config-next";

/** @type {import('typescript-eslint').Config} */
export default tseslint.config(
  // 1. Next.js の標準設定（React, TypeScript, a11y 等をすべて含む）を適用
  ...nextConfig,

  // 2. グローバルな ignore 設定
  {
    ignores: [".next/**", "node_modules/**", ".open-next/**"],
  },

  // 3. プロジェクト固有のカスタムルールを「上書き」
  //    (必ず nextConfig の *後* に記述してください)
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      // 元のファイルにあったカスタムルール
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // 他にも上書きしたいルールがあればここに追加
    },
  }
);
