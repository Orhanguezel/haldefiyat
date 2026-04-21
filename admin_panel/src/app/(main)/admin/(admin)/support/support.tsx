'use client';

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminT } from '@/app/(main)/admin/_components/common/use-admin-t';
import SupportFaqsPanel from './_components/support-faqs-panel';
import SupportTicketsPanel from './_components/support-tickets-panel';

export default function SupportPage() {
  const t = useAdminT('admin.support');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('header.title')}</CardTitle>
          <CardDescription>{t('header.description')}</CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="faqs" className="w-full">
        <TabsList>
          <TabsTrigger value="faqs">{t('tabs.faqs')}</TabsTrigger>
          <TabsTrigger value="tickets">{t('tabs.tickets')}</TabsTrigger>
        </TabsList>
        <TabsContent value="faqs" className="space-y-4">
          <SupportFaqsPanel />
        </TabsContent>
        <TabsContent value="tickets" className="space-y-4">
          <SupportTicketsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
