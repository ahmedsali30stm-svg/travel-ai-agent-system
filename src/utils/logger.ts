import pino from 'pino';
import { config } from '../config/index.js';

export const logger = pino({
  level: config.monitoring.logLevel,
  transport: config.app.env === 'development' 
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
});

export const createContextLogger = (context: Record<string, unknown>) => {
  return logger.child(context);
};
