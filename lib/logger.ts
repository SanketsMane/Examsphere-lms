/**
 * KIDOKOOL Centralized Logger
 * Provides structured logging for errors, security events, and audit trails.
 * @author Sanket
 */

type LogLevel = 'info' | 'warn' | 'error' | 'security';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: any;
  timestamp: string;
  userId?: string;
}

class Logger {
  private format(level: LogLevel, message: string, context?: any, userId?: string): LogEntry {
    return {
      level,
      message,
      context,
      userId,
      timestamp: new Date().toISOString(),
    };
  }

  private persist(entry: LogEntry) {
    // In production, this would send to a service like Axiom, Datadog, or Sentry.
    // For now, we use structured console logs that PM2/CloudWatch can parse.
    const output = JSON.stringify(entry);
    
    switch (entry.level) {
      case 'error':
        console.error(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'security':
        console.warn(`[SECURITY] ${output}`);
        break;
      default:
        console.log(output);
    }
  }

  info(message: string, context?: any, userId?: string) {
    this.persist(this.format('info', message, context, userId));
  }

  warn(message: string, context?: any, userId?: string) {
    this.persist(this.format('warn', message, context, userId));
  }

  error(message: string, context?: any, userId?: string) {
    let finalContext = context;
    if (context instanceof Error) {
      finalContext = {
        name: context.name,
        message: context.message,
        stack: context.stack,
      };
    } else if (context && typeof context === 'object' && context.error instanceof Error) {
        finalContext = {
            ...context,
            error: {
                name: context.error.name,
                message: context.error.message,
                stack: context.error.stack,
            }
        };
    }
    
    this.persist(this.format('error', message, finalContext, userId));
  }

  security(message: string, context?: any, userId?: string) {
    this.persist(this.format('security', message, context, userId));
  }
}

export const logger = new Logger();
