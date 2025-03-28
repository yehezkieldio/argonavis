CREATE EXTENSION IF NOT EXISTS vector;
CREATE TYPE "public"."content_type" AS ENUM('user_message', 'bot_response');--> statement-breakpoint
CREATE TABLE "message" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"message_id" text,
	"channel_id" text,
	"guild_id" text,
	"timestamp" timestamp with time zone NOT NULL,
	"content_type" "content_type" NOT NULL,
	"original_text" text NOT NULL,
	"embedding" vector(768) NOT NULL
);
--> statement-breakpoint
CREATE INDEX "ip_index" ON "message" USING hnsw ("embedding" vector_cosine_ops);