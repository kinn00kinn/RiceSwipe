# 🚀 デプロイ・インフラ構築手順

このドキュメントは、RiceSwipe プロジェクトをゼロからセットアップし、Cloudflare Pages にデプロイするまでの手順をまとめたものです。

## 1. Supabase プロジェクトのセットアップ

1.  **プロジェクト作成:** Supabase で新規プロジェクトを作成します。
2.  **DB 接続情報:** [Project Settings] > [Database] から `DATABASE_URL` (Connection string) を取得します。
3.  **JWT Secret:** [Project Settings] > [API] から `SUPABASE_JWT_SECRET` を取得します。
4.  **Auth 設定:** [Authentication] > [Providers] で `Google` を有効化します。
5.  **RLS 無効化 (初期):** `schema.prisma` に基づくテーブルを作成する際、RLS (Row Level Security) が有効だとアクセス拒否されるため、一時的に無効化するか、`postgres` ロールに権限を付与します。
6.  **(重要) テーブル作成:**
    - `docs/設計書.md` にある `schema.prisma` をもとに、ローカルで `npx prisma migrate dev` を実行して `migrations/` に SQL ファイルを生成します。
    - 生成された SQL の中身をコピーし、Supabase ダッシュボードの [SQL Editor] に**手動で貼り付けて実行**します。(`Prisma Client` はランタイムで使用しません)。
7.  **RLS 有効化:** テーブル作成後、`docs/設計書.md` のポリシー定義に基づき、各テーブルに RLS ポリシーを設定します。

## 2. Cloudflare R2 バケットのセットアップ

1.  **バケット作成:** Cloudflare ダッシュボード > [R2] から、`R2_BUCKET_NAME` となるバケットを新規作成します。
2.  **API トークン発行:**
    - [R2] > [R2 API トークンの管理] に進みます。
    - 「トークンを作成する」をクリックし、[読み取りと書き込み] 権限を付与したトークンを発行します。
    - `R2_ACCESS_KEY_ID` と `R2_SECRET_ACCESS_KEY` を安全な場所に控えます。
3.  **アカウント ID:** [R2] 概要ページの右側から `R2_ACCOUNT_ID` を控えます。
4.  **(重要) CORS 設定:**
    - 作成したバケットの [Settings] タブを開きます。
    - [CORS ポリシー] の「編集」をクリックし、フロントエンド（ブラウザ）からの直接アップロード (`PUT`) を許可するポリシーを設定します。
    - **設定例（`docs/backend.md` より）:**
      ```json
      [
        {
          "AllowedOrigins": [
            "https://(デプロイ先のドメイン)",
            "http://localhost:3000"
          ],
          "AllowedMethods": ["PUT", "GET"],
          "AllowedHeaders": ["*"],
          "MaxAgeSeconds": 3000
        }
      ]
      ```

## 3. Cloudflare Pages へのデプロイ

1.  **プロジェクト作成:** Cloudflare ダッシュボード > [Workers & Pages] > [Pages] から「アプリケーションを作成」をクリックします。
2.  **GitHub 連携:** このプロジェクトの GitHub リポジトリを選択します。
3.  **ビルド設定:**
    - **ビルドコマンド:** `npm run build`
    - **ビルド出力ディレクトリ:** `.next` (Next.js の設定)
    - **フレームワークプリセット:** `Next.js`
4.  **環境変数:**
    - [環境変数] > [本番環境] および [プレビュー環境] に、`docs/environment.md` で定義されたすべての環境変数（`DATABASE_URL`, `SUPABASE_JWT_SECRET`, `R2_...` など）を設定します。
5.  **デプロイ:** 「保存してデプロイする」を実行します。

## 4. GitHub Actions の設定

Cloudflare Pages の自動デプロイ（`ci.yml`）を別途使用する場合は、GitHub リポジトリの [Settings] > [Secrets] に `CLOUDFLARE_API_TOKEN` などを設定してください。
