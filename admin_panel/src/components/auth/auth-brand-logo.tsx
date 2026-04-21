'use client';

import Image from 'next/image';
import { useAdminSettings } from '@/app/(main)/admin/_components/admin-settings-provider';
import { useSiteLogo } from '@/lib/use-site-logo';

const FALLBACK_URL = '/logo.png';
const FALLBACK_ALT = 'Hal Fiyatlari';

export function AuthBrandLogo({
  size = 96,
  alt,
}: {
  size?: number;
  alt?: string;
}) {
  const { branding } = useAdminSettings();
  const logo = useSiteLogo('site_logo');
  const fallbackUrl = branding?.media?.site_logo || FALLBACK_URL;
  const fallbackAlt = branding?.media?.site_logo_alt || branding?.app_name || FALLBACK_ALT;
  const url = logo?.url || fallbackUrl;
  const label = alt || logo?.alt || fallbackAlt;

  return (
    <Image
      src={url}
      alt={label}
      width={size * 4}
      height={size}
      priority
      unoptimized
      className="object-contain h-full w-auto mx-auto"
    />
  );
}
