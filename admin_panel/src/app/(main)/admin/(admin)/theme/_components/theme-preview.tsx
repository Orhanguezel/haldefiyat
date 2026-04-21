"use client";

import type { TranslateFn } from "@/i18n";
import type { ColorTokens } from "@/integrations/shared";

export type ThemePreviewProps = {
  colors: ColorTokens;
  t: TranslateFn;
};

export function ThemePreview({ colors, t }: ThemePreviewProps) {
  return (
    <div className="overflow-hidden rounded-lg border" style={{ backgroundColor: colors.background }}>
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ backgroundColor: colors.navBg, color: colors.navFg }}
      >
        <span className="text-sm font-bold">{t("preview.brandName")}</span>
        <div className="flex gap-2 text-xs">
          <span>{t("preview.navHome")}</span>
          <span>{t("preview.navProducts")}</span>
          <span>{t("preview.navContact")}</span>
        </div>
      </div>

      <div className="space-y-3 p-4" style={{ backgroundColor: colors.surfaceBase }}>
        <div
          className="rounded-md p-3"
          style={{ backgroundColor: colors.surfaceRaised, border: `1px solid ${colors.border}` }}
        >
          <div className="text-sm font-semibold" style={{ color: colors.textStrong }}>
            {t("preview.headingText")}
          </div>
          <div className="mt-1 text-xs" style={{ color: colors.textBody }}>
            {t("preview.bodyText")}
          </div>
          <div className="mt-1 text-xs" style={{ color: colors.textMuted }}>
            {t("preview.mutedText")}
          </div>
        </div>

        <div className="flex gap-2">
          <div className="rounded-md px-3 py-1.5 text-xs text-white" style={{ backgroundColor: colors.primary }}>
            {t("preview.primaryButton")}
          </div>
          <div
            className="rounded-md px-3 py-1.5 text-xs"
            style={{ backgroundColor: colors.accent, color: colors.textStrong }}
          >
            {t("preview.accent")}
          </div>
        </div>

        <div className="rounded-md p-3" style={{ backgroundColor: colors.surfaceDarkBg }}>
          <div className="text-xs font-semibold" style={{ color: colors.surfaceDarkHeading }}>
            {t("preview.darkSection")}
          </div>
          <div className="mt-1 text-xs" style={{ color: colors.surfaceDarkText }}>
            {t("preview.darkSectionText")}
          </div>
        </div>
      </div>

      <div className="px-4 py-2 text-xs" style={{ backgroundColor: colors.footerBg, color: colors.footerFg }}>
        {t("preview.copyright")}
      </div>
    </div>
  );
}
