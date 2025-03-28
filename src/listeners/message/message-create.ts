import type { Content } from "@google/generative-ai";
import { Listener } from "@sapphire/framework";
import type { Message } from "discord.js";
import { env } from "#/env";
import { ArgoNavisEvents } from "#/libs/extensions/constants/events";
import { generateText } from "#/services/gemini";
import { addMessageToVectorDb, searchSimiliarMessages } from "#/services/vector-db";

const BOT_MENTION_REGEX = new RegExp(`^<@!?${env.DISCORD_CLIENT_ID}>`);

export class MessageCreateListener extends Listener {
    public constructor(context: Listener.LoaderContext, options: Listener.Options) {
        super(context, {
            ...options,
            once: false,
            event: ArgoNavisEvents.MessageCreate
        });
    }

    splitMessage(text: string, maxLength: number): string[] {
        const chunks: string[] = [];
        let currentChunk = "";

        const lines: string[] = text.split("\n");

        for (const line of lines) {
            if (currentChunk.length + line.length + 1 <= maxLength) {
                currentChunk += (currentChunk.length > 0 ? "\n" : "") + line;
            } else {
                // If the current line itself exceeds the max length, split it forcefully
                if (line.length > maxLength) {
                    // Push existing chunk if any
                    if (currentChunk.length > 0) {
                        chunks.push(currentChunk);
                        currentChunk = "";
                    }
                    // Split the long line
                    for (let i = 0; i < line.length; i += maxLength) {
                        chunks.push(line.substring(i, i + maxLength));
                    }
                } else {
                    // Push the current chunk and start a new one with the current line
                    chunks.push(currentChunk);
                    currentChunk = line;
                }
            }
        }
        // Push the last remaining chunk
        if (currentChunk.length > 0) {
            chunks.push(currentChunk);
        }

        // Final check in case a chunk is still too long (edge case with very long word)
        return chunks.flatMap((chunk) => {
            if (chunk.length > maxLength) {
                const subChunks = [];
                for (let i = 0; i < chunk.length; i += maxLength) {
                    subChunks.push(chunk.substring(i, i + maxLength));
                }
                return subChunks;
            }
            return chunk;
        });
    }

    public async run(message: Message): Promise<void> {
        if (message.author.bot) return;
        if (message.channelId !== "909727361413550130") return;
        if (message.author.id !== "327849142774923266") return;

        if (message.partial) {
            try {
                await message.fetch();
            } catch (error) {
                console.error("Could not fetch partial message:", error);
                return;
            }
        }

        const mention: boolean =
            message.mentions.users.has(env.DISCORD_CLIENT_ID) ||
            message.mentions.repliedUser?.id === env.DISCORD_CLIENT_ID;

        if (!mention || !BOT_MENTION_REGEX.test(message.content.trimStart())) {
            if (!message.reference?.messageId) {
                return;
            }

            try {
                const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
                if (repliedMessage.author.id !== env.DISCORD_CLIENT_ID) {
                    return;
                }
            } catch (error) {
                this.container.logger.error("Error fetching replied message:", error);
            }
        }

        const userId = message.author.id;
        const channelId = message.channel.id;
        const guildId = message.guild?.id as string;
        const messageId = message.id;
        const timestamp = message.createdTimestamp;

        let userQuery = message.content.replace(BOT_MENTION_REGEX, "").trim();
        if (!userQuery) {
            message.reply("Hello! How can I help you today?");
            return;
        }

        this.container.logger.info(
            `[${new Date(timestamp).toISOString()}] User ${message.author.username} (ID: ${userId}) in Channel ${channelId}: "${userQuery}"`
        );

        try {
            addMessageToVectorDb(messageId, userQuery, {
                userId,
                channelId,
                guildId,
                timestamp,
                contentType: "user_message",
                originalText: userQuery
            }).catch((err) => console.error("Failed to store user message in background:", err));

            const contextMessages = await searchSimiliarMessages(
                userQuery,
                env.MAX_CONTEXT_MESSAGES,
                userId,
                channelId
            );

            const history: Content[] = [];

            history.push({
                role: "user",
                parts: [
                    {
                        text: "You are a helpful Discord bot called ArgoNavis. Use the provided conversation history (if any) to answer the user's current query accurately and conversationally. The history is ordered from oldest to newest relevant message."
                    }
                ]
            });
            history.push({
                role: "model",
                parts: [
                    {
                        text: "Okay, I understand. I will use the history to inform my response to the user's latest message."
                    }
                ]
            });

            if (contextMessages.length > 0) {
                history.push({
                    role: "user",
                    parts: [{ text: "Here is some relevant conversation history (newest first):\n" }]
                });
                let historyText = "";
                for (const msg of contextMessages.sort(
                    (a, b): number => a.timestamp.getTime() - b.timestamp.getTime()
                )) {
                    const prefix = msg.contentType === "user_message" ? "User" : "Bot";
                    historyText += `${prefix}: ${msg.originalText}\n`;
                }

                history.push({
                    role: "model",
                    parts: [{ text: `Okay, I see the following history:\n${historyText}` }]
                });
            } else {
                history.push({
                    role: "user",
                    parts: [{ text: "There is no relevant conversation history available for this query." }]
                });
                history.push({
                    role: "model",
                    parts: [{ text: "Understood, I will respond based solely on the user's current message." }]
                });
            }

            history.push({
                role: "user",
                parts: [{ text: `Now, please respond to this message from the user:\nUser: ${userQuery}` }]
            });

            const botResponseText = await generateText(history);

            if (botResponseText) {
                // Handle Discord message length limit (2000 chars)
                const chunks = this.splitMessage(botResponseText, 1990);
                let sentMessage: Message | null = null;
                for (const chunk of chunks) {
                    sentMessage = await message.reply(chunk); // Reply to the user's message
                }

                if (sentMessage) {
                    addMessageToVectorDb(sentMessage.id, botResponseText, {
                        userId: this.container.client.user!.id,
                        channelId,
                        guildId,
                        timestamp: sentMessage.createdTimestamp,
                        contentType: "bot_response",
                        originalText: botResponseText
                    }).catch((err) => console.error("Failed to store bot response in background:", err));
                }
            } else {
                message.reply("Sorry, I couldn't generate a response.");
            }
        } catch (error) {
            this.container.logger.error("Error storing user message:", error);
        }
    }
}
