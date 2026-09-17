// Logger.ts
import { LogLevel } from './log-level';

// 1. The Product (Base Class / Abstraction)
export abstract class Logger {
    constructor(protected minLevel: LogLevel) {}

    // The core method all loggers must implement
    abstract log(level: LogLevel, message: string): void;

    // Shared helper logic
    protected shouldLog(level: LogLevel): boolean {
        const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
        return levels.indexOf(level) >= levels.indexOf(this.minLevel);
    }
}

// 2. Concrete Product A
export class ConsoleLogger extends Logger {
    log(level: LogLevel, message: string): void {
        if (this.shouldLog(level)) {
            console.log(`[CONSOLE] [${level}] ${message}`);
        }
    }
}

// 3. Concrete Product B
export class FileLogger extends Logger {
    log(level: LogLevel, message: string): void {
        if (this.shouldLog(level)) {
            // Imagine writing to a file system here
            console.log(`[FILE] [${level}] ${message}`); 
        }
    }
}