export enum LogLevel {
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
    SUCCESS = 'SUCCESS'
}

export interface LoggerOptions {
    showTimestamp?: boolean;
    useColors?: boolean;
}

export class Logger {
    private options: LoggerOptions;

    private colors = {
        reset: '\x1b[0m',
        info: '\x1b[36m',
        warn: '\x1b[33m',
        error: '\x1b[31m',
        success: '\x1b[32m',
        dim: '\x1b[2m'
    };

    constructor(options?: LoggerOptions) {
        this.options = {
            showTimestamp: true,
            useColors: true,
            ...options
        };
    }

    private getTimestamp(): string {
        if (!this.options.showTimestamp) return '';
        const now = new Date();
        return `[${now.toISOString()}] `;
    }

    private formatMessage(level: LogLevel, message: string): string {
        const timestamp = this.getTimestamp();
        let color = '';
        let prefix = `[${level}]`;

        if (this.options.useColors) {
            switch (level) {
                case LogLevel.INFO: color = this.colors.info; break;
                case LogLevel.WARN: color = this.colors.warn; break;
                case LogLevel.ERROR: color = this.colors.error; break;
                case LogLevel.SUCCESS: color = this.colors.success; break;
            }
            const dimTimestamp = `${this.colors.dim}${timestamp}${this.colors.reset}`;
            return `${dimTimestamp}${color}${prefix}${this.colors.reset} ${message}`;
        }

        return `${timestamp}${prefix} ${message}`;
    }

    public info(message: string): void {
        console.log(this.formatMessage(LogLevel.INFO, message));
    }

    public warn(message: string): void {
        console.warn(this.formatMessage(LogLevel.WARN, message));
    }

    public error(message: string): void {
        console.error(this.formatMessage(LogLevel.ERROR, message));
    }

    public success(message: string): void {
        console.log(this.formatMessage(LogLevel.SUCCESS, message));
    }
}
