import type { InferSelectModel } from "drizzle-orm";
import { index, pgEnum, pgTable, text, timestamp, vector } from "drizzle-orm/pg-core";
import { generateUlid } from "#/database/utils/generate-ulid";
import { ulid } from "#/database/utils/ulid-custom-type";
import { env } from "#/env";

export const contentTypeEnum = pgEnum("content_type", ["user_message", "bot_response"]);

export const messages = pgTable(
    "message",
    {
        id: ulid("id")
            .primaryKey()
            .$default(() => generateUlid()),
        messageId: text("message_id").notNull(),
        userId: text("user_id").notNull(),
        channelId: text("channel_id").notNull(),
        guildId: text("guild_id").notNull(),
        timestamp: timestamp("timestamp", { withTimezone: true, mode: "date" }).notNull(),
        contentType: contentTypeEnum("content_type").notNull(),
        originalText: text("original_text").notNull(),
        embedding: vector("embedding", { dimensions: env.PGVECTOR_DIMENSION }).notNull()
    },
    (table) => [
        index("message_id_index").on(table.messageId),
        index("channel_id_index").on(table.channelId),
        index("guild_id_index").on(table.guildId),
        index("timestamp_index").on(table.timestamp),
        index("content_type_index").on(table.contentType),
        index("ip_index").using("hnsw", table.embedding.op("vector_cosine_ops"))
    ]
);

export type Message = InferSelectModel<typeof messages>;
export type MessageMetadata = Omit<InferSelectModel<typeof messages>, "id" | "embedding">;
