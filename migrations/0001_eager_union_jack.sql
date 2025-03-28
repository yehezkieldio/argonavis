ALTER TABLE "message" ALTER COLUMN "message_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "message" ALTER COLUMN "channel_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "message" ALTER COLUMN "guild_id" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "message_id_index" ON "message" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "channel_id_index" ON "message" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "guild_id_index" ON "message" USING btree ("guild_id");--> statement-breakpoint
CREATE INDEX "timestamp_index" ON "message" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "content_type_index" ON "message" USING btree ("content_type");