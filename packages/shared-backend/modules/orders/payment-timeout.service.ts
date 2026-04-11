import type { FastifyBaseLogger } from 'fastify';
import { env } from '../../core/env';
import { repoExpireStalePaymentAttempts } from './payment.repository';
import { repoExpireStaleDealerDirectPayments } from '../dealerFinance/direct-payment.repository';

let paymentTimeoutTimer: NodeJS.Timeout | null = null;
let paymentTimeoutRunning = false;

async function runPaymentTimeoutSweep(logger?: FastifyBaseLogger) {
  if (paymentTimeoutRunning) return;
  paymentTimeoutRunning = true;
  try {
    const [expiredOrder, expiredDirect] = await Promise.all([
      repoExpireStalePaymentAttempts(env.PAYMENT_PENDING_TIMEOUT_MINUTES),
      repoExpireStaleDealerDirectPayments(env.PAYMENT_PENDING_TIMEOUT_MINUTES),
    ]);
    const expired = expiredOrder + expiredDirect;
    if (expired > 0) {
      logger?.info?.(
        {
          expired,
          expiredOrder,
          expiredDirect,
          timeoutMinutes: env.PAYMENT_PENDING_TIMEOUT_MINUTES,
        },
        'payment_timeout_cleanup_completed',
      );
    }
  } catch (error) {
    const err = error as { code?: string; errno?: number; message?: string };
    if (err?.code === 'ER_NO_SUCH_TABLE' || err?.errno === 1146) {
      logger?.warn?.({ err }, 'payment_timeout_cleanup_skipped_missing_table');
    } else {
      logger?.error?.(error, 'payment_timeout_cleanup_failed');
    }
  } finally {
    paymentTimeoutRunning = false;
  }
}

export function startPaymentTimeoutJob(logger?: FastifyBaseLogger) {
  if (paymentTimeoutTimer) return;

  paymentTimeoutTimer = setInterval(() => {
    void runPaymentTimeoutSweep(logger);
  }, env.PAYMENT_CLEANUP_INTERVAL_MS);

  paymentTimeoutTimer.unref?.();
  void runPaymentTimeoutSweep(logger);
}
