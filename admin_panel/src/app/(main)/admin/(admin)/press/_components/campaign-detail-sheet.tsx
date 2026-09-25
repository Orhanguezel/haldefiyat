"use client";

import { useEffect, useState } from "react";

import Image from "next/image";

import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TranslateFn } from "@/i18n";
import type { PressCampaign } from "@/integrations/endpoints/admin/press-admin-endpoints";
import {
  useApprovePressCampaignAdminMutation,
  useGetPressCampaignPreflightAdminQuery,
  useGetPressLogMessageAdminQuery,
  useListPressLogsAdminQuery,
  useSendPressCampaignAdminMutation,
} from "@/integrations/hooks";

import { formatDate, formatDateTime } from "../_lib/press-meta";

type Props = {
  campaign: PressCampaign | null;
  onClose: () => void;
  t: TranslateFn;
  tc: TranslateFn;
};

function DetailItem({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border bg-muted/20 p-3">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="break-words font-medium text-sm">{value || "—"}</span>
    </div>
  );
}

export function CampaignDetailSheet({ campaign, onClose, t, tc }: Props) {
  const campaignId = campaign?.id ?? 0;
  const { data: logsData, isFetching: logsLoading } = useListPressLogsAdminQuery(
    { campaignId },
    { skip: !campaignId, refetchOnMountOrArgChange: true },
  );
  const {
    data: preflightData,
    isFetching: preflightLoading,
    isError: preflightError,
    refetch: refetchPreflight,
  } = useGetPressCampaignPreflightAdminQuery(
    { id: campaignId },
    { skip: !campaignId, refetchOnMountOrArgChange: true },
  );
  const [approve, approval] = useApprovePressCampaignAdminMutation();
  const [send, sending] = useSendPressCampaignAdminMutation();
  const [acceptedHash, setAcceptedHash] = useState("");
  const [scheduledStart, setScheduledStart] = useState("");
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
  const logs = logsData?.items ?? [];
  const selectedLog =
    logs.find((log) => log.id === selectedLogId) ?? logs.find((log) => log.channel === "email") ?? null;
  const {
    data: messageData,
    isFetching: messageLoading,
    isError: messageError,
  } = useGetPressLogMessageAdminQuery(
    { campaignId, logId: selectedLog?.id ?? 0 },
    { skip: !campaignId || !selectedLog, refetchOnMountOrArgChange: true },
  );
  const preflight = preflightData?.data;
  const message = messageData?.data;
  const accepted = Boolean(preflight && acceptedHash === preflight.preflightHash);

  // biome-ignore lint/correctness/useExhaustiveDependencies: kampanya degisince cekmeceye ait gecici secimler sifirlanir
  useEffect(() => {
    setAcceptedHash("");
    setScheduledStart("");
    setSelectedLogId(null);
  }, [campaignId]);

  async function approveCurrent() {
    if (!campaign || !preflight || !accepted) return;
    try {
      await approve({ id: campaign.id, preflightHash: preflight.preflightHash }).unwrap();
      await refetchPreflight();
      toast.success(t("campaigns.delivery.approved"));
    } catch {
      toast.error(t("campaigns.delivery.approvalFailed"));
    }
  }

  async function sendCurrent() {
    if (!campaign || !preflight?.approved) return;
    try {
      const scheduledAt = scheduledStart ? new Date(scheduledStart).toISOString() : undefined;
      const result = await send({ id: campaign.id, preflightHash: preflight.preflightHash, scheduledAt }).unwrap();
      toast.success(
        scheduledAt
          ? t("campaigns.delivery.scheduled", {
              count: result.data.queued,
              date: formatDateTime(result.data.scheduledAt),
            })
          : t("campaigns.delivery.queued", { count: result.data.queued }),
      );
    } catch {
      toast.error(t("campaigns.delivery.sendFailed"));
    }
  }

  return (
    <Sheet
      open={Boolean(campaign)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent side="right" className="w-full max-w-none gap-0 p-0 sm:max-w-4xl">
        {campaign ? (
          <>
            <SheetHeader className="border-b px-6 py-4 pr-14">
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle>{campaign.name}</SheetTitle>
                <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
                  {t(`campaigns.statuses.${campaign.status}`)}
                </Badge>
              </div>
              <SheetDescription>{campaign.subject}</SheetDescription>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {campaign.segmentTags.map((tag) => (
                  <Badge key={tag} variant="outline" className="font-normal">
                    {tag}
                  </Badge>
                ))}
              </div>
            </SheetHeader>

            <Tabs defaultValue="summary" className="min-h-0 flex-1 gap-0">
              <div className="overflow-x-auto border-b px-6 py-3">
                <TabsList>
                  <TabsTrigger value="summary">{t("campaigns.detail.tabs.summary")}</TabsTrigger>
                  <TabsTrigger value="content">{t("campaigns.detail.tabs.content")}</TabsTrigger>
                  <TabsTrigger value="messages">{t("campaigns.detail.tabs.messages")}</TabsTrigger>
                </TabsList>
              </div>
              <ScrollArea className="min-h-0 flex-1">
                <div className="p-6">
                  <TabsContent value="summary" className="m-0 flex flex-col gap-5">
                    <section className="flex flex-col gap-3">
                      <h3 className="font-semibold text-sm">{t("campaigns.detail.campaignInfo")}</h3>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <DetailItem label={t("campaigns.table.created")} value={formatDateTime(campaign.createdAt)} />
                        <DetailItem
                          label={t("campaigns.detail.approvedAt")}
                          value={formatDateTime(campaign.approvedAt)}
                        />
                        <DetailItem label={t("campaigns.detail.approvedBy")} value={campaign.approvedBy} />
                        <DetailItem
                          label={t("campaigns.detail.scheduledAt")}
                          value={formatDateTime(campaign.scheduledAt)}
                        />
                        <DetailItem label={t("campaigns.detail.sentAt")} value={formatDateTime(campaign.sentAt)} />
                        <DetailItem label={t("campaigns.detail.template")} value={campaign.templateKey} />
                      </div>
                    </section>

                    <Separator />

                    <section className="flex flex-col gap-3">
                      <h3 className="font-semibold text-sm">{t("campaigns.detail.deliveryInfo")}</h3>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <DetailItem label={t("campaigns.delivery.from")} value={campaign.fromEmail} />
                        <DetailItem label="Reply-To" value={campaign.replyToEmail} />
                        <DetailItem
                          label={t("campaigns.delivery.rate")}
                          value={`${campaign.ratePerMinute}/dk · ${campaign.delayMinSeconds}–${campaign.delayMaxSeconds} sn`}
                        />
                      </div>
                    </section>

                    <section className="flex flex-col gap-2">
                      <h3 className="font-semibold text-sm">{t("campaigns.detail.pitch")}</h3>
                      <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border bg-muted/20 p-4 text-sm">
                        {campaign.pitch}
                      </pre>
                    </section>

                    {campaign.lastError ? (
                      <section className="flex flex-col gap-2 rounded-lg border border-destructive/40 p-4">
                        <h3 className="font-semibold text-sm">{t("campaigns.detail.lastError")}</h3>
                        <p className="text-sm">{campaign.lastError}</p>
                      </section>
                    ) : null}
                  </TabsContent>

                  <TabsContent value="content" className="m-0 flex flex-col gap-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-sm">{t("campaigns.delivery.title")}</h3>
                        <p className="text-muted-foreground text-xs">
                          {preflight
                            ? t("campaigns.delivery.summary", {
                                allowed: preflight.counts.allowed,
                                total: preflight.total,
                              })
                            : t("campaigns.delivery.loading")}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetchPreflight()}
                        disabled={preflightLoading}
                      >
                        {t("campaigns.delivery.refresh")}
                      </Button>
                    </div>

                    {preflightError ? (
                      <p className="rounded-lg border border-destructive/40 p-4 text-sm">
                        {t("campaigns.detail.preflightFailed")}
                      </p>
                    ) : null}

                    {preflight ? (
                      <>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <DetailItem label={t("campaigns.delivery.from")} value={preflight.sender.from} />
                          <DetailItem label="Reply-To" value={preflight.sender.replyTo} />
                          <DetailItem label={t("campaigns.detail.allowed")} value={preflight.counts.allowed} />
                          <DetailItem
                            label={t("campaigns.delivery.blocked")}
                            value={
                              preflight.counts.blocked +
                              preflight.counts.invalid +
                              preflight.counts.duplicate +
                              preflight.counts.suppressed
                            }
                          />
                        </div>

                        <section className="flex flex-col gap-3 rounded-lg border p-4">
                          <h3 className="font-semibold text-sm">{t("campaigns.detail.brandingSignature")}</h3>
                          <div className="grid items-center gap-4 sm:grid-cols-[220px_1fr]">
                            <div
                              className="rounded-lg border bg-white p-4"
                              style={{ borderBottomColor: preflight.branding.accentColor, borderBottomWidth: 3 }}
                            >
                              <Image
                                src={preflight.branding.logoUrl}
                                alt={preflight.branding.logoAlt}
                                width={220}
                                height={82}
                                unoptimized
                                className="h-auto max-h-16 max-w-full object-contain"
                              />
                              <p className="mt-2 text-muted-foreground text-xs">{preflight.branding.tagline}</p>
                            </div>
                            <div className="flex flex-col gap-1 text-sm">
                              <strong>{preflight.branding.signatureName}</strong>
                              <span>{preflight.branding.signatureTitle}</span>
                              <a
                                className="break-all underline-offset-4 hover:underline"
                                href={`mailto:${preflight.branding.email}`}
                              >
                                {preflight.branding.email}
                              </a>
                              <a
                                className="break-all underline-offset-4 hover:underline"
                                href={preflight.branding.website}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {preflight.branding.website}
                              </a>
                            </div>
                          </div>
                        </section>

                        <section className="flex flex-col gap-2">
                          <span className="font-medium text-xs">{t("campaigns.delivery.subject")}</span>
                          <div className="rounded-lg border bg-muted/20 p-3 text-sm">{preflight.preview.subject}</div>
                        </section>

                        <Tabs defaultValue="html-preview">
                          <TabsList>
                            <TabsTrigger value="html-preview">HTML</TabsTrigger>
                            <TabsTrigger value="text-preview">{t("campaigns.delivery.textPreview")}</TabsTrigger>
                          </TabsList>
                          <TabsContent value="html-preview" className="mt-3">
                            <iframe
                              title={t("campaigns.delivery.htmlPreview")}
                              sandbox=""
                              srcDoc={preflight.preview.html}
                              className="h-[520px] w-full rounded-lg border bg-white"
                            />
                          </TabsContent>
                          <TabsContent value="text-preview" className="mt-3">
                            <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-lg border bg-muted/20 p-4 text-xs">
                              {preflight.preview.text}
                            </pre>
                          </TabsContent>
                        </Tabs>

                        <section className="flex flex-col gap-3 rounded-lg border p-4">
                          <h3 className="font-semibold text-sm">{t("campaigns.detail.approvalAndSend")}</h3>
                          <label htmlFor="press-campaign-detail-confirm" className="flex items-start gap-2 text-sm">
                            <Checkbox
                              id="press-campaign-detail-confirm"
                              checked={accepted}
                              onCheckedChange={(value) =>
                                setAcceptedHash(value === true ? preflight.preflightHash : "")
                              }
                            />
                            <span>{t("campaigns.delivery.confirm", { count: preflight.total })}</span>
                          </label>
                          <label htmlFor="press-campaign-detail-start" className="flex flex-col gap-1 text-xs">
                            <span className="font-medium">{t("campaigns.delivery.scheduledStart")}</span>
                            <Input
                              id="press-campaign-detail-start"
                              type="datetime-local"
                              value={scheduledStart}
                              onChange={(event) => setScheduledStart(event.target.value)}
                            />
                          </label>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              onClick={approveCurrent}
                              disabled={!accepted || !preflight.canSend || approval.isLoading || preflight.approved}
                            >
                              {preflight.approved ? t("campaigns.delivery.approved") : t("campaigns.delivery.approve")}
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={sendCurrent}
                              disabled={!preflight.approved || sending.isLoading || campaign.status !== "draft"}
                            >
                              {sending.isLoading
                                ? t("campaigns.delivery.starting")
                                : scheduledStart
                                  ? t("campaigns.delivery.schedule")
                                  : t("campaigns.delivery.start")}
                            </Button>
                          </div>
                        </section>
                      </>
                    ) : null}
                  </TabsContent>

                  <TabsContent value="messages" className="m-0 flex flex-col gap-5">
                    <section className="flex flex-col gap-3">
                      <div>
                        <h3 className="font-semibold text-sm">{t("campaigns.logsTitle", { name: campaign.name })}</h3>
                        <p className="text-muted-foreground text-xs">{t("campaigns.detail.selectMessage")}</p>
                      </div>
                      <div className="overflow-x-auto rounded-lg border">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/40 hover:bg-muted/40">
                              <TableHead>{t("table.organization")}</TableHead>
                              <TableHead className="w-28">{t("table.status")}</TableHead>
                              <TableHead className="w-36">{tc("date")}</TableHead>
                              <TableHead>{t("campaigns.note")}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {logs.map((log) => (
                              <TableRow
                                key={log.id}
                                tabIndex={0}
                                aria-label={t("campaigns.detail.openMessage", { organization: log.organization })}
                                data-state={selectedLog?.id === log.id ? "selected" : undefined}
                                className="cursor-pointer"
                                onClick={() => setSelectedLogId(log.id)}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    setSelectedLogId(log.id);
                                  }
                                }}
                              >
                                <TableCell>
                                  <div className="font-medium">{log.organization}</div>
                                  <div className="text-muted-foreground text-xs">{log.email}</div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={log.status === "published" ? "default" : "secondary"}>
                                    {t(`logStatuses.${log.status}`)}
                                  </Badge>
                                </TableCell>
                                <TableCell>{formatDate(log.contactedAt ?? log.createdAt)}</TableCell>
                                <TableCell className="max-w-64 text-muted-foreground text-xs">
                                  {log.publishedUrl ? (
                                    <a
                                      href={log.publishedUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="underline-offset-4 hover:underline"
                                      onClick={(event) => event.stopPropagation()}
                                    >
                                      {log.publishedUrl}
                                    </a>
                                  ) : (
                                    (log.note ?? "—")
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                            {!logsLoading && !logs.length ? (
                              <TableRow>
                                <TableCell colSpan={4} className="text-muted-foreground">
                                  {t("campaigns.noLogs")}
                                </TableCell>
                              </TableRow>
                            ) : null}
                          </TableBody>
                        </Table>
                      </div>
                    </section>

                    {selectedLog ? (
                      <section className="flex flex-col gap-4 rounded-lg border p-4">
                        <div>
                          <h3 className="font-semibold text-sm">{t("sheet.sentMessage.title")}</h3>
                          <p className="text-muted-foreground text-xs">
                            {selectedLog.organization} · {selectedLog.email}
                          </p>
                        </div>
                        {messageLoading ? <p className="text-muted-foreground text-sm">{tc("loading")}</p> : null}
                        {messageError ? (
                          <p className="text-destructive text-sm">{t("sheet.sentMessage.loadFailed")}</p>
                        ) : null}
                        {message && message.snapshotSource !== "unavailable" ? (
                          <>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                              <DetailItem label={t("sheet.sentMessage.from")} value={message.fromEmail} />
                              <DetailItem label="Reply-To" value={message.replyToEmail} />
                              <DetailItem label={t("sheet.sentMessage.to")} value={message.recipientEmail} />
                              <DetailItem
                                label={t("sheet.sentMessage.sentAt")}
                                value={formatDateTime(message.sentAt)}
                              />
                              <DetailItem label={t("table.status")} value={t(`logStatuses.${message.status}`)} />
                              <DetailItem label={t("sheet.sentMessage.messageId")} value={message.providerMessageId} />
                            </div>
                            <div className="flex flex-col gap-2">
                              <span className="font-medium text-xs">{t("sheet.sentMessage.subject")}</span>
                              <div className="rounded-lg border bg-muted/20 p-3 text-sm">{message.subject ?? "—"}</div>
                            </div>
                            <Tabs defaultValue="sent-html">
                              <TabsList>
                                <TabsTrigger value="sent-html">HTML</TabsTrigger>
                                <TabsTrigger value="sent-text">{t("sheet.sentMessage.text")}</TabsTrigger>
                              </TabsList>
                              <TabsContent value="sent-html" className="mt-3">
                                {message.previewHtml ?? message.html ? (
                                  <iframe
                                    title={t("sheet.sentMessage.htmlPreview")}
                                    sandbox=""
                                    srcDoc={message.previewHtml ?? message.html ?? ""}
                                    className="h-[520px] w-full rounded-lg border bg-white"
                                  />
                                ) : (
                                  <p className="text-muted-foreground text-sm">—</p>
                                )}
                              </TabsContent>
                              <TabsContent value="sent-text" className="mt-3">
                                <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-lg border bg-muted/20 p-4 text-xs">
                                  {message.text ?? "—"}
                                </pre>
                              </TabsContent>
                            </Tabs>
                            {message.snapshotSource === "approval" ? (
                              <p className="text-muted-foreground text-xs">{t("sheet.sentMessage.approvalFallback")}</p>
                            ) : null}
                          </>
                        ) : null}
                        {!messageLoading && message?.snapshotSource === "unavailable" ? (
                          <p className="text-muted-foreground text-sm">{t("sheet.sentMessage.unavailable")}</p>
                        ) : null}
                      </section>
                    ) : null}
                  </TabsContent>
                </div>
              </ScrollArea>
            </Tabs>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
