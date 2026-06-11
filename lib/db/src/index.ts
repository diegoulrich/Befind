import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

export * from "./schema";

const databaseUrl = process.env.DATABASE_URL;

const missingDatabaseProxy = new Proxy(
  {},
  {
    get() {
      throw new Error("DATABASE_URL environment variable is required before using the database client.");
    },
  },
) as ReturnType<typeof drizzle<typeof schema>>;

export const queryClient = databaseUrl
  ? postgres(databaseUrl, {
      prepare: false,
    })
  : null;

export const db = queryClient ? drizzle(queryClient, { schema }) : missingDatabaseProxy;
