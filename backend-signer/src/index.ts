// backend-signer/src/index.ts
import { AwsClient } from "aws4fetch";

interface Env {
	R2_ACCOUNT_ID: string;
	R2_ACCESS_KEY_ID: string;
	R2_SECRET_ACCESS_KEY: string;
	R2_BUCKET_NAME: string;
	INTERNAL_API_KEY: string; // 勝手に使われないための簡易鍵
	TURNSTILE_SECRET_KEY: string; // Turnstileのシークレットキー
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		// CORSプリフライトリクエストへの対応
		if (request.method === "OPTIONS") {
			return new Response(null, {
				headers: {
					"Access-Control-Allow-Origin": "*", // TODO: 本番環境ではフロントエンドのドメインに制限する
					"Access-Control-Allow-Methods": "POST, OPTIONS",
					"Access-Control-Allow-Headers": "Content-Type, X-Internal-Key",
				},
			});
		}

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
		const body = await request.json() as { objectKey?: string; contentType?: string; turnstileToken?: string };
		const { objectKey, contentType, turnstileToken } = body;

		// 4. Turnstile トークンの検証
		if (!turnstileToken) {
			return new Response("Turnstile token is missing.", { status: 400 });
		}

		const ip = request.headers.get("CF-Connecting-IP");
		const formData = new FormData();
		formData.append("secret", env.TURNSTILE_SECRET_KEY);
		formData.append("response", turnstileToken);
		if (ip) {
			formData.append("remoteip", ip);
		}

		const turnstileResponse = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
			method: "POST",
			body: formData,
		});

		const turnstileResult = await turnstileResponse.json();
		if (!turnstileResult.success) {
			console.error("Turnstile verification failed:", turnstileResult['error-codes']);
			return new Response("Turnstile verification failed.", { status: 403 });
		}

		// 5. 必須パラメータの確認
		if (!objectKey || !contentType) {
			return new Response("Missing params: objectKey or contentType", { status: 400 });
		}

		// 6. 署名クライアントの作成
		const r2 = new AwsClient({
			accessKeyId: env.R2_ACCESS_KEY_ID,
			secretAccessKey: env.R2_SECRET_ACCESS_KEY,
			service: 's3',
			region: 'auto',
		});

		// 7. URLの構築
		const url = new URL(
			`https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET_NAME}/${objectKey}`
		);
		
		url.searchParams.set("X-Amz-Expires", "3600"); // 1時間有効

		// 8. 署名生成
		const signed = await r2.sign(url, {
			method: "PUT",
			headers: { "Content-Type": contentType },
			aws: { signQuery: true },
		});

		return new Response(JSON.stringify({ uploadUrl: signed.url }), {
			headers: { 
				"Content-Type": "application/json",
				"Access-Control-Allow-Origin": "*", // TODO: 本番環境ではフロントエンドのドメインに制限する
			},
		});
	},
};
