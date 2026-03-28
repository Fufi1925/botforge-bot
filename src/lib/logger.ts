import { createLogger, format, transports } from "winston";
export const logger = createLogger({
  level: "info",
  format: format.combine(
    format.colorize(),
    format.timestamp({ format: "DD.MM.YYYY HH:mm:ss" }),
    format.printf(({ level, message, timestamp }) => `[${timestamp}] ${level}: ${message}`)
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "logs/error.log", level: "error" }),
    new transports.File({ filename: "logs/combined.log" }),
  ],
});
