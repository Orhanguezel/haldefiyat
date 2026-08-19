'use client';

import * as React from 'react';

// Admin paneline giren tarayıcıyı kalıcı işaretler: backend audit logger'ı
// hf_self=1 çerezli istekleri is_internal sayar, sahibin kendi gezinmesi
// (ev/mobil IP değişse bile) trafik analitiğini şişirmez. Panel haldefiyat.com/admin
// altında servis edildiğinden path=/ çerezi tüm siteyi kapsar.
export function SelfTrafficCookie() {
  React.useEffect(() => {
    try {
      document.cookie = 'hf_self=1; path=/; max-age=31536000; SameSite=Lax';
    } catch {
      // çerez yazılamazsa sessiz geç — analitik işareti opsiyonel
    }
  }, []);
  return null;
}
