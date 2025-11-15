# 🛠️ 環境変数一覧 (.env)

このプロジェクトの実行に必要な環境変数の一覧です。
ローカル開発では `.env.example` をコピーして `.env` ファイルを作成し、以下の値を設定してください。本番環境（Cloudflare Pages）では、プロジェクトのダッシュボードから設定が必要です。

## 1. Supabase (データベース & 認証)

### `DATABASE_URL`

- **目的:** API Routes (Edge Runtime) から **`postgres.js`** を使ってデータベース (PostgreSQL) に接続するために使用します。
- **【重要】:** **pgBouncer** の接続文字列（ポート `6543`）を使用してください。
- **取得場所:** Supabase ダッシュボード > [Project Settings] > [Database] > [Connection string] > [pgBouncer] (Transaction mode)
- **形式:** `postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres`

### `SUPABASE_JWT_SECRET`

- **目的:** Supabase Auth が発行した JWT (JSON Web Token) を API Routes 側で検証（署名を確認）するために使用します。
- **取得場所:** Supabase ダッシュボード > [Project Settings] > [API] > [JWT Settings] > [JWT Secret]

## 2. Cloudflare R2 (ストレージ)

### `R2_ACCOUNT_ID`

- **目的:** R2 バケットのエンドポイント URL を構築するために使用します。
- **取得場所:** Cloudflare ダッシュボード > [R2] > (概要ページの右側) > [アカウント ID]

### `R2_BUCKET_NAME`

- **目的:** 操作対象の R2 バケット名を指定します。
- **取得場所:** Cloudflare ダッシュボード > [R2] > (作成したバケットの名前)

### `R2_ACCESS_KEY_ID`

- **目的:** R2 API トークン (S3 互換 API) のアクセスキー ID です。
- **取得場所:** Cloudflare ダッシュボード > [R2] > [R2 API トークンの管理] > [トークンを作成する]

### `R2_SECRET_ACCESS_KEY`

- **目的:** R2 API トークン (S3 互換 API) のシークレットアクセスキーです。
- **取得場所:** 上記の `R2_ACCESS_KEY_ID` と同じトークン作成時に一度だけ表示されます。

## 3. GitHub Actions (CI/CD)

以下の変数は、ローカルの `.env` ではなく、GitHub リポジトリの [Settings] > [Secrets and variables] > [Actions] に設定します。`ci.yml` から参照されます。

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `DATABASE_URL` (CI/CD のビルドやテストで使用する場合)
