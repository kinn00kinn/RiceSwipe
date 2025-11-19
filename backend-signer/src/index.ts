// backend-signer/src/index.ts
import { AwsClient } from "aws4fetch";

interface Env {
	R2_ACCOUNT_ID: string;
	R2_ACCESS_KEY_ID: string;
	R2_SECRET_ACCESS_KEY: string;
	R2_BUCKET_NAME: string;
	INTERNAL_API_KEY: string; // 勝手に使われないための簡易鍵
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		// 1. メソッド確認
		if (request.method !== "POST") {
			return new Response("Method Not Allowed", { status: 405 });
		}

		// 2. 簡易認証 (Next.jsからのアクセスのみ許可)
		const authHeader = request.headers.get("X-Internal-Key");
		if (authHeader !== env.INTERNAL_API_KEY) {
			return new Response("Unauthorized", { status: 401 });
		}

		// 3. リクエストの解析
		const { objectKey, contentType } = await request.json() as { objectKey: string; contentType: string };
		if (!objectKey || !contentType) {
			return new Response("Missing params", { status: 400 });
		}

		// 4. 署名クライアントの作成 (軽量・高速)
		const r2 = new AwsClient({
			accessKeyId: env.R2_ACCESS_KEY_ID,
			secretAccessKey: env.R2_SECRET_ACCESS_KEY,
			service: 's3',
			region: 'auto',
		});

		// 5. URLの構築
		const url = new URL(
			`https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET_NAME}/${objectKey}`
		);
		
		// クエリパラメータの設定
		url.searchParams.set("X-Amz-Expires", "3600"); // 1時間有効

		// 6. 署名生成
		const signed = await r2.sign(url, {
			method: "PUT",
			headers: { "Content-Type": contentType },
			aws: { signQuery: true },
		});

		return new Response(JSON.stringify({ uploadUrl: signed.url }), {
			headers: { "Content-Type": "application/json" },
		});
	},
};