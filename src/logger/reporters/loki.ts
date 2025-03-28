import type { ConsolaReporter, LogObject } from "consola";
import { $fetch } from "ofetch";

const LogLevel = {
    0: "error",
    1: "warn",
    2: "log",
    3: "info",
    4: "debug",
    5: "trace"
} as const;

export interface LokiReporterOptions {
    baseURL: string;
    interval?: number;
    user?: string;
    password?: string;
    labels?: Record<string, string>;
    mode?: "stream" | "batch";
    batchSize?: number;
    batchTimeout?: number;
    maxQueueSize?: number;
    healthCheckInterval?: number;
    compression?: boolean;
}

interface LokiLogEntry {
    timestamp: string;
    message: string;
    level: string;
}

export class LokiReporter implements ConsolaReporter {
    private options: LokiReporterOptions;
    private queue: LokiLogEntry[] = [];
    private timer: NodeJS.Timer | null = null;
    private abortController = new AbortController();
    private isLokiReachable = false;

    constructor(lokiOptions: LokiReporterOptions) {
        this.options = {
            mode: "stream",
            batchSize: 100,
            batchTimeout: 5000,
            maxQueueSize: 5000,
            healthCheckInterval: 30000,
            compression: true,
            ...lokiOptions
        };

        if (this.options.mode === "batch") {
            this.startBatchProcessing();
        }

        this.startHealthCheck();
    }

    private getHeaders(): HeadersInit {
        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (this.options.user && this.options.password) {
            headers.Authorization = `Basic ${Buffer.from(`${this.options.user}:${this.options.password}`).toString("base64")}`;
        }
        return headers;
    }

    private async checkLokiHealth(): Promise<void> {
        try {
            await $fetch(`${this.options.baseURL}/ready`, { method: "GET", signal: this.abortController.signal });
            this.isLokiReachable = true;
        } catch (err) {
            console.error("Loki health check failed:", err);
            this.isLokiReachable = false;
        }
    }

    private startHealthCheck(): void {
        this.checkLokiHealth();
        setInterval((): Promise<void> => this.checkLokiHealth(), this.options.healthCheckInterval);
    }

    private startBatchProcessing(): void {
        if (this.timer) {
            clearInterval(this.timer);
        }

        this.timer = setInterval(() => {
            this.flushQueue();
        }, this.options.batchTimeout);
    }

    private async flushQueue(): Promise<void> {
        if (this.queue.length === 0 || !this.isLokiReachable) {
            return;
        }

        const streamMap = new Map<string, { stream: unknown; values: string[][] }>();

        for (const entry of this.queue) {
            const streamKey = entry.level;
            if (!streamMap.has(streamKey)) {
                streamMap.set(streamKey, {
                    stream: {
                        level: entry.level,
                        ...this.options.labels
                    },
                    values: []
                });
            }

            streamMap.get(streamKey)?.values.push([entry.timestamp.toString(), entry.message]);
        }

        try {
            await $fetch("/loki/api/v1/push", {
                baseURL: this.options.baseURL,
                method: "POST",
                headers: {
                    ...this.getHeaders(),
                    ...(this.options.compression ? { "Content-Encoding": "gzip" } : {})
                },
                body: {
                    streams: Array.from(streamMap.values())
                },
                signal: this.abortController.signal
            });

            this.queue = [];
        } catch (err) {
            console.error("Loki batch push error:", err);
            if (this.queue.length > this.options.maxQueueSize!) {
                this.queue = this.queue.slice(-this.options.maxQueueSize!);
            }
        }
    }

    private getNanosecondTimestamp(): string {
        const hrTime = process.hrtime();
        return `${hrTime[0] * 1e9 + hrTime[1]}`;
    }

    public async log(logObj: LogObject) {
        if (!this.isLokiReachable) {
            return;
        }

        const level = LogLevel[logObj.level as keyof typeof LogLevel];
        const timestamp: string = (logObj.date.getTime() * 1000 * 1000).toString();
        const message: string = logObj.args.join(" ");

        if (this.options.mode === "batch") {
            if (this.queue.length >= this.options.maxQueueSize!) {
                console.warn("LokiReporter queue overflow, dropping old logs.");
                this.queue.shift();
            }

            this.queue.push({ timestamp, message, level });

            if (this.queue.length >= this.options.batchSize!) {
                this.flushQueue();
            }

            return;
        }

        setImmediate(async (): Promise<void> => {
            try {
                await $fetch("/loki/api/v1/push", {
                    baseURL: this.options.baseURL,
                    method: "POST",
                    headers: this.getHeaders(),
                    body: {
                        streams: [
                            {
                                stream: {
                                    level,
                                    ...(this.options.labels || {})
                                },
                                values: [[timestamp, message]]
                            }
                        ]
                    },
                    signal: this.abortController.signal,
                    retry: 3,
                    retryDelay: 1000,
                    retryStatusCodes: [400, 500, 502, 503, 504]
                });
            } catch (err) {
                console.error(err);
            }
        });
    }

    public dispose(): void {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }

        if (this.queue.length > 0) {
            this.flushQueue().catch((err: unknown): void => console.error("Error flushing logs during disposal:", err));
        }

        this.abortController.abort();
        this.queue = [];
    }
}
