import winston from "winston";
import path from "path";
import "winston-daily-rotate-file";
import { config } from "@/config";
// Removed incorrect Transports import

const { combine, timestamp, json, colorize, printf, errors, align } = winston.format;

/**
 * CLoggerManager Singleton
 * Configured for both Node.js (VPS/Docker) and Serverless (Vercel/Lambda)
 */
class CLoggerManager {
    private static instance: winston.Logger | null = null;

    private constructor() { }

    public static getInstance(): winston.Logger {
        if (!CLoggerManager.instance) {
            const isDev = process.env.NODE_ENV !== "production";
            const isServerless = process.env.VERCEL === "1" || !!process.env.LAMBDA_TASK_ROOT;

            // 1. Custom CLI Format for readable development logs
            const cliFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
                const metaString = Object.keys(meta).length
                    ? `\n${JSON.stringify(meta, null, 2)}`
                    : "";
                return `${timestamp} [${level}]: ${stack || message}${metaString}`;
            });

            // 2. Transports Setup
            const transports: winston.transport[] = [
                new winston.transports.Console({
                    format: isDev
                        ? combine(
                            colorize(),
                            timestamp({ format: "YYYY-MM-DD hh:mm:ss.SSS A" }),
                            errors({ stack: true }),
                            align(),
                            cliFormat
                        )
                        : combine(timestamp(), errors({ stack: true }), json()),
                }),
            ];

            // 3. Persistent File Logging (Disabled in Serverless)
            if (!isServerless) {
                const logDirectory = path.join(process.cwd(), "logs");

                // Daily Rotation for general application logs
                transports.push(
                    new winston.transports.DailyRotateFile({
                        filename: path.join(logDirectory, "app-%DATE%.log"),
                        datePattern: "YYYY-MM-DD",
                        zippedArchive: true,
                        maxSize: "20m",
                        maxFiles: "14d",
                        format: combine(timestamp(), errors({ stack: true }), json()),
                    })
                );

                // Dedicated error log file
                transports.push(
                    new winston.transports.DailyRotateFile({
                        level: "error",
                        filename: path.join(logDirectory, "error-%DATE%.log"),
                        datePattern: "YYYY-MM-DD",
                        zippedArchive: true,
                        maxFiles: "30d",
                        format: combine(timestamp(), errors({ stack: true }), json()),
                    })
                );
            }

            CLoggerManager.instance = winston.createLogger({
                level: isDev ? "debug" : "info",
                defaultMeta: {
                    service: config.TITLE || "yudees-atelier",
                    platform: isServerless ? "serverless" : "node",
                },
                transports,
                exitOnError: false, // Don't crash on handled exceptions
            });
        }
        return CLoggerManager.instance;
    }
}

/**
 * Standardized CLogger export
 */
export const CLogger = CLoggerManager.getInstance();

/**
 * pprint: Pretty prints JSON for well-formatted reading in the CLI.
 * Per 2026-02-24 instruction: For JSON responses, use pprint.
 */
export const pprint = (data: any) => {
    if (process.env.NODE_ENV !== "production") {
        const separator = "─".repeat(60);
        console.log(`\x1b[38;5;208m${separator}\x1b[0m`); // Orange separator
        console.log(`\x1b[1m\x1b[32m[JSON PPRINT]\x1b[0m`, new Date().toLocaleTimeString());

        // Use console.dir for deep object inspection with syntax highlighting
        console.dir(data, { depth: null, colors: true });

        console.log(`\x1b[38;5;208m${separator}\x1b[0m`);
    } else {
        // In production, route via Winston for structured logging
        CLogger.info("JSON Data Log", { data });
    }
};