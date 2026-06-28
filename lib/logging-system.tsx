// Advanced Error Tracking and Logging System for EXAMSPHERE
import React from 'react';
import { writeFile, mkdir, appendFile } from 'fs/promises';
import path from 'path';

interface LogEntry {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  message: string;
  context?: Record<string, any>;
  stack?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  url?: string;
  userAgent?: string;
  ip?: string;
}

interface ErrorMetrics {
  count: number;
  lastOccurrence: Date;
  firstOccurrence: Date;
  affectedUsers: Set<string>;
  contexts: Record<string, any>[];
}

export class Logger {
  private static instance: Logger;
  private logBuffer: LogEntry[] = [];
  private errorMetrics = new Map<string, ErrorMetrics>();
  private readonly logDir: string;
  private readonly maxBufferSize = 100;
  private readonly flushInterval = 30000; // 30 seconds

  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.ensureLogDirectory();
    this.startPeriodicFlush();
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private async ensureLogDirectory(): Promise<void> {
    try {
      await mkdir(this.logDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }

  private startPeriodicFlush(): void {
    setInterval(async () => {
      await this.flushLogs();
    }, this.flushInterval);

    // Flush on process exit
    process.on('SIGINT', async () => {
      await this.flushLogs();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.flushLogs();
      process.exit(0);
    });
  }

  // Core logging methods
  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    const logContext = {
      ...context,
      stack: error?.stack,
      errorName: error?.name,
      errorMessage: error?.message
    };

    this.log('error', message, logContext);
    
    // Track error metrics
    if (error) {
      this.trackError(error, context);
    }
  }

  critical(message: string, error?: Error, context?: Record<string, any>): void {
    const logContext = {
      ...context,
      stack: error?.stack,
      errorName: error?.name,
      errorMessage: error?.message
    };

    this.log('critical', message, logContext);
    
    if (error) {
      this.trackError(error, context);
    }

    // Send critical alerts (implement notification system)
    this.sendCriticalAlert(message, error, context);
  }

  private log(level: LogEntry['level'], message: string, context?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      requestId: this.getCurrentRequestId(),
      userId: this.getCurrentUserId(),
      sessionId: this.getCurrentSessionId(),
      url: this.getCurrentUrl(),
      userAgent: this.getCurrentUserAgent(),
      ip: this.getCurrentIP()
    };

    this.logBuffer.push(entry);

    // Console output for development
    if (process.env.NODE_ENV === 'development') {
      this.consoleOutput(entry);
    }

    // Flush if buffer is full
    if (this.logBuffer.length >= this.maxBufferSize) {
      this.flushLogs();
    }
  }

  private consoleOutput(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase().padEnd(8);
    const message = entry.message;
    
    let output = `[${timestamp}] ${level} ${message}`;
    
    if (entry.context && Object.keys(entry.context).length > 0) {
      output += `\n  Context: ${JSON.stringify(entry.context, null, 2)}`;
    }

    switch (entry.level) {
      case 'debug':
        console.debug(output);
        break;
      case 'info':
        console.info(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'error':
      case 'critical':
        console.error(output);
        break;
    }
  }

  private async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];

