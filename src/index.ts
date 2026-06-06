import * as fs from 'fs';
import * as path from 'path';

export enum LogLevel {
    VERBOSE = 0,
    DEBUG = 1,
    INFO = 2,
    WARN = 3,
    ERROR = 4,
    FATAL = 5
}

export type LogFormat = 'pretty' | 'json';

export interface FileTransportOptions {
    filename: string;
    level?: LogLevel;
    maxSizeBytes?: number; // Enable simple file rotation
}

export interface LoggerOptions {
    level?: LogLevel;
    format?: LogFormat;
    showTimestamp?: boolean;
    useColors?: boolean;
    filePath?: string; // Legacy simple option
    fileTransports?: FileTransportOptions[];
}

export interface LogEntry {
    timestamp: string;
    level: string;
    message: string;
    meta?: Record<string, any>;
}

export class Logger {
    private level: LogLevel;
    private format: LogFormat;
    private showTimestamp: boolean;
    private useColors: boolean;
    private fileTransports: FileTransportOptions[] = [];

    private colors = {
        reset: '\x1b[0m',
        verbose: '\x1b[35m', // Magenta
        debug: '\x1b[34m',   // Blue
        info: '\x1b[36m',    // Cyan
        warn: '\x1b[33m',    // Yellow
        error: '\x1b[31m',   // Red
        fatal: '\x1b[35;1m', // Bold Magenta/Red
        dim: '\x1b[2m'       // Dark timestamp
    };

    private levelLabels: Record<LogLevel, string> = {
        [LogLevel.VERBOSE]: 'VERBOSE',
        [LogLevel.DEBUG]: 'DEBUG',
        [LogLevel.INFO]: 'INFO',
        [LogLevel.WARN]: 'WARN',
        [LogLevel.ERROR]: 'ERROR',
        [LogLevel.FATAL]: 'FATAL'
    };

    private levelIcons: Record<LogLevel, string> = {
        [LogLevel.VERBOSE]: '🔍',
        [LogLevel.DEBUG]: '⚙️',
        [LogLevel.INFO]: 'ℹ️',
        [LogLevel.WARN]: '⚠️',
        [LogLevel.ERROR]: '❌',
        [LogLevel.FATAL]: '🔥'
    };

    constructor(options?: LoggerOptions) {
        this.level = options?.level ?? LogLevel.INFO;
        this.format = options?.format ?? 'pretty';
        this.showTimestamp = options?.showTimestamp ?? true;
        this.useColors = options?.useColors ?? true;

        if (options?.filePath) {
            this.fileTransports.push({
                filename: options.filePath,
                level: this.level
            });
        }

        if (options?.fileTransports) {
            this.fileTransports.push(...options.fileTransports);
        }
    }

    private getTimestamp(): string {
        return new Date().toISOString();
    }

    private formatPretty(level: LogLevel, message: string, meta?: Record<string, any>): string {
        const timestamp = this.showTimestamp ? `${this.colors.dim}[${this.getTimestamp()}]${this.colors.reset} ` : '';
        const levelLabel = this.levelLabels[level];
        const icon = this.levelIcons[level];
        
        let color = '';
        if (this.useColors) {
            switch (level) {
                case LogLevel.VERBOSE: color = this.colors.verbose; break;
                case LogLevel.DEBUG: color = this.colors.debug; break;
                case LogLevel.INFO: color = this.colors.info; break;
                case LogLevel.WARN: color = this.colors.warn; break;
                case LogLevel.ERROR: color = this.colors.error; break;
                case LogLevel.FATAL: color = this.colors.fatal; break;
            }
        }

        const colorizedLabel = this.useColors ? `${color}${levelLabel}${this.colors.reset}` : levelLabel;
        let formatted = `${timestamp}${icon} [${colorizedLabel}] ${message}`;

        if (meta && Object.keys(meta).length > 0) {
            formatted += ` ${this.colors.dim}${JSON.stringify(meta)}${this.colors.reset}`;
        }

        return formatted;
    }

    private formatJSON(level: LogLevel, message: string, meta?: Record<string, any>): string {
        const entry: LogEntry = {
            timestamp: this.getTimestamp(),
            level: this.levelLabels[level],
            message
        };

        if (meta && Object.keys(meta).length > 0) {
            entry.meta = meta;
        }

        return JSON.stringify(entry);
    }

    private writeToFile(transport: FileTransportOptions, level: LogLevel, message: string, meta?: Record<string, any>) {
        const transportLevel = transport.level ?? LogLevel.INFO;
        if (level < transportLevel) return;

        // Structured JSON for files, clean formatting for standard plain text output depending on format config
        const logContent = this.format === 'json' 
            ? this.formatJSON(level, message, meta)
            : `[${this.getTimestamp()}] [${this.levelLabels[level]}] ${message}${meta ? ' ' + JSON.stringify(meta) : ''}`;

        try {
            // Check rotation
            if (transport.maxSizeBytes && fs.existsSync(transport.filename)) {
                const stats = fs.statSync(transport.filename);
                if (stats.size >= transport.maxSizeBytes) {
                    this.rotateLogFile(transport.filename);
                }
            }

            // Create parent directories if they don't exist
            const dir = path.dirname(transport.filename);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            fs.appendFileSync(transport.filename, logContent + '\n', 'utf8');
        } catch (err) {
            console.error(`Failed to write log to file ${transport.filename}:`, err);
        }
    }

    private rotateLogFile(filename: string) {
        const extension = path.extname(filename);
        const basename = path.basename(filename, extension);
        const dirname = path.dirname(filename);
        
        // Find a safe rotation index or append a timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const rotatedName = path.join(dirname, `${basename}.${timestamp}${extension}`);
        
        try {
            fs.renameSync(filename, rotatedName);
        } catch (err) {
            console.error(`Failed to rotate log file ${filename} to ${rotatedName}:`, err);
        }
    }

    private log(level: LogLevel, message: string, meta?: Record<string, any>) {
        // Console filter
        if (level >= this.level) {
            const formatted = this.format === 'json'
                ? this.formatJSON(level, message, meta)
                : this.formatPretty(level, message, meta);

            if (level >= LogLevel.ERROR) {
                console.error(formatted);
            } else {
                console.log(formatted);
            }
        }

        // File logging
        for (const transport of this.fileTransports) {
            this.writeToFile(transport, level, message, meta);
        }
    }

    public verbose(message: string, meta?: Record<string, any>): void {
        this.log(LogLevel.VERBOSE, message, meta);
    }

    public debug(message: string, meta?: Record<string, any>): void {
        this.log(LogLevel.DEBUG, message, meta);
    }

    public info(message: string, meta?: Record<string, any>): void {
        this.log(LogLevel.INFO, message, meta);
    }

    public warn(message: string, meta?: Record<string, any>): void {
        this.log(LogLevel.WARN, message, meta);
    }

    public error(message: string, meta?: Record<string, any>): void {
        this.log(LogLevel.ERROR, message, meta);
    }

    public fatal(message: string, meta?: Record<string, any>): void {
        this.log(LogLevel.FATAL, message, meta);
    }

    public getActiveLevel(): LogLevel {
        return this.level;
    }

    public getFileTransportsCount(): number {
        return this.fileTransports.length;
    }
}
