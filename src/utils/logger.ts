import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

// Custom format to add color in development, but keep standard format for files
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }), // captures stack traces
  winston.format.printf((info) => {
    return `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`;
  })
);

// Daily rotate options
const dailyRotateOptions = {
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d'
};

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        logFormat
      )
    }),
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      level: 'error',
      ...dailyRotateOptions
    }),
    new DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      ...dailyRotateOptions
    })
  ]
});

// Optionally, bypass console output if testing
if (process.env.NODE_ENV === 'test') {
  logger.silent = true;
}

export default logger;
