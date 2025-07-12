import fs from 'fs-extra';
import path from 'path';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class Logger {
  private logDir: string;

  constructor(logDir?: string) {
    this.logDir = logDir || path.join(process.cwd(), 'logs');
    this.ensureLogDirectory();
  }

  private ensureLogDirectory() {
    try {
      fs.ensureDirSync(this.logDir);
    } catch (error) {
      console.warn('Could not create log directory:', error);
    }
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${dataStr}`;
  }

  private writeToFile(filename: string, message: string) {
    try {
      const filePath = path.join(this.logDir, filename);
      fs.appendFileSync(filePath, message + '\n');
    } catch (error) {
      console.warn('Could not write to log file:', error);
    }
  }

  debug(message: string, data?: any) {
    const formattedMessage = this.formatMessage('debug', message, data);
    console.log('\x1b[36m%s\x1b[0m', formattedMessage); // Cyan
    this.writeToFile('debug.log', formattedMessage);
  }

  info(message: string, data?: any) {
    const formattedMessage = this.formatMessage('info', message, data);
    console.log(formattedMessage);
    this.writeToFile('info.log', formattedMessage);
  }

  warn(message: string, data?: any) {
    const formattedMessage = this.formatMessage('warn', message, data);
    console.warn('\x1b[33m%s\x1b[0m', formattedMessage); // Yellow
    this.writeToFile('warn.log', formattedMessage);
  }

  error(message: string, data?: any) {
    const formattedMessage = this.formatMessage('error', message, data);
    console.error('\x1b[31m%s\x1b[0m', formattedMessage); // Red
    this.writeToFile('error.log', formattedMessage);
  }

  thought(message: string) {
    const formattedMessage = this.formatMessage('info', `[THOUGHT] ${message}`);
    console.log('\x1b[35m%s\x1b[0m', formattedMessage); // Magenta
    this.writeToFile('thoughts.log', formattedMessage);
  }
}

// Export a default logger instance
export const logger = new Logger();

export default logger;
