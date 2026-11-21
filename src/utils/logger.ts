import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const isProd = process.env.NODE_ENV === "production";

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.errors({ stack: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, stack, ...meta } = info;
    const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return `${timestamp} [${level}]: ${message}${metaString}${stack ? "\n" + stack : ""}`;
  }),
);

const dailyRotateOptions = {
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
};

const consoleTransport = new winston.transports.Console({
  stderrLevels: ["error"],
  format: isProd
    ? logFormat
    : winston.format.combine(winston.format.colorize({ all: true }), logFormat),
});

const logger = winston.createLogger({
  level: isProd ? "info" : "debug",
  format: logFormat,
  transports: [
    consoleTransport,
    new DailyRotateFile({
      filename: "logs/error-%DATE%.log",
      level: "error",
      ...dailyRotateOptions,
    }),
    new DailyRotateFile({
      filename: "logs/application-%DATE%.log",
      ...dailyRotateOptions,
    }),
  ],
});

if (process.env.NODE_ENV === "test") {
  logger.silent = true;
}

export default logger;
