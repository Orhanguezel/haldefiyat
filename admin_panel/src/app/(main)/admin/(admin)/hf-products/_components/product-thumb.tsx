"use client";

import { useEffect, useState } from "react";

import { BASE_URL } from "@/integrations/api-base";
import { useAdminT } from "../../../_components/common/use-admin-t";

// Site adresi API adresinden turetilir; marka/alan adi koda yazilmaz.
const SITE = BASE_URL.replace(/\/api\/v1\/?$/, "");
const MANIFEST_URL = `${SITE}/images/urunler/manifest.json`;

let manifestCache: Record<string, string> | null = null;
let manifestPromise: Promise<Record<string, string>> | null = null;

function loadManifest(): Promise<Record<string, string>> {
  if (manifestCache) return Promise.resolve(manifestCache);
  if (!manifestPromise) {
    manifestPromise = fetch(MANIFEST_URL)
      .then((res) => (res.ok ? res.json() : {}))
      .then((data: Record<string, string>) => {
        manifestCache = data;
        return data;
      })
      .catch(() => ({}) as Record<string, string>);
  }
  return manifestPromise;
}

// frontend/src/lib/product-images.ts'teki getProductImage ile birebir aynı mantık —
// veri kaynağı (manifest.json) tek, sadece bu küçük eşleştirme adımı iki uygulamada var.
function resolveImage(manifest: Record<string, string>, slug: string, canonicalSlug?: string | null): string | null {
  if (manifest[slug]) return manifest[slug]!;
  if (canonicalSlug && manifest[canonicalSlug]) return manifest[canonicalSlug]!;
  if (canonicalSlug) {
    const canonicalParts = canonicalSlug.split("-");
    for (let i = canonicalParts.length - 1; i >= 1; i--) {
      const prefix = canonicalParts.slice(0, i).join("-");
      if (manifest[prefix]) return manifest[prefix]!;
    }
  }
  const parts = slug.split("-");
  for (let i = parts.length - 1; i >= 1; i--) {
    const prefix = parts.slice(0, i).join("-");
    if (manifest[prefix]) return manifest[prefix]!;
  }
  return null;
}

export function useProductImage(slug: string, canonicalSlug?: string | null): string | null | undefined {
  const [path, setPath] = useState<string | null | undefined>(
    manifestCache ? resolveImage(manifestCache, slug, canonicalSlug) : undefined,
  );

  useEffect(() => {
    let cancelled = false;
    loadManifest().then((manifest) => {
      if (!cancelled) setPath(resolveImage(manifest, slug, canonicalSlug));
    });
    return () => {
      cancelled = true;
    };
  }, [slug, canonicalSlug]);

  return path;
}

export function ProductThumb({
  slug,
  name,
  imageUrl,
  canonicalSlug,
  size = 32,
}: {
  slug: string;
  name: string;
  imageUrl?: string | null;
  canonicalSlug?: string | null;
  size?: number;
}) {
  const manifestPath = useProductImage(slug, canonicalSlug);
  const t = useAdminT("admin.hf-products.thumb");
  const path = imageUrl || (manifestPath === undefined ? undefined : manifestPath ? manifestPath : null);

  if (path === undefined) {
    return <span className="inline-block shrink-0 rounded-md bg-muted" style={{ width: size, height: size }} />;
  }

  if (path === null) {
    return (
      <span
        className="flex shrink-0 items-center justify-center rounded-md border border-dashed text-[8px] text-muted-foreground"
        style={{ width: size, height: size }}
        title={t("noPhoto")}
      >
        {t("none")}
      </span>
    );
  }

  const src = path.startsWith("http") ? path : `${SITE}${path}`;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      className="shrink-0 rounded-md border object-cover"
      style={{ width: size, height: size }}
    />
  );
}
