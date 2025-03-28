import { LogLevel, type SapphireClientOptions } from "@sapphire/framework";
import { Time } from "@sapphire/time-utilities";
import { ActivityType, type ClientOptions, GatewayIntentBits, Partials } from "discord.js";
import { env } from "#/env";
import { ArgoNavisLogger } from "#/logger";

export const DEVELOPERS: string[] = ["327849142774923266"];
export const DEVELOPMENT_SERVERS: string[] = ["1209737959587450980"];

interface ArgoNavisClientOptions extends SapphireClientOptions, ClientOptions {}

export const configuration: ArgoNavisClientOptions = {
    allowedMentions: {
        parse: [],
        users: [],
        roles: [],
        repliedUser: true
    },
    defaultCooldown: {
        delay: Time.Second * 2,
        filteredUsers: DEVELOPERS
    },
    defaultPrefix: env.DEFAULT_PREFIX,
    intents: [
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages
    ],
    loadApplicationCommandRegistriesStatusListeners: env.NODE_ENV === "development",
    loadDefaultErrorListeners: env.NODE_ENV === "development",
    loadMessageCommandListeners: true,
    logger: {
        instance: new ArgoNavisLogger({
            minLevel: env.NODE_ENV === "development" ? LogLevel.Debug : LogLevel.Info,
            reporters: {
                default: {
                    addTypeColon: false,
                    dateFirstPosition: false,
                    padding: 8
                },
                loki: {
                    mode: "stream",
                    baseURL: env.LOKI_URL ?? "",
                    labels: {
                        app: `winter-${env.NODE_ENV}`,
                        env: env.NODE_ENV
                    }
                }
            }
        }),
        level: env.NODE_ENV === "development" ? LogLevel.Debug : LogLevel.Info
    },
    partials: [Partials.Message, Partials.User, Partials.GuildMember],
    presence: {
        activities: [
            {
                type: ActivityType.Listening,
                name: "to the stars ✨"
            }
        ],
        status: "dnd"
    },
    typing: true
};
