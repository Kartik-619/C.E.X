// LoggerFactory.ts
import { Logger, ConsoleLogger, FileLogger } from './logger';
import { LogLevel } from './log-level';

export type LoggerType = 'console' | 'file';

export class LoggerFactory {
    
    // The Factory Method
    public static createLogger(type: LoggerType, minLevel: LogLevel): Logger {
        // Encapsulated creation logic
        switch (type) {
            case 'console':
                return new ConsoleLogger(minLevel);
            case 'file':
                return new FileLogger(minLevel);
            default:
                throw new Error(`Logger type '${type}' is not supported.`);
        }
    }
}