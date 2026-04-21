"use client";

import { useRef, useState } from "react";
import { useProfile } from "@/lib/hooks/useProfile";
import { useAuthSession } from "@/components/providers/AuthSessionProvider";

const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8088").replace(/\/$/, "") + "/api/v1";

export function AvatarUpload() {
  const { data } = useProfile();
  const { user } = useAuthSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const avatarSrc = previewUrl ?? data?.avatar_url ?? null;
  const initials = (user?.full_name ?? user?.email ?? "?").charAt(0).toUpperCase();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { getStoredAccessToken } = await import("@/lib/auth-token");
      const token = getStoredAccessToken();
      await fetch(`${API_BASE}/storage/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-5 rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
      <div className="relative">
        {avatarSrc ? (
          <img src={avatarSrc} alt="Avatar" className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-(--color-brand)/15 font-(family-name:--font-display) text-2xl font-bold text-(--color-brand)">
            {initials}
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-(--color-background)/60">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-(--color-brand) border-t-transparent" />
          </div>
        )}
      </div>

      <div>
        <p className="text-[13px] font-medium text-(--color-foreground)">Profil Fotoğrafı</p>
        <p className="mt-0.5 text-[12px] text-(--color-muted)">JPG veya PNG, maks 2 MB</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-2 rounded-lg border border-(--color-border) px-3 py-1.5 text-[12px] font-medium text-(--color-foreground) hover:bg-(--color-border)/50 transition-colors"
        >
          Fotoğraf Değiştir
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
    </div>
  );
}
