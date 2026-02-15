/**
 * Modular Logging Utility
 * Sanket
 */

const IS_DEV = __DEV__;

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private log(level: LogLevel, message: string, data?: any, ...args: any[]) {
    if (!IS_DEV && level === 'debug') return;

    const timestamp = new Date().toISOString();
    const prefix = `[${level.toUpperCase()}] [${timestamp}]`;

    switch (level) {
      case 'info':
        console.log(prefix, message, data || '', ...args);
        break;
      case 'warn':
        console.warn(prefix, message, data || '', ...args);
        break;
      case 'error':
        console.error(prefix, message, data || '', ...args);
        // Here you would integrate with Sentry or Crashlytics in production
        // if (IS_DEV) { ... } else { Sentry.captureException(data); }
        break;
      case 'debug':
        if (IS_DEV) {
          console.debug(prefix, message, data || '', ...args);
        }
        break;
    }
  }

  info(message: string, data?: any, ...args: any[]) {
    this.log('info', message, data, ...args);
  }

  warn(message: string, data?: any, ...args: any[]) {
    this.log('warn', message, data, ...args);
  }

  error(message: string, data?: any, ...args: any[]) {
    this.log('error', message, data, ...args);
  }

  debug(message: string, data?: any, ...args: any[]) {
    this.log('debug', message, data, ...args);
  }
}

export const logger = new Logger();
