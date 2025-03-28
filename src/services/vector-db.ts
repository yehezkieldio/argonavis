import { container } from "@sapphire/framework";
import { and, eq, sql } from "drizzle-orm";
import { db } from "#/database";
import { type MessageMetadata, messages } from "#/database/schema";
import { env } from "#/env";
import { generateEmbedding } from "#/services/gemini";

interface StoredMessageData extends MessageMetadata {
    embedding: number[];
}

export async function addMessageToVectorDb(
    messageId: string,
    text: string,
    metadata: Omit<MessageMetadata, "messageId" | "timestamp" | "originalText"> & {
        timestamp: number;
        originalText: string;
    }
): Promise<void> {
    if (!text || text.trim().length === 0) {
        container.logger.warn(`Skipping empty message (ID: ${messageId}) for vector DB storage.`);
        return;
    }

    try {
        let embeddingVector: number[] = await generateEmbedding(text);
        const expectedDimensions: number = env.PGVECTOR_DIMENSION;
        if (embeddingVector.length !== expectedDimensions) {
            container.logger.warn(
                `Embedding dimension mismatch: got ${embeddingVector.length}, expected ${expectedDimensions}. Resizing vector.`
            );

            if (embeddingVector.length > expectedDimensions) {
                embeddingVector = embeddingVector.slice(0, expectedDimensions);
            } else {
                embeddingVector = [...embeddingVector, ...Array(expectedDimensions - embeddingVector.length).fill(0)];
            }
        }

        const dataToInsert: StoredMessageData = {
            messageId: messageId,
            userId: metadata.userId,
            channelId: metadata.channelId,
            guildId: metadata.guildId,
            timestamp: new Date(metadata.timestamp),
            contentType: metadata.contentType,
            originalText: metadata.originalText,
            embedding: embeddingVector
        };

        await db.insert(messages).values(dataToInsert);

        container.logger.info(
            `Message (ID: ${messageId}) added to vector DB with embedding vector of length ${embeddingVector.length}.`
        );
    } catch (e) {
        container.logger.error(`Error adding message to vector DB: ${e}`);
        container.logger.error(e);
    }
}

export async function searchSimiliarMessages(
    queryText: string,
    nResults: number = env.MAX_CONTEXT_MESSAGES,
    filterUserId?: string,
    filterChannelId?: string
): Promise<MessageMetadata[]> {
    if (!queryText || queryText.trim().length === 0) return [];

    try {
        let queryEmbedding: number[] = await generateEmbedding(queryText);
        const expectedDimensions = env.PGVECTOR_DIMENSION;
        if (queryEmbedding.length !== expectedDimensions) {
            container.logger.warn(
                `Search embedding dimension mismatch: got ${queryEmbedding.length}, expected ${expectedDimensions}. Resizing vector.`
            );

            if (queryEmbedding.length > expectedDimensions) {
                queryEmbedding = queryEmbedding.slice(0, expectedDimensions);
            } else {
                queryEmbedding = [...queryEmbedding, ...Array(expectedDimensions - queryEmbedding.length).fill(0)];
            }
        }

        const queryEmbeddingString: string = JSON.stringify(queryEmbedding);

        const filters = [];
        if (filterUserId) {
            filters.push(eq(messages.userId, filterUserId));
        }
        if (filterChannelId) {
            filters.push(eq(messages.channelId, filterChannelId));
        }
        const whereClause = filters.length > 0 ? and(...filters) : undefined;

        const distance = sql<number>`${messages.embedding} <-> ${queryEmbeddingString}`.as("distance");

        const results = await db
            .select({
                messageId: messages.messageId,
                userId: messages.userId,
                guildId: messages.guildId,
                channelId: messages.channelId,
                timestamp: messages.timestamp,
                contentType: messages.contentType,
                originalText: messages.originalText,
                distance
            })
            .from(messages)
            .where(whereClause)
            .orderBy(distance)
            .limit(nResults);

        container.logger.info(`Found ${results.length} similar messages for query text.`);

        const relevantMetadata: MessageMetadata[] = results.map((row) => ({
            messageId: row.messageId,
            userId: row.userId,
            guildId: row.guildId,
            channelId: row.channelId,
            timestamp: row.timestamp,
            contentType: row.contentType as "user_message" | "bot_response",
            originalText: row.originalText
        }));

        relevantMetadata.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        return relevantMetadata;
    } catch (e) {
        container.logger.error(`Error generating embedding for query text: ${e}`);
        return [];
    }
}
