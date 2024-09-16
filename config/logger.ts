import * as bunyan from 'bunyan';
import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';

// Define log levels
enum LogLevel {
  TRACE = 'trace',
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

// Custom stream to handle production logging
class ProductionStream {
  write(rec: any) {
    const { time, pid, hostname, name, level, msg, err, ...rest } = rec;
    const logEntry = {
      time,
      pid,
      hostname,
      name,
      level: bunyan.nameFromLevel[level],
      msg,
      ...(err && { err: { message: err.message, code: err.code, signal: err.signal } }),
      ...rest,
    };
    console.log(JSON.stringify(logEntry));
  }
}

class Logger {
  private logger: bunyan;

  constructor() {
    const isProduction = process.env.NODE_ENV === 'production';
    const logDir = path.join(__dirname, 'logs');

    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
    }

    this.logger = bunyan.createLogger({
      name: 'myapp',
      streams: [
        {
          level: isProduction ? 'info' : 'debug',
          stream: isProduction ? new ProductionStream() : process.stdout,
        },
        {
          level: 'error',
          path: path.join(logDir, 'error.log'),
        },
      ],
      serializers: bunyan.stdSerializers,
    });
  }

  private log(level: LogLevel, message: string, meta?: object) {
    this.logger[level](meta || {}, message);
  }

  trace(message: string, meta?: object) {
    this.log(LogLevel.TRACE, message, meta);
  }

  debug(message: string, meta?: object) {
    this.log(LogLevel.DEBUG, message, meta);
  }

  info(message: string, meta?: object) {
    this.log(LogLevel.INFO, message, meta);
  }

  warn(message: string, meta?: object) {
    this.log(LogLevel.WARN, message, meta);
  }

  error(message: string, error?: Error, meta?: object) {
    const isProduction = process.env.NODE_ENV === 'production';
    const errorMeta = {
      ...(meta || {}),
      err: isProduction
        ? { message: error?.message, code: error?.name }
        : error,
    };
    this.log(LogLevel.ERROR, message, errorMeta);
  }

  fatal(message: string, error?: Error, meta?: object) {
    const isProduction = process.env.NODE_ENV === 'production';
    const errorMeta = {
      ...(meta || {}),
      err: isProduction
        ? { message: error?.message, code: error?.name }
        : error,
    };
    this.log(LogLevel.FATAL, message, errorMeta);
  }

  // Method to log HTTP requests
  logHttpRequest(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const message = `HTTP ${req.method} ${req.originalUrl}`;

      this.info(message, {
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        duration,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
      });
    });

    next();
  }
}

// Export a singleton instance
export const logger = new Logger();