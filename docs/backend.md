# Backend 開発規約 (Next.js API Routes)

本ドキュメントは、Next.js API Routes, Prisma, Supabase, R2 を使用するバックエンド開発における、セキュリティ、信頼性、移植性のための規約を定義します。

## 1. 📜 基本原則

> **「クライアントを信用するな。ロジックを分離せよ。クエリを最適化せよ」**

- **セキュリティ・バイ・デザイン:** すべてのエンドポイントは、デフォルトでセキュアであるよう設計します（認証・認可・検証）。
- **移植性:** 特定のベンダー（Supabase）に強く依存するロジックは避け、可能な限り標準的な技術（SQL, S3 互換 API）で実装します。（非機能要件 [NFR-P1]）
- **単一責任:** API ハンドラは「HTTP リクエストの処理」に専念し、ビジネスロジックは「サービス層」に分離します。

## 2. 🛡️ セキュリティ (最重要)

- **認証:**
  - 保護が必要なすべてのエンドポイントで、**JWT の検証を必須**とします。
  - 検証ロジックはミドルウェアまたは共通関数に集約します。
- **認可 (Authorization):**
  - **「認証」と「認可」は別物**です。認証されたユーザーが「他人のリソース」を操作できないか、必ずチェックします。
  - 例: `DELETE /api/videos/[id]` は、`videoId` の所有者が `auth.userId` と一致するかを必ず検証します。
  - **Supabase RLS と API での二重チェック**を推奨します。（NFR: セキュリティ）
- **入力バリデーション:**
  - **Zod** の使用を必須とします。
  - `req.body` や `req.query` から受け取った値は、処理する前に **必ず Zod スキーマでバリデーション** します。これにより、型安全性とセキュリティ（SQL インジェクション等の対策）を担保します。

## 3. 🗄️ データベース (Prisma & Supabase)

### 3.1. Prisma の役割 (スキーマ管理のみ)

**【最重要】** `supabase connect` 経由の接続がリジェクトされるため、ランタイム（API Routes）で **`Prisma Client` を使用することを禁止**します。

Prisma は、`schema.prisma` でのスキーマ定義と、マイグレーション SQL ファイルを**生成するためだけ**に使用します。

### 3.2. 必須の開発ワークフロー (スキーマ変更時)

1.  `schema.prisma` ファイルを編集してモデル（テーブル定義）を変更します。
2.  ローカルで `npx prisma migrate dev` コマンドを実行し、`migrations/` フォルダ配下に SQL マイグレーションファイル（`migration.sql`）を**生成**させます。
3.  生成された `migration.sql` ファイルの中身（`CREATE TABLE ...`, `ALTER TABLE ...` 等）をコピーします。
4.  Supabase プロジェクトのダッシュボードにある「SQL Editor」を開き、コピーした SQL を**手動で貼り付けて実行**し、データベーススキーマを更新します。

### 3.3. ランタイムのデータ操作

- **`node-postgres` (`pg`) の使用:**
  - API Routes から Supabase DB に対してクエリ（SELECT, INSERT 等）を実行する場合は、**`node-postgres` (`pg`)** などの標準的な PostgreSQL クライアントライブラリを使用します。
  - 接続文字列は Supabase の設定（`[Project Settings]` > `[Database]` > `[Connection string]`）から取得し、環境変数 (`DATABASE_URL`) に設定します。
- **クエリ最適化:**
  - **N+1 問題の回避:** ループ内で個別に SQL を実行することを禁止します。`JOIN` や `WHERE id = ANY($1)` (配列バインド) を使用します。
- **トランザクション:**
  - 複数のテーブルにまたがる書き込み処理は、必ず `BEGIN`, `COMMIT`, `ROLLBACK` を使用したトランザクションで処理の原子性を保証します。

## 4. 📦 ストレージ (Cloudflare R2)

- **S3 互換 API の使用:**
  - R2 へのアクセスは、**`@aws-sdk/client-s3`** を使用します。（NFR: 移植性 [NFR-P3]）
- **署名付き URL (Presigned URL):**
  - 動画アップロードは、API が「署名付き URL」を発行し、クライアントがその URL に直接 PUT する方式を厳守します。（NFR: セキュリティ [NFR-S4]）
  - API サーバーが動画のバイナリデータを受け取らないようにします（サーバーレス関数のリミット回避と負荷軽減のため）。
- **【重要】R2 アップロード時の CORS エラー対応:**
  - **問題:** ブラウザ（フロントエンド）から署名付き URL を使って R2 に直接 `PUT`（アップロード）しようとすると、CORS エラーが発生します。
  - **原因:** R2 バケット側で、外部オリジン（例: `https://app.example.com`）からのリクエストが許可されていないためです。
  - **対策:** Cloudflare のダッシュボードで、対象の R2 バケットの「Settings」タブから **CORS ポリシー**を設定する必要があります。
  - **設定例 (JSON):**
    ```json
    [
      {
        "AllowedOrigins": [
          "[https://app.example.com](https://app.example.com)",
          "https://*.app.example.com",
          "http://localhost:3000"
        ],
        "AllowedMethods": ["PUT", "POST", "GET"],
        "AllowedHeaders": ["*"],
        "ExposeHeaders": [],
        "MaxAgeSeconds": 3000
      }
    ]
    ```

## 5. 🏗️ アーキテクチャ

- **サービス層 (Service Layer) の分離:**

  - API ハンドラ (`/pages/api/...`) にビジネスロジックを直接記述することを禁止します。
  - ロジックは `/services/videoService.ts` のようなファイルに分離します。

  ```typescript
  // 悪い例: /pages/api/like.ts
  export default async function handler(req, res) {
    // 認証、バリデーション、DB操作がすべてここにある
    const userId = ...
    const { videoId } = ...
    // DB操作
    res.status(200).json(...);
  }

  // 良い例
  // /lib/dbClient.ts (pg を使ったクライアント)
  import { Pool } from 'pg';
  export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  // /services/videoService.ts
  import { pool } from '@/lib/dbClient';
  export const likeVideo = async (userId: string, videoId: string) => {
    // 複雑なビジネスロジック（例：既にいいねしていないかチェック）
    return await pool.query('INSERT INTO likes ...', [userId, videoId]);
  }

  // /pages/api/like.ts
  import * as videoService from '@/services/videoService';
  export default async function handler(req, res) {
    try {
      const userId = await getUserId(req); // 認証
      const { videoId } = validateLikeRequest(req.body); // 検証

      const like = await videoService.likeVideo(userId, videoId); // ★ロジック呼び出し

      res.status(200).json({ success: true, data: like.rows[0] });
    } catch (error) {
      handleApiError(error, res); // ★エラーハンドリング
    }
  }
  ```

  - **エラーハンドリング:**
    - API ハンドラは必ず `try...catch` ブロックで囲みます。
    - `catch` したエラーは、中央のエラーハンドラ（`handleApiError`）に渡し、**Sentry** にログを送信します。（NFR: 監視）
    - クライアントには詳細なエラーメッセージ（スタックトレースなど）を返さず、「内部サーバーエラー」などの汎用メッセージを返します。

## 6\. ✅ テスト

- **ユニットテスト (Vitest / Jest):**
  - 対象: **サービス層**（`videoService.ts` など）のすべてのビジネスロジック。
  - DB に依存しない純粋なロジックをテストします。
- **インテグレーションテスト:**
  - 対象: API エンドポイント。
  - テスト用の DB（Supabase の別プロジェクト or Docker）を使用し、リクエストの送信から DB への書き込みまでを一貫してテストします。
