// =============================================================
// FILE: src/app/page.tsx
// FINAL — Root -> Login redirect
// =============================================================
import { redirect } from 'next/navigation';

export default function Page() {
  redirect('/admin/auth/login');
}
