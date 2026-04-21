import type { Metadata } from 'next';

import { ComingSoon } from './coming-soon';
import tr from '@/locale/tr';

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  title: tr.admin.comingSoon.badge,
};

export default async function Page({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const rawModule = params.module;
  const moduleName = Array.isArray(rawModule) ? rawModule[0] : rawModule;
  return <ComingSoon moduleName={moduleName} />;
}
