# 🤝 貢献ガイドライン (CONTRIBUTING)

このプロジェクトへの貢献に興味を持っていただきありがとうございます！

## 開発フロー

1.  `main` ブランチから最新の変更を Pull します。
2.  `feature/（機能名）` や `fix/（修正内容）` といったブランチを作成します。
    - 例: `feature/video-feed-api`
3.  コードを修正し、`frontend.md` `backend.md` の規約に従います。
4.  変更を Commit します。Commit メッセージは規約（例: `feat: ...`, `fix: ...`）に従ってください。
5.  GitHub に Push します。
6.  `main` ブランチへの Pull Request を作成します。
7.  `.github/pull_request_template.md` のチェックリストをすべて埋めてください。
8.  レビュアーから Appove をもらったら、マージします。

## 開発環境のセットアップ

1. リポジトリをクローンします。
2. `.env.example` をコピーして `.env` を作成し、必要な環境変数（Supabase 接続情報など）を設定します。
3. `npm install` を実行します。
4. `npx prisma generate` を実行します。
5. `npm run dev` でローカルサーバーを起動します。

## 質問・相談

Issue を立てる前に、まずは `docs/` 以下のドキュメントを確認してください。
解決しない場合は、(Slack / Discord) で気軽に質問してください。
