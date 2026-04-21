import type { TelegramInboundMessage } from '@/integrations/shared/telegram-inbound';

export function formatTelegramInboundLocalDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return String(iso);
  return date.toLocaleString();
}

export function getTelegramInboundSenderName(message: TelegramInboundMessage): string {
  const firstName = (message.from_first_name ?? '').trim();
  const lastName = (message.from_last_name ?? '').trim();
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
  return fullName || '-';
}
