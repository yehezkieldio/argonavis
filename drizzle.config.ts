import { defineConfig } from "drizzle-kit";
import { env } from "#/env";

export default defineConfig({
    out: "./migrations",
    schema: "./src/database/schema.ts",
    dialect: "postgresql",
    casing: "snake_case",
    dbCredentials: {
        url: env.DATABASE_URL
    },
    tablesFilter: ["argonavis_*"]
});
