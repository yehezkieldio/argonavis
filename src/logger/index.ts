import { inspect } from "node:util";
import { Logger as BuiltinLogger, LogLevel } from "@sapphire/framework";
import { type ConsolaInstance, createConsola, LogLevels, type LogType } from "consola";
import { DefaultReporter, type DefaultReporterOptions } from "#/logger/reporters/default";
import { LokiReporter, type LokiReporterOptions } from "#/logger/reporters/loki";

interface ArgoNavisLoggerReporterOptions {
    default: DefaultReporterOptions;
    loki?: LokiReporterOptions;
}

export interface ArgoNavisLoggerOptions {
    minLevel?: LogLevel;
    reporters?: ArgoNavisLoggerReporterOptions;
}

export class ArgoNavisLogger extends BuiltinLogger {
    public readonly consola: ConsolaInstance;
    private lokiReporter?: LokiReporter;

    private getConsolaNumericLevel(level: LogLevel): number {
        if (level >= LogLevel.Fatal) return LogLevels.fatal;
        if (level >= LogLevel.Error) return LogLevels.error;
        if (level >= LogLevel.Warn) return LogLevels.warn;
        if (level >= LogLevel.Info) return LogLevels.info;
        if (level >= LogLevel.Debug) return LogLevels.debug;
        if (level >= LogLevel.Trace) return LogLevels.trace;
        return LogLevels.silent;
    }

    mapSapphireToConsolaLevel(level: LogLevel): LogType {
        if (level >= LogLevel.Fatal) return "fatal";
        if (level >= LogLevel.Error) return "error";
        if (level >= LogLevel.Warn) return "warn";
        if (level >= LogLevel.Info) return "info";
        if (level >= LogLevel.Debug) return "debug";
        if (level >= LogLevel.Trace) return "trace";
        return "silent";
    }

    constructor(options: ArgoNavisLoggerOptions) {
        super(options.minLevel ?? LogLevel.Info);
        this.consola = createConsola({
            level: this.getConsolaNumericLevel(this.level)
        }).setReporters([]);

        if (options.reporters?.loki?.baseURL !== "") {
            this.lokiReporter = new LokiReporter(options.reporters?.loki as LokiReporterOptions);
            this.consola.addReporter(this.lokiReporter);
        }

        this.consola.addReporter(
            new DefaultReporter({
                ...options.reporters?.default
            })
        );
    }

    public override write(level: LogLevel, ...values: readonly unknown[]): void {
        if (level < this.level) return;

        const consolaMethod: LogType = this.mapSapphireToConsolaLevel(level) ?? "log";

        if (typeof this.consola[consolaMethod] === "function") {
            const message: string = values
                .map((value: unknown): string => (typeof value === "string" ? value : inspect(value, { depth: 0 })))
                .join(" ");

            this.consola[consolaMethod](message);
        }
    }

    public dispose(): void {
        this.lokiReporter?.dispose();
    }
}
