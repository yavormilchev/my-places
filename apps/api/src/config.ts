import { config } from "dotenv";
import path from "node:path";

config({ path: path.resolve(import.meta.dirname, "../../../.env") });

function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl:  required("DATABASE_URL", process.env.DATABASE_URL)
}
