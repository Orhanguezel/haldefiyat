'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminT } from '@/app/(main)/admin/_components/common/use-admin-t';
import SupportFaqsPanel from './_components/support-faqs-panel';
import SupportTicketsPanel from './_components/support-tickets-panel';

export default function SupportPage() {
  const t = useAdminT('admin.support');
  return (
    <div className="space-y-4">
      <div><h1 className="text-xl font-semibold">{t('header.title')}</h1><p className="text-sm text-muted-foreground">{t('header.description')}</p></div>
      <Tabs defaultValue="tickets" className="w-full">
        <TabsList><TabsTrigger value="tickets">{t('tabs.tickets')}</TabsTrigger><TabsTrigger value="faqs">{t('tabs.faqs')}</TabsTrigger></TabsList>
        <TabsContent value="tickets" className="mt-4"><SupportTicketsPanel /></TabsContent>
        <TabsContent value="faqs" className="mt-4"><SupportFaqsPanel /></TabsContent>
      </Tabs>
    </div>
  );
}
