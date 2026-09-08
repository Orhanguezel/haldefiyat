'use client';
import { BASE_URL } from '@/integrations/api-base';
import { useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { resolveMediaUrl } from '@/lib/media-url';

export function ReportCover({ src, alt, slug, published = false, className = '' }: { src?: string | null; alt: string; slug?: string; published?: boolean; className?: string }) {
  const custom = src && !src.includes('og-default') ? src : '';
  const url = custom ? (custom.startsWith('/') ? `${BASE_URL.replace(/\/api\/v1\/?$/, '')}${custom}` : resolveMediaUrl(custom)) : (published && slug ? `${BASE_URL.replace(/\/api\/v1\/?$/, '')}/og/analiz/${slug}` : '');
  const [failed, setFailed] = useState('');
  return <div className={`relative overflow-hidden rounded-xl border bg-white ${className}`}>
    {url && failed !== url ? <img src={url} alt={alt} loading="lazy" className="absolute inset-0 h-full w-full object-contain" onError={() => setFailed(url)} /> : <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-emerald-950 px-4 text-center text-emerald-50"><ImageIcon className="size-7 opacity-60" /><span className="text-xs">Kapak görseli ekleyin</span></div>}
  </div>;
}
