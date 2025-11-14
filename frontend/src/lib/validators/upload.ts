// src/lib/validators/upload.ts
import { z } from "zod";

// 100MB を上限とする（例）
// 100 (MB) * 1024 (KB) * 1024 (Bytes) = 104,857,600 Bytes
const MAX_FILE_SIZE = 104857600;

export const uploadSignRequestSchema = z.object({
  // docs/openapi.yml に fileSize を追加
  fileSize: z
    .number()
    .min(1, "ファイルサイズが 0 です")
    .max(MAX_FILE_SIZE, `ファイルサイズが 100MB を超えています`),
  contentType: z
    .string()
    .regex(/^video\//, "ファイル形式は動画である必要があります"),
  // filename は今のところ使わないが、定義はしておく
  filename: z.string().optional(),
});

export type UploadSignRequest = z.infer<typeof uploadSignRequestSchema>;
