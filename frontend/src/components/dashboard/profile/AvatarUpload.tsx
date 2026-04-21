import { useRef, useState } from "react";
import { useProfile } from "@/lib/hooks/useProfile";
import { useAuthSession } from "@/components/providers/AuthSessionProvider";
import { useToast } from "@/components/providers/ToastProvider";

const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8088").replace(/\/$/, "") + "/api/v1";

export function AvatarUpload() {
  const { data, update } = useProfile();
  const { user } = useAuthSession();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const avatarSrc = previewUrl ?? data?.avatar_url ?? null;
  const initials = (user?.full_name ?? user?.email ?? "?").charAt(0).toUpperCase();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Dosya boyutu 2MB'den büyük olamaz.");
      return;
    }

    const prev = URL.createObjectURL(file);
    setPreviewUrl(prev);
    setUploading(true);

    try {
      const fd = new FormData();
      fd.append("file", file);

      const { getStoredAccessToken } = await import("@/lib/auth-token");
      const token = getStoredAccessToken();

      const res = await fetch(`${API_BASE}/storage/avatars/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });

      if (!res.ok) throw new Error("Yükleme başarısız");

      const uploadResult = await res.json();

      if (uploadResult.url) {
        await update({ avatar_url: uploadResult.url });
        toast.success("Profil fotoğrafınız güncellendi.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Fotoğraf yüklenemedi. Lütfen tekrar deneyin.");
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-8 rounded-2xl border border-(--color-border-soft) bg-(--color-surface) p-8 shadow-sm transition-all hover:shadow-md md:flex-row">
      <div className="relative">
        <div className="h-28 w-28 overflow-hidden rounded-3xl ring-4 ring-(--color-background) shadow-xl transition-all duration-300 group-hover:scale-[1.02]">
          {avatarSrc ? (
            <img src={avatarSrc} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-brand/10 font-display text-5xl font-bold text-brand">
              {initials}
            </div>
          )}
        </div>

        {uploading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-(--color-surface)/80 backdrop-blur-sm">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          </div>
        )}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="absolute -bottom-2 -right-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-brand text-white shadow-lg shadow-brand/40 transition-all hover:scale-110 active:scale-95 disabled:opacity-50"
        >
          <CameraIcon size={22} />
        </button>
      </div>

      <div className="flex-1 text-center md:text-left">
        <h3 className="text-xl font-bold text-(--color-foreground)">Profil Fotoğrafı</h3>
        <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-(--color-muted)">
          Fotoğrafınız platformun tüm alanlarında görünür olacaktır. En iyi sonuç için kare formatında bir resim yükleyin.
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2 md:justify-start">
          <span className="rounded-lg bg-(--color-bg-alt) px-2 py-1 text-[11px] font-bold text-(--color-muted) uppercase tracking-wider">JPG / PNG / WEBP</span>
          <span className="rounded-lg bg-(--color-bg-alt) px-2 py-1 text-[11px] font-bold text-(--color-muted) uppercase tracking-wider">MAX 2MB</span>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
      </div>
    </div>
  );
}

function CameraIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}
