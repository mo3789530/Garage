# Garage OS

整備工場向け業務統合SaaSの初期MVPです。`.kiro/specs/garage-os` をもとに、Hono API、PostgreSQL + Drizzle ORM、Vite + React フロントで構成しています。

## 構成

- `app/`: Hono backend
- `app/src/db/schema.ts`: Drizzle ORM schema
- `app/src/features/*/routes.ts`: feature単位のAPI
- `app/drizzle.config.ts`: Drizzle migration 設定
- `app/db/schema.sql`: PostgreSQL DDL、RLS policy
- `app/db/seed.sql`: デモテナントの初期データ
- `frontend/`: Vite + React + Tailwind frontend
- `frontend/src/features/*`: 画面単位のReact components
- `frontend/src/components/ui/*`: shadcn/ui互換のローカルUI components
- `docs/auth-rbac.md`: 認証、RBAC、テナント解決の仕様

## セットアップ

PostgreSQL を用意し、DDL と seed を投入します。

```sh
psql "$DATABASE_URL" -f app/db/schema.sql
psql "$DATABASE_URL" -f app/db/seed.sql
```

Drizzle schema から migration を生成する場合は次を使います。

```sh
cd app
DATABASE_URL="postgres://user:password@localhost:5432/garage_os" bun run db:generate
DATABASE_URL="postgres://user:password@localhost:5432/garage_os" bun run db:migrate
DATABASE_URL="postgres://user:password@localhost:5432/garage_os" bun run db:seed
```

API を起動します。

```sh
cd app
DATABASE_URL="postgres://user:password@localhost:5432/garage_os" bun run dev
```

フロントを起動します。

```sh
cd frontend
npm run dev
```

JWTなしの開発用テナントアクセスを使う場合は、API起動時に `ALLOW_DEV_TENANT_OVERRIDE=true` を明示してください。この場合のみ `X-Tenant-Id: 00000000-0000-0000-0000-000000000001` が使えます。フロントでは `VITE_TENANT_ID` で変更できます。本番環境ではこの上書きは無効です。

デモログイン:

- email: `admin@example.jp`
- password: `password`

認証と権限の詳細は `docs/auth-rbac.md` を参照してください。

## 実装済み

- Postgres RLS 前提のマルチテナント分離
- Drizzle ORM schema と query builder ベースのAPI
- 顧客・車両管理
- 車検期限リマインド抽出
- 予約登録、整備士アサイン、重複予約防止
- 作業指示ステータス更新
- AI見積の簡易候補生成、請求化、入金登録
- 部品在庫と低在庫アラート
- 部品の入出庫調整と発注書作成
- KPIダッシュボード
- Tailwind CSS と shadcn/ui 互換コンポーネントによる画面構成
- JWT認証、RBAC、ログイン画面

## 確認

```sh
cd app && bun run build
cd app && bun run typecheck
cd app && bun test
cd app && bun run lint
cd app && bun run ci
cd frontend && npm run lint
cd frontend && npm run test
cd frontend && npm run build
cd frontend && npm run ci
```

RLSのDB確認は次を実行します。

```sh
cd app
DATABASE_URL="postgres://user:password@localhost:5432/garage_os" bun run db:check:rls
```
