export type AlertDirection = "below" | "above";
export type AlertChannel = "email" | "telegram";

export interface AlertFormState {
  productSlug: string;
  marketSlug: string;
  thresholdPrice: string;
  direction: AlertDirection;
  channel: AlertChannel;
  contactEmail: string;
  contactTelegram: string;
}

export const INITIAL_FORM: AlertFormState = {
  productSlug: "",
  marketSlug: "",
  thresholdPrice: "",
  direction: "below",
  channel: "email",
  contactEmail: "",
  contactTelegram: "",
};

export interface OpenAlertDetail {
  productSlug?: string;
  marketSlug?: string;
}

export function openAlertModal(productSlug?: string, marketSlug?: string): void {
  if (typeof document === "undefined") return;
  const detail: OpenAlertDetail = { productSlug, marketSlug };
  document.dispatchEvent(new CustomEvent<OpenAlertDetail>("open-alert", { detail }));
}