    try {
      // Group logs by date for daily log files
      const logsByDate = new Map<string, LogEntry[]>();
      
      for (const log of logsToFlush) {
        const dateKey = log.timestamp.toISOString().split('T')[0];
        if (!logsByDate.has(dateKey)) {
          logsByDate.set(dateKey, []);
        }
        logsByDate.get(dateKey)!.push(log);
      }

      // Write to separate files by date and level
      for (const [date, logs] of logsByDate) {
        await this.writeLogsToFile(date, logs);
      }

    } catch (error) {
      console.error('Failed to flush logs:', error);
      // Put logs back in buffer if write failed
      this.logBuffer.unshift(...logsToFlush);
    }
  }

  private async writeLogsToFile(date: string, logs: LogEntry[]): Promise<void> {
    const logsByLevel = new Map<string, LogEntry[]>();
    
    // Group by level
    for (const log of logs) {
      if (!logsByLevel.has(log.level)) {
        logsByLevel.set(log.level, []);
      }
      logsByLevel.get(log.level)!.push(log);
    }

    // Write each level to its own file
    for (const [level, levelLogs] of logsByLevel) {
      const filename = `${date}-${level}.log`;
      const filepath = path.join(this.logDir, filename);
      
      const logLines = levelLogs.map(log => JSON.stringify(log)).join('\n') + '\n';
      
      try {
        await appendFile(filepath, logLines, 'utf8');
      } catch (error) {
        console.error(`Failed to write ${level} logs for ${date}:`, error);
      }
    }

    // Also write to combined log file
    const combinedFilename = `${date}-combined.log`;
    const combinedFilepath = path.join(this.logDir, combinedFilename);
    
    const allLogLines = logs
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .map(log => JSON.stringify(log))
      .join('\n') + '\n';
    
    try {
      await appendFile(combinedFilepath, allLogLines, 'utf8');
    } catch (error) {
      console.error(`Failed to write combined logs for ${date}:`, error);
    }
  }

  // Error tracking and metrics
  private trackError(error: Error, context?: Record<string, any>): void {
    const errorKey = `${error.name}:${error.message}`;
    
    if (!this.errorMetrics.has(errorKey)) {
      this.errorMetrics.set(errorKey, {
        count: 0,
        lastOccurrence: new Date(),
        firstOccurrence: new Date(),
        affectedUsers: new Set(),
        contexts: []
      });
    }

    const metrics = this.errorMetrics.get(errorKey)!;
    metrics.count++;
    metrics.lastOccurrence = new Date();
    
    const userId = this.getCurrentUserId();
    if (userId) {
      metrics.affectedUsers.add(userId);
    }

    if (context) {
      metrics.contexts.push({
        timestamp: new Date(),
        ...context
      });

      // Keep only last 10 contexts to prevent memory bloat
      if (metrics.contexts.length > 10) {
        metrics.contexts = metrics.contexts.slice(-10);
      }
    }
  }

  // Get error metrics for monitoring
  getErrorMetrics(): Record<string, any> {
    const metrics: Record<string, any> = {};
    
    for (const [errorKey, errorMetrics] of this.errorMetrics) {
      metrics[errorKey] = {
        count: errorMetrics.count,
        lastOccurrence: errorMetrics.lastOccurrence,
        firstOccurrence: errorMetrics.firstOccurrence,
        affectedUsersCount: errorMetrics.affectedUsers.size,
        recentContexts: errorMetrics.contexts.slice(-5)
      };
    }

    return metrics;
  }

  // Context extraction methods (to be implemented based on your app structure)
  private getCurrentRequestId(): string | undefined {
    // Extract from AsyncLocalStorage or request context
    return undefined;
  }

  private getCurrentUserId(): string | undefined {
    // Extract from session or auth context
    return undefined;
  }

  private getCurrentSessionId(): string | undefined {
    // Extract from session
    return undefined;
  }

  private getCurrentUrl(): string | undefined {
    // Extract from request context
    return undefined;
  }

  private getCurrentUserAgent(): string | undefined {
    // Extract from request headers
    return undefined;
  }

  private getCurrentIP(): string | undefined {
    // Extract from request
    return undefined;
  }

  private async sendCriticalAlert(message: string, error?: Error, context?: Record<string, any>): Promise<void> {
    // Implement critical alert system (email, Slack, etc.)
    console.error('CRITICAL ALERT:', message, error?.stack);
    
    // Example: Send to monitoring service
    try {
      // await sendToMonitoringService({
      //   type: 'critical_error',
      //   message,
      //   error: error?.stack,
      //   context,
      //   timestamp: new Date().toISOString()
      // });
    } catch (alertError) {
      console.error('Failed to send critical alert:', alertError);
    }
  }
}

// Performance monitoring
export class PerformanceTracker {
  private static measurements = new Map<string, number[]>();

