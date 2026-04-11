import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

export const log = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  ...(isDev
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'HH:MM:ss.l', ignore: 'pid,hostname' },
        },
      }
    : {
        formatters: {
          level(label: string) { return { level: label }; },
          bindings() { return {}; },
        },
        timestamp: () => `,"time":"${new Date().toISOString()}"`,
      }),
});
