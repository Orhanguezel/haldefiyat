"use client";

import { useState } from "react";

import { CornerUpRight, Trash2, XOctagon } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useDeleteRedirectAdminMutation,
  useListRedirectsAdminQuery,
  useUpsertRedirectsAdminMutation,
} from "@/integrations/endpoints/admin/redirects-admin-endpoints";

// Hedefi normalize et: tam URL ya da "/" ile başlıyorsa olduğu gibi; aksi halde ürün slug → /urun/<slug>.
function normalizeTarget(input: string): string {
  const v = input.trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v) || v.startsWith("/")) return v;
  return `/urun/${v}`;
}

export function ProductRedirectPanel({ slug, isNew }: { slug: string; isNew: boolean }) {
  const sourcePath = `/urun/${slug}`;
  const { data } = useListRedirectsAdminQuery({ search: sourcePath }, { skip: isNew || !slug });
  const [upsert, { isLoading: saving }] = useUpsertRedirectsAdminMutation();
  const [remove, { isLoading: removing }] = useDeleteRedirectAdminMutation();
  const [target, setTarget] = useState("");

  if (isNew || !slug) {
    return (
      <div className="rounded-md border bg-muted/30 p-4 text-muted-foreground text-sm">
        Yönlendirme, ürün kaydedildikten sonra tanımlanabilir.
      </div>
    );
  }

  const existing = data?.items?.find((r) => r.sourcePath === sourcePath && r.isActive);

  async function apply(type: "301" | "410") {
    const targetUrl = type === "301" ? normalizeTarget(target) : null;
    if (type === "301" && !targetUrl) {
      toast.error("301 için hedef girin (ör. bugday ya da /urun/bugday).");
      return;
    }
    try {
      await upsert({ sourcePath, type, targetUrl }).unwrap();
      toast.success(type === "301" ? `301 yönlendirme tanımlandı → ${targetUrl}` : "Sayfa 410 (kaldırıldı) olarak işaretlendi.");
      setTarget("");
    } catch {
      toast.error("İşlem başarısız.");
    }
  }

  async function clear() {
    if (!existing) return;
    try {
      await remove(existing.id).unwrap();
      toast.success("Yönlendirme kaldırıldı; sayfa normale döndü.");
    } catch {
      toast.error("Kaldırılamadı.");
    }
  }

  return (
    <div className="rounded-md border p-4">
      <div className="mb-1 flex items-center gap-2 font-medium text-sm">
        <CornerUpRight className="h-4 w-4" />
        Yönlendirme / Kaldırma (301 · 410)
      </div>
      <p className="mb-3 text-muted-foreground text-xs">
        301 = sayfa kalıcı taşındı (SEO değeri hedefe aktarılır). 410 = sayfa kalıcı kaldırıldı (Google index’ten
        düşürür). İşlem <code className="rounded bg-muted px-1">{sourcePath}</code> yolunu etkiler.
      </p>

      {existing ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/30 p-3">
          <div className="flex items-center gap-2 text-sm">
            <Badge variant={existing.type === "410" ? "destructive" : "secondary"}>{existing.type}</Badge>
            {existing.type === "301" ? (
              <span>
                Şu an yönlendiriyor → <span className="font-medium">{existing.targetUrl}</span>
              </span>
            ) : (
              <span>Sayfa “kaldırıldı (410)” olarak işaretli.</span>
            )}
          </div>
          <Button size="sm" variant="outline" onClick={clear} disabled={removing}>
            <Trash2 className="mr-1.5 h-4 w-4" />
            Kaldır (normale döndür)
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[220px] flex-1">
              <label className="mb-1 block text-muted-foreground text-xs">301 hedefi (slug veya tam URL)</label>
              <Input placeholder="ör. bugday  ·  /fiyatlar  ·  https://…" value={target} onChange={(e) => setTarget(e.target.value)} />
            </div>
            <Button size="sm" onClick={() => apply("301")} disabled={saving}>
              <CornerUpRight className="mr-1.5 h-4 w-4" />
              301 Yönlendir
            </Button>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-md border border-destructive/30 p-2">
            <span className="text-muted-foreground text-xs">Ürün kalıcı kaldırıldıysa (artık satılmıyor/yok):</span>
            <Button size="sm" variant="destructive" onClick={() => apply("410")} disabled={saving}>
              <XOctagon className="mr-1.5 h-4 w-4" />
              410 — Kaldırıldı
            </Button>
          </div>
        </div>
      )}

      <p className="mt-3 text-muted-foreground text-xs">
        İpucu: 301/410 sonrası ürünü sitemap’ten çıkarmak için SEO sekmesinden “noindex” yapabilirsiniz (otomatik
        değiştirilmez).
      </p>
    </div>
  );
}
