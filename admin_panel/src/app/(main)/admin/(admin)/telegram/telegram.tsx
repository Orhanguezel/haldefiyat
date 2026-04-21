// =============================================================
// FILE: src/app/(main)/admin/(admin)/telegram/telegram.tsx
// Admin Telegram Page (Settings + Inbound + AutoReply)
// =============================================================

'use client';

import * as React from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { toast } from 'sonner';

import { useAdminT } from '@/app/(main)/admin/_components/common/use-admin-t';
import { useTelegramTestMutation } from '@/integrations/hooks';

import TelegramSettingsPanel from './_components/telegram-settings-panel';
import TelegramInboundPanel from './_components/telegram-inbound-panel';
import TelegramAutoReplyPanel from './_components/telegram-auto-reply-panel';

export default function TelegramAdminPage() {
  const t = useAdminT('admin.telegram');
  const [telegramTest] = useTelegramTestMutation();
  const [isTesting, setIsTesting] = React.useState(false);

  const handleHeaderTest = async () => {
    setIsTesting(true);
    try {
      await telegramTest().unwrap();
      toast.success(t('settings.testSent'));
    } catch {
      toast.error(t('settings.testFailed'));
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base">{t('header.title')}</CardTitle>
            <CardDescription>{t('header.description')}</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleHeaderTest} disabled={isTesting}>
            <Send className="h-4 w-4 mr-2" />
            {isTesting ? t('settings.testSending') : t('header.test')}
          </Button>
        </CardHeader>
      </Card>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList>
          <TabsTrigger value="settings">{t('tabs.settings')}</TabsTrigger>
          <TabsTrigger value="autoreply">{t('tabs.autoreply')}</TabsTrigger>
          <TabsTrigger value="inbound">{t('tabs.inbound')}</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          <TelegramSettingsPanel />
        </TabsContent>

        <TabsContent value="autoreply" className="space-y-4">
          <TelegramAutoReplyPanel />
        </TabsContent>

        <TabsContent value="inbound" className="space-y-4">
          <TelegramInboundPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
