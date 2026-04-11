import fp from 'fastify-plugin';
import * as Sentry from '@sentry/node';
import { env } from '../core/env';

let sentryEnabled = false;

export function setSentryUserContext(id: string) {
  if (!sentryEnabled) return;
  Sentry.setUser({ id });
}

export function captureServerException(
  err: unknown,
  extras?: Record<string, unknown>,
) {
  if (!sentryEnabled) return;

  Sentry.withScope((scope) => {
    if (extras) {
      for (const [key, value] of Object.entries(extras)) {
        scope.setExtra(key, value);
      }
    }
    Sentry.captureException(err);
  });
}

export default fp(async (app) => {
  if (!env.SENTRY_DSN) {
    app.log.info('Sentry disabled: missing SENTRY_DSN');
    return;
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
  });
  sentryEnabled = true;
  app.log.info('Sentry initialized');

  app.addHook('onClose', async () => {
    await Sentry.close(2000);
    sentryEnabled = false;
  });
});
