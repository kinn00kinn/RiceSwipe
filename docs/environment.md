# 🛠️ 環境変数一覧 (.env)

このプロジェクトの実行に必要な環境変数の一覧です。
ローカル開発では `.env.example` をコピーして `.env` ファイルを作成し、以下の値を設定してください。本番環境（Cloudflare Pages）では、プロジェクトのダッシュボードから設定が必要です。

## 1. Supabase (データベース & 認証)

### `DATABASE_URL`

- **目的:** API Routes からデータベース (PostgreSQL) に接続するために使用します ( `node-postgres` 用)。
- **取得場所:** Supabase ダッシュボード > [Project Settings] > [Database] > [Connection string] > [Nodejs]
- **形式:** `postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres`

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

## 3. Gemini API (AI 機能)

### `GEMINI_API_KEY`

- **目的:** Google の Gemini API をバックエンドから呼び出すために使用します。
- **取得場所:** Google AI Studio (旧 MakerSuite) などで発行した API キー。

## 4. GitHub Actions (CI/CD)

以下の変数は、ローカルの `.env` ではなく、GitHub リポジトリの [Settings] > [Secrets and variables] > [Actions] に設定します。`ci.yml` から参照されます。

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `DATABASE_URL` (CI/CD のビルドやテストで使用する場合)
