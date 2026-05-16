# Auth, RBAC, and Tenant Resolution

Garage OS は、単一PostgreSQLデータベース上で `tenant_id` と Row Level Security を使ってテナント分離します。APIはログイン後のJWTから `userId`, `tenantId`, `role` を確定し、各リクエストで `app.current_tenant` を設定してからDrizzle queryを実行します。

## Demo Account

`app/db/seed.sql` は以下の開発用管理者を作成します。

- email: `admin@example.jp`
- password: `password`
- role: `administrator`
- tenant: `田中モータース`

## Authentication Flow

1. `POST /api/auth/login` に email/password を送信する。
2. API は `users` と `tenant_memberships` を照合し、パスワードを `Bun.password.verify` で検証する。
3. 成功時にJWTを返す。payload は `sub`, `tenantId`, `role`, `exp` を含む。
4. フロントエンドはJWTを `localStorage` に保存し、以降のAPIに `Authorization: Bearer <token>` を付与する。
5. API middleware はJWTから membership を再確認し、Hono context に `tenantId`, `userId`, `role` を設定する。

## API

### `POST /api/auth/login`

Request:

```json
{
  "email": "admin@example.jp",
  "password": "password"
}
```

Response:

```json
{
  "token": "...",
  "expiresAt": 1790000000,
  "user": {
    "id": "...",
    "email": "admin@example.jp",
    "name": "デモ管理者",
    "role": "administrator",
    "tenant": {
      "id": "00000000-0000-0000-0000-000000000001",
      "name": "田中モータース"
    }
  }
}
```

### `GET /api/auth/me`

`Authorization` header のJWTを検証し、現在のユーザー情報を返します。

### `POST /api/auth/logout`

サーバー側セッションは持たないため `{ "ok": true }` を返します。フロントエンド側でJWTを破棄します。

## Roles

| Role | Purpose | Main permissions |
| --- | --- | --- |
| `administrator` | 管理者 | 全操作 |
| `manager` | 経営・管理 | Dashboard、請求閲覧、在庫閲覧 |
| `service_advisor` | フロント担当 | 顧客、予約、見積、請求、在庫操作 |
| `mechanic` | 整備士 | 作業指示更新、在庫閲覧 |

Route-level authorization は `requireRole([...])` middleware で行います。フロントエンドも同じroleに基づいてナビゲーションと操作ボタンを表示制御します。

## Development Fallback

`NODE_ENV !== "production"` の場合のみ、JWTなしでも `X-Tenant-Id` header による開発用アクセスを許可します。この場合 role は `administrator` として扱われます。

Production ではJWTが必須です。また `JWT_SECRET` が未設定の場合、productionでは起動しない想定です。

## RLS

業務テーブルは `tenant_id = current_setting('app.current_tenant')::uuid` を基準にRLS policyを設定します。APIは `withTenant(tenantId, callback)` 内で `set_config('app.current_tenant', tenantId, true)` を呼びます。

`users` と `tenant_memberships` はログイン時にテナント未確定で参照するため、RLS対象外です。業務データへのアクセスは membership 検証後の `tenantId` によって制御します。

RLS確認:

```sh
psql "$DATABASE_URL" -f app/db/rls_check.sql
```
