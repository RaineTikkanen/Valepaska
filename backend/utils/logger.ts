import pino from 'pino';

const logLevel = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'info';



const logger = pino({
  level: logLevel,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    }
  },
});

logger.info(`Logging level: ${logLevel}`);

export default logger;
