"use client";

import { useMemo, useState } from "react";

import Image from "next/image";

import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { TranslateFn } from "@/i18n";
import type { PressCampaign, PressEmailBranding } from "@/integrations/endpoints/admin/press-admin-endpoints";
import {
  useCreatePressCampaignAdminMutation,
  useGetPressEmailBrandingAdminQuery,
  useListEmailTemplatesAdminQuery,
  useListPublicAnalysisReportsForPressQuery,
  useUpdatePressCampaignAdminMutation,
  useUpdatePressEmailBrandingAdminMutation,
} from "@/integrations/hooks";

import { formatDate, htmlToPlainText, renderTemplateText, SITE_NAME, SITE_URL, splitTags } from "../_lib/press-meta";
import { CampaignDetailSheet } from "./campaign-detail-sheet";

const EMPTY = { name: "", subject: "", pitch: "", segmentTags: "" };
const MANUAL_CAMPAIGN_STATUSES = ["draft", "completed", "archived"] as const;

type Props = {
  campaigns: PressCampaign[];
  loading: boolean;
  selected: PressCampaign | null;
  onSelect: (id: number) => void;
  t: TranslateFn;
  tc: TranslateFn;
};

/** Kampanya olusturma (e-posta sablonundan doldurma dahil), liste ve secili kampanyanin temas gecmisi. */
export function CampaignsPanel({ campaigns, loading, selected, onSelect, t, tc }: Props) {
  const { data: templates = [] } = useListEmailTemplatesAdminQuery({ q: "press_", is_active: true });
  const { data: reports } = useListPublicAnalysisReportsForPressQuery();
  const { data: brandingData, isLoading: brandingLoading } = useGetPressEmailBrandingAdminQuery();
  const [create, cr] = useCreatePressCampaignAdminMutation();
  const [update] = useUpdatePressCampaignAdminMutation();
  const [form, setForm] = useState(EMPTY);
  const [detailCampaignId, setDetailCampaignId] = useState<number | null>(null);
  const set = (k: keyof typeof EMPTY, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const pressTemplates = templates.filter(
    (x) =>
      x.template_key.startsWith("press_") ||
      x.template_key.includes("release") ||
      x.template_key.includes("story_pitch"),
  );
  const latest = reports?.items?.[0] ?? null;
  const vars = useMemo<Record<string, string>>(
    () => ({
      press_url: `${SITE_URL}/basin`,
      api_docs_url: `${SITE_URL}/api-docs`,
      index_url: `${SITE_URL}/endeks`,
      analysis_url: latest ? `${SITE_URL}/analiz/${latest.slug}` : `${SITE_URL}/analiz`,
      report_url: latest ? `${SITE_URL}/analiz/${latest.slug}` : `${SITE_URL}/analiz`,
      week_title: latest?.baslik || t("campaigns.weekTitleFallback", { site: SITE_NAME }),
    }),
    [latest, t],
  );

  function fromTemplate(key: string) {
    const tpl = pressTemplates.find((x) => x.template_key === key);
    if (!tpl) return;
    setForm((p) => ({
      ...p,
      subject: renderTemplateText(tpl.subject || "", vars) || p.subject,
      pitch: htmlToPlainText(renderTemplateText(tpl.content || "", vars)) || p.pitch,
    }));
  }
  async function submit() {
    if (!form.name.trim() || !form.subject.trim() || !form.pitch.trim()) {
      toast.error(t("campaigns.required"));
      return;
    }
    try {
      const res = await create({
        name: form.name.trim(),
        subject: form.subject.trim(),
        pitch: form.pitch.trim(),
        segmentTags: splitTags(form.segmentTags),
        status: "draft",
      }).unwrap();
      setForm(EMPTY);
      onSelect(res.data.id);
      toast.success(t("campaigns.created"));
    } catch {
      toast.error(tc("saveFailed"));
    }
  }

  const detailCampaign = campaigns.find((campaign) => campaign.id === detailCampaignId) ?? null;
  function openCampaign(id: number) {
    onSelect(id);
    setDetailCampaignId(id);
  }
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="space-y-4">
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>{t("campaigns.table.name")}</TableHead>
                <TableHead className="w-36">{t("campaigns.table.status")}</TableHead>
                <TableHead className="min-w-[160px]">{t("campaigns.table.tags")}</TableHead>
                <TableHead className="w-28">{t("campaigns.table.created")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4}>{tc("loading")}</TableCell>
                </TableRow>
              ) : null}
              {!loading && !campaigns.length ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    {t("campaigns.empty")}
                  </TableCell>
                </TableRow>
              ) : null}
              {campaigns.map((c) => (
                <TableRow
                  key={c.id}
                  tabIndex={0}
                  aria-label={t("campaigns.detail.open", { name: c.name })}
                  onClick={() => openCampaign(c.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openCampaign(c.id);
                    }
                  }}
                  className={`cursor-pointer ${selected?.id === c.id ? "bg-primary/5" : ""}`}
                >
                  <TableCell className="py-2.5">
                    <div className="font-medium">{c.name}</div>
                    <div className="truncate text-muted-foreground text-xs">{c.subject}</div>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {c.status === "active" ? (
                      <Badge>{t("campaigns.statuses.active")}</Badge>
                    ) : (
                      <Select
                        value={c.status}
                        onValueChange={(v) => update({ id: c.id, patch: { status: v as PressCampaign["status"] } })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MANUAL_CAMPAIGN_STATUSES.map((k) => (
                            <SelectItem key={k} value={k}>
                              {t(`campaigns.statuses.${k}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {c.segmentTags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="font-normal">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDate(c.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="space-y-4">
        {brandingData?.data ? (
          <EmailBrandingSettings key={JSON.stringify(brandingData.data)} branding={brandingData.data} t={t} tc={tc} />
        ) : brandingLoading ? (
          <div className="rounded-lg border p-4 text-muted-foreground text-sm">{tc("loading")}</div>
        ) : null}
        <div className="space-y-2 rounded-lg border p-4">
          <h3 className="font-medium text-sm">{t("campaigns.newTitle")}</h3>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder={t("campaigns.name")} />
          <Input
            value={form.subject}
            onChange={(e) => set("subject", e.target.value)}
            placeholder={t("campaigns.subject")}
          />
          <Input
            value={form.segmentTags}
            onChange={(e) => set("segmentTags", e.target.value)}
            placeholder={t("campaigns.tags")}
          />
          <Select onValueChange={fromTemplate}>
            <SelectTrigger>
              <SelectValue placeholder={t("campaigns.fromTemplate")} />
            </SelectTrigger>
            <SelectContent>
              {pressTemplates.map((x) => (
                <SelectItem key={x.id} value={x.template_key}>
                  {x.template_name || x.template_key}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            className="min-h-32"
            value={form.pitch}
            onChange={(e) => set("pitch", e.target.value)}
            placeholder={t("campaigns.pitch")}
          />
          <Button className="w-full" onClick={submit} disabled={cr.isLoading}>
            {cr.isLoading ? t("campaigns.creating") : t("campaigns.create")}
          </Button>
        </div>
      </div>
      <CampaignDetailSheet campaign={detailCampaign} onClose={() => setDetailCampaignId(null)} t={t} tc={tc} />
    </div>
  );
}

function EmailBrandingSettings({ branding, t, tc }: { branding: PressEmailBranding; t: TranslateFn; tc: TranslateFn }) {
  const [form, setForm] = useState(branding);
  const [save, saving] = useUpdatePressEmailBrandingAdminMutation();
  const set = (key: keyof PressEmailBranding, value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function submit() {
    try {
      await save(form).unwrap();
      toast.success(t("campaigns.branding.saved"));
    } catch {
      toast.error(tc("saveFailed"));
    }
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div>
        <h3 className="font-semibold text-sm">{t("campaigns.branding.title")}</h3>
        <p className="text-muted-foreground text-xs">{t("campaigns.branding.description")}</p>
      </div>
      <div
        className="rounded-lg border bg-white p-4"
        style={{ borderBottomColor: form.accentColor, borderBottomWidth: 3 }}
      >
        <Image
          src={form.logoUrl}
          alt={form.logoAlt}
          width={220}
          height={82}
          unoptimized
          className="h-auto max-h-16 max-w-[220px] object-contain"
        />
        <p className="mt-2 text-muted-foreground text-xs">{form.tagline}</p>
      </div>
      <label htmlFor="press-brand-logo-url" className="block space-y-1 font-medium text-xs">
        <span>{t("campaigns.branding.logoUrl")}</span>
        <Input
          id="press-brand-logo-url"
          value={form.logoUrl}
          onChange={(e) => set("logoUrl", e.target.value)}
          type="url"
        />
      </label>
      <div className="grid gap-2 sm:grid-cols-2">
        <label htmlFor="press-brand-logo-alt" className="block space-y-1 font-medium text-xs">
          <span>{t("campaigns.branding.logoAlt")}</span>
          <Input id="press-brand-logo-alt" value={form.logoAlt} onChange={(e) => set("logoAlt", e.target.value)} />
        </label>
        <label htmlFor="press-brand-color" className="block space-y-1 font-medium text-xs">
          <span>{t("campaigns.branding.color")}</span>
          <div className="flex gap-2">
            <Input
              aria-label={t("campaigns.branding.color")}
              id="press-brand-color"
              className="w-12 shrink-0 p-1"
              type="color"
              value={form.accentColor}
              onChange={(e) => set("accentColor", e.target.value)}
            />
            <Input value={form.accentColor} onChange={(e) => set("accentColor", e.target.value)} />
          </div>
        </label>
      </div>
      <label htmlFor="press-brand-tagline" className="block space-y-1 font-medium text-xs">
        <span>{t("campaigns.branding.tagline")}</span>
        <Input id="press-brand-tagline" value={form.tagline} onChange={(e) => set("tagline", e.target.value)} />
      </label>
      <div className="grid gap-2 sm:grid-cols-2">
        <label htmlFor="press-brand-signature-name" className="block space-y-1 font-medium text-xs">
          <span>{t("campaigns.branding.signatureName")}</span>
          <Input
            id="press-brand-signature-name"
            value={form.signatureName}
            onChange={(e) => set("signatureName", e.target.value)}
          />
        </label>
        <label htmlFor="press-brand-signature-title" className="block space-y-1 font-medium text-xs">
          <span>{t("campaigns.branding.signatureTitle")}</span>
          <Input
            id="press-brand-signature-title"
            value={form.signatureTitle}
            onChange={(e) => set("signatureTitle", e.target.value)}
          />
        </label>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <label htmlFor="press-brand-email" className="block space-y-1 font-medium text-xs">
          <span>{t("campaigns.branding.email")}</span>
          <Input
            id="press-brand-email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            type="email"
          />
        </label>
        <label htmlFor="press-brand-website" className="block space-y-1 font-medium text-xs">
          <span>{t("campaigns.branding.website")}</span>
          <Input
            id="press-brand-website"
            value={form.website}
            onChange={(e) => set("website", e.target.value)}
            type="url"
          />
        </label>
      </div>
      <Button className="w-full" variant="outline" onClick={submit} disabled={saving.isLoading}>
        {saving.isLoading ? t("campaigns.branding.saving") : t("campaigns.branding.save")}
      </Button>
    </div>
  );
}
