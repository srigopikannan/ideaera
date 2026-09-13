import postgres from 'postgres';

async function testConnection() {
  try {
    // Use the environment variable directly to avoid Drizzle schema assumptions
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      console.error("DATABASE_URL is not defined");
      process.exit(1);
    }

    const sql = postgres(connectionString);
    await sql`SELECT 1`;
    await sql.end();

    console.log("Database connection successful (Raw SQL verified)");
    process.exit(0);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Database connection failed:", message);
    process.exit(1);
  }
}

testConnection();
