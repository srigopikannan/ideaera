import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
  db: PostgresJsDatabase<typeof schema> | undefined;
};

function getConnectionString(): string | undefined {
  return (
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING
  );
}

function getDb(): PostgresJsDatabase<typeof schema> {
  if (!globalForDb.db) {
    const connectionString = getConnectionString();
    if (!connectionString) {
      throw new Error(
        "Database connection string is missing. Please ensure POSTGRES_URL or DATABASE_URL is set in your Vercel Supabase integration environment variables."
      );
    }

    if (!globalForDb.conn) {
      globalForDb.conn = postgres(connectionString, {
        prepare: false, // Required for Supabase transaction pooler in serverless environments
      });
    }

    globalForDb.db = drizzle(globalForDb.conn, { schema });
  }

  return globalForDb.db;
}

export const db: PostgresJsDatabase<typeof schema> = new Proxy(
  {} as PostgresJsDatabase<typeof schema>,
  {
    get(_target, prop) {
      const instance = getDb();
      const value = instance[prop as keyof PostgresJsDatabase<typeof schema>];
      if (typeof value === 'function') {
        return value.bind(instance);
      }
      return value;
    },
  }
);

export type Db = PostgresJsDatabase<typeof schema>;

