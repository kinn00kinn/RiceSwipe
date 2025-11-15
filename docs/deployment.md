# 🚀 デプロイ・インフラ構築手順

このドキュメントは、RiceSwipe プロジェクトをゼロからセットアップし、Cloudflare Pages にデプロイするまでの手順をまとめたものです。

## 1. Supabase プロジェクトのセットアップ

1.  **プロジェクト作成:** Supabase で新規プロジェクトを作成します。
2.  **DB接続情報:** [Project Settings] > [Database] > [Connection string] > **[pgBouncer]** (ポート `6543`) から `DATABASE_URL` を取得します。
3.  **JWT Secret:** [Project Settings] > [API] から `SUPABASE_JWT_SECRET` を取得します。
4.  **Auth設定:** [Authentication] > [Providers] で `Google` を有効化します。
5.  **(重要) テーブル作成:**
    - `docs/設計書.md` にある `schema.prisma` をもとに、ローカルで `npx prisma migrate dev` を実行して `migrations/` に SQL ファイルを生成します。
    - 生成された SQL の中身をコピーし、Supabase ダッシュボードの [SQL Editor] に**手動で貼り付けて実行**します。
6.  **RLS有効化:** テーブル作成後、`docs/設計書.md` のポリシー定義に基づき、各テーブルに RLS ポリシーを設定します。

## 2. Cloudflare R2 バケットのセットアップ

1.  **バケット作成:** Cloudflare ダッシュボード > [R2] から、`R2_BUCKET_NAME` となるバケットを新規作成します。
2.  **APIトークン発行:**
    - [R2] > [R2 API トークンの管理] に進みます。
    - 「トークンを作成する」をクリックし、[読み取りと書き込み] 権限を付与したトークンを発行します。
    - `R2_ACCESS_KEY_ID` と `R2_SECRET_ACCESS_KEY` を安全な場所に控えます。
3.  **アカウントID:** [R2] 概要ページの右側から `R2_ACCOUNT_ID` を控えます。
4.  **(重要) CORS 設定:**
    - 作成したバケットの [Settings] タブを開きます。
    - [CORS ポリシー] の「編集」をクリックし、`docs/backend.md` に記載のポリシー（`AllowedOrigins` にデプロイドメインと localhost を指定）を設定します。

## 3. Cloudflare Pages へのデプロイ

1.  **プロジェクト作成:** Cloudflare ダッシュボード > [Workers & Pages] > [Pages] から「アプリケーションを作成」をクリックします。
2.  **GitHub連携:** このプロジェクトの GitHub リポジトリを選択します。
3.  **ビルド設定:**
    - **ビルドコマンド:** `npm run build`
    - **ビルド出力ディレクトリ:** `.next`
    - **フレームワークプリセット:** `Next.js`
4.  **環境変数:**
    - [環境変数] > [本番環境] および [プレビュー環境] に、`docs/environment.md` で定義されたすべての環境変数（`DATABASE_URL` (pgBouncer), `SUPABASE_JWT_SECRET`, `R2_...` など）を設定します。
5.  **互換性フラグ (確認):**
    - `postgres.js` と Edge Runtime を使用するため、`nodejs_compat` フラグは**不要**です。Cloudflare Pages の標準設定で動作します。
6.  **デプロイ:** 「保存してデプロイする」を実行します。