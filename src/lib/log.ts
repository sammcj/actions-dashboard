import pino from "pino";
import config from "./config";

// Create the Pino logger with dynamic log level
const createLogger = (level: string) =>
  pino({
    name: "actions-dashboard",
    level: config.logLevel,
    customLevels: undefined,
  });

// #TODO: revisit this to ensure we get structured logging
// Create loggers for different log levels
const logger = {
  debug: createLogger("debug").debug.bind(createLogger("debug")),
  info: createLogger("info").info.bind(createLogger("info")),
  warn: createLogger("warn").warn.bind(createLogger("warn")),
  error: createLogger("error").error.bind(createLogger("error")),
  trace: createLogger("trace").trace.bind(createLogger("trace")),
  undefined: createLogger("undefined").info.bind(createLogger("undefined")),
};

// #TODO ! this is a bit of a hack, won't scale that well as may not be all async
// Takes any number of arguments of any type and tries to convert them to strings.
// Then passes those strings through to logger with the appropriate log level.
export class log {
  static debug(...args: any[]): void {
    args.forEach((arg) => {
      logger.debug(arg);
    });
  }
  static info(...args: any[]): void {
    args.forEach((arg) => {
      logger.info(arg);
    });
  }
  static warn(...args: any[]): void {
    args.forEach((arg) => {
      logger.warn(arg);
    });
  }
  static error(...args: any[]): void {
    args.forEach((arg) => {
      logger.error(arg);
    });
  }
  static trace(...args: any[]): void {
    args.forEach((arg) => {
      logger.trace(arg);
    });
  }
  static undefined(...args: any[]): void {
    args.forEach((arg) => {
      logger.undefined(arg);
    });
  }
}
