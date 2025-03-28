import type { LogType } from "consola";
import type { ColorName } from "consola/utils";

export const TEXT_TYPES: string[] = [
    "error",
    "warn",
    "info",
    "success",
    "debug",
    "trace",
    "start",
    "log",
    "silent",
    "ready",
    "box",
    "verbose"
];

export const TYPE_PREFIX: { [k in LogType]?: string } = {
    error: "ERROR",
    fatal: "FATAL",
    ready: "READY",
    warn: "WARN",
    info: "INFO",
    success: "SUCCESS",
    debug: "DEBUG",
    trace: "TRACE",
    fail: "FAIL",
    start: "START",
    log: "",
    verbose: "VERBOSE"
};

export const TYPE_COLOR_MAP: { [k in LogType]?: ColorName } = {
    error: "red",
    fatal: "bgRed",
    ready: "green",
    warn: "yellow",
    info: "blue",
    success: "magenta",
    debug: "cyan",
    trace: "gray",
    fail: "red",
    start: "blue",
    log: "white",
    verbose: "gray"
};

export const MESSAGE_COLOR_MAP: { [k in LogType]?: ColorName } = {
    error: "red",
    fatal: "red",
    ready: "green",
    warn: "yellow",
    info: "blue",
    success: "green",
    debug: "cyan",
    trace: "gray",
    fail: "red",
    start: "blue",
    log: "gray",
    verbose: "gray"
};