  static startTimer(label: string): () => number {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.recordMeasurement(label, duration);
      return duration;
    };
  }

  static recordMeasurement(label: string, duration: number): void {
    if (!this.measurements.has(label)) {
      this.measurements.set(label, []);
    }

    const measurements = this.measurements.get(label)!;
    measurements.push(duration);

    // Keep only last 1000 measurements per label
    if (measurements.length > 1000) {
      measurements.shift();
    }

    // Log slow operations
    if (duration > 1000) { // Log operations slower than 1 second
      Logger.getInstance().warn(`Slow operation detected: ${label}`, {
        duration: `${duration.toFixed(2)}ms`,
        label
      });
    }
  }

  static getMetrics(): Record<string, any> {
    const metrics: Record<string, any> = {};

    for (const [label, measurements] of this.measurements) {
      if (measurements.length === 0) continue;

      const sorted = [...measurements].sort((a, b) => a - b);
      const sum = measurements.reduce((a, b) => a + b, 0);

      metrics[label] = {
        count: measurements.length,
        average: sum / measurements.length,
        min: Math.min(...measurements),
        max: Math.max(...measurements),
        median: sorted[Math.floor(sorted.length / 2)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)]
      };
    }

    return metrics;
  }
}

// Structured logging for specific domains
export class DomainLogger {
  constructor(private domain: string, private logger: Logger = Logger.getInstance()) {}

  debug(message: string, context?: Record<string, any>): void {
    this.logger.debug(`[${this.domain}] ${message}`, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.logger.info(`[${this.domain}] ${message}`, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.logger.warn(`[${this.domain}] ${message}`, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.logger.error(`[${this.domain}] ${message}`, error, { ...context, domain: this.domain });
  }

  critical(message: string, error?: Error, context?: Record<string, any>): void {
    this.logger.critical(`[${this.domain}] ${message}`, error, { ...context, domain: this.domain });
  }

  // Domain-specific performance tracking
  trackOperation<T>(operationName: string, operation: () => Promise<T>): Promise<T> {
    return this.trackSync(`${this.domain}:${operationName}`, operation);
  }

  private async trackSync<T>(label: string, operation: () => Promise<T>): Promise<T> {
    const endTimer = PerformanceTracker.startTimer(label);
    
    try {
      const result = await operation();
      const duration = endTimer();
      
      this.debug(`Operation completed: ${label}`, { duration: `${duration.toFixed(2)}ms` });
      
      return result;
    } catch (error) {
      const duration = endTimer();
      
      this.error(`Operation failed: ${label}`, error as Error, { duration: `${duration.toFixed(2)}ms` });
      
      throw error;
    }
  }
}

// Specialized loggers for different domains
export const authLogger = new DomainLogger('AUTH');
export const dbLogger = new DomainLogger('DATABASE');
export const apiLogger = new DomainLogger('API');
export const securityLogger = new DomainLogger('SECURITY');
export const performanceLogger = new DomainLogger('PERFORMANCE');

// Export singleton logger
export const logger = Logger.getInstance();

// Error boundary for React components
export function withErrorBoundary<T extends Record<string, any>>(
  WrappedComponent: React.ComponentType<T>,
  fallbackComponent?: React.ComponentType<{ error: Error; errorInfo: any }>
) {
  return class ErrorBoundary extends React.Component<T, { hasError: boolean; error?: Error }> {
    constructor(props: T) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: any) {
      logger.error('React Error Boundary caught error', error, {
        componentStack: errorInfo.componentStack,
        errorBoundary: true
      });
    }

    render() {
      if (this.state.hasError) {
        if (fallbackComponent) {
          const FallbackComponent = fallbackComponent;
          return <FallbackComponent error={this.state.error!} errorInfo={this.state} />;
        }

        return (
          <div className="error-boundary">
            <h2>Something went wrong</h2>
            <p>An error occurred in this component. Please try refreshing the page.</p>
          </div>
        );
      }

      return <WrappedComponent {...this.props} />;
    }
  };
}