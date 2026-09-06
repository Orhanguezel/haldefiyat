/** Editorial labels only: never forward click IDs, landing URLs, free text or contact details. */
const KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'] as const;
export function sanitizeBillingAttribution(input: unknown): Record<string, string> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const output: Record<string, string> = {};
  for (const key of KEYS) {
    const value = (input as Record<string, unknown>)[key];
    if (typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,119}$/.test(value)) output[key] = value;
  }
  const series = output.utm_content?.toLowerCase().match(/^(k[1-5])(?:[-_:]|$)/)?.[1];
  if (series) output.content_series = series;
  return output;
}
export function checkoutAttributionMetadata(userId: string, input: unknown) {
  const metadata = { ...sanitizeBillingAttribution(input), user_id: userId };
  return { metadata, subscription_data: { metadata: { ...metadata } } };
}
/** Call only after webhook signature verification. Invoice is the revenue grain, not session/trial. */
export function editorialPaymentEvidence(event: Record<string, unknown>) {
  if (event.type !== 'invoice.payment_succeeded' || event.livemode !== true) return null;
  const data = (event.data as {object?: Record<string, unknown>} | undefined)?.object;
  if (!data || data.status !== 'paid' || typeof data.amount_paid !== 'number'
    || !Number.isSafeInteger(data.amount_paid) || data.amount_paid <= 0
    || typeof data.id !== 'string' || !/^in_[a-zA-Z0-9]+$/.test(data.id)
    || typeof data.currency !== 'string' || !/^[a-z]{3}$/.test(data.currency)) return null;
  // Support both current and previously configured Stripe webhook API shapes.
  const parent = data.parent as {subscription_details?: {metadata?: unknown}} | undefined;
  const legacy = data.subscription_details as {metadata?: unknown} | undefined;
  const attribution = sanitizeBillingAttribution(parent?.subscription_details?.metadata ?? legacy?.metadata ?? data.metadata);
  if (!attribution.content_series) return null;
  return { eventId: String(event.id ?? ''), invoiceId: data.id, amountPaidMinor: data.amount_paid,
    currency: data.currency, livemode: true, ...attribution };
}
