import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
    server: {
        NODE_ENV: z.enum(["development", "production"]),
        DATABASE_URL: z.string(),
        DISCORD_TOKEN: z.string(),
        DISCORD_CLIENT_ID: z.string(),
        GEMINI_API_KEY: z.string(),
        DEFAULT_PREFIX: z.string().default("argo!"),
        PGVECTOR_DIMENSION: z.coerce.number().default(768),
        MAX_CONTEXT_MESSAGES: z.coerce.number().default(5),
        LOKI_URL: z.string().optional(),
        LOKI_USER: z.string().optional(),
        LOKI_PASSWORD: z.string().optional()
    },
    runtimeEnv: process.env
});
