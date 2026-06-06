import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { Logger, LogLevel } from './index';

describe('ts-logger-pro Logger', () => {
    let consoleLogMock: any;
    let consoleErrorMock: any;
    const testLogFile = path.join(__dirname, 'test-output.log');

    beforeEach(() => {
        consoleLogMock = vi.spyOn(console, 'log').mockImplementation(() => {});
        consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
        if (fs.existsSync(testLogFile)) {
            try {
                fs.unlinkSync(testLogFile);
            } catch (err) {}
        }
        // Clean up rotated test files
        const files = fs.readdirSync(__dirname);
        for (const file of files) {
            if (file.startsWith('test-output.') && file.endsWith('.log')) {
                try {
                    fs.unlinkSync(path.join(__dirname, file));
                } catch (err) {}
            }
        }
    });

    it('should initialize with default options', () => {
        const logger = new Logger();
        expect(logger.getActiveLevel()).toBe(LogLevel.INFO);
        expect(logger.getFileTransportsCount()).toBe(0);
    });

    it('should filter messages below minimum log level', () => {
        const logger = new Logger({ level: LogLevel.WARN });
        
        logger.info('this should be filtered');
        expect(consoleLogMock).not.toHaveBeenCalled();

        logger.warn('this should not be filtered');
        expect(consoleLogMock).toHaveBeenCalled();
    });

    it('should support JSON formatting for console logs', () => {
        const logger = new Logger({ 
            level: LogLevel.DEBUG, 
            format: 'json',
            showTimestamp: false
        });

        logger.debug('json test message', { userId: 99 });
        
        expect(consoleLogMock).toHaveBeenCalled();
        const output = consoleLogMock.mock.calls[0][0];
        const parsed = JSON.parse(output);
        
        expect(parsed.level).toBe('DEBUG');
        expect(parsed.message).toBe('json test message');
        expect(parsed.meta).toEqual({ userId: 99 });
        expect(parsed.timestamp).toBeDefined();
    });

    it('should route errors and fatals to console.error', () => {
        const logger = new Logger({ level: LogLevel.INFO });
        
        logger.error('error message');
        expect(consoleErrorMock).toHaveBeenCalled();

        logger.fatal('fatal error message');
        expect(consoleErrorMock).toHaveBeenCalledTimes(2);
    });

    it('should write logs to a file transport', () => {
        const logger = new Logger({
            level: LogLevel.INFO,
            fileTransports: [{ filename: testLogFile }]
        });

        logger.info('file logging message', { active: true });

        expect(fs.existsSync(testLogFile)).toBe(true);
        const fileContent = fs.readFileSync(testLogFile, 'utf8');
        expect(fileContent).toContain('INFO');
        expect(fileContent).toContain('file logging message');
        expect(fileContent).toContain('"active":true');
    });

    it('should rotate file when size threshold is reached', () => {
        const maxSizeBytes = 50; // Very small size limit
        const logger = new Logger({
            level: LogLevel.INFO,
            fileTransports: [{ 
                filename: testLogFile,
                maxSizeBytes
            }]
        });

        // Write initial log
        logger.info('First log message that takes some space');
        expect(fs.existsSync(testLogFile)).toBe(true);
        
        // Write second log, which should trigger rotation
        logger.info('Second log message that forces file overflow rotation');
        
        // Ensure rotation happened: old file moved, new file created
        const dirFiles = fs.readdirSync(__dirname);
        const rotatedFiles = dirFiles.filter(f => f.startsWith('test-output.') && f !== 'test-output.log');
        
        expect(rotatedFiles.length).toBeGreaterThan(0);
        expect(fs.existsSync(testLogFile)).toBe(true); // new active log file exists
    });
});
