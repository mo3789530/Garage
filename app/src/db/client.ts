import { SQL } from "bun";
import { sql } from "drizzle-orm";
import { drizzle, type BunSQLDatabase } from "drizzle-orm/bun-sql";
import * as schema from "./schema";

const client = new SQL(process.env.DATABASE_URL || process.env.POSTGRES_URL || "");

export const db = drizzle(client, { schema });

export type AppDb = BunSQLDatabase<typeof schema>;
export type TenantTx = Parameters<Parameters<AppDb["transaction"]>[0]>[0];

export async function withTenant<T>(tenantId: string, callback: (tx: TenantTx) => Promise<T>) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.current_tenant', ${tenantId}, true)`);
    return callback(tx);
  });
}
