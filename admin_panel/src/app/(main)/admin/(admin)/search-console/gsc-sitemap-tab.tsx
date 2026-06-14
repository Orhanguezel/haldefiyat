'use client';

import * as React from 'react';
import { Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useGscDeleteSitemapMutation, useGscSubmitSitemapMutation } from '@/integrations/hooks';
import { getErrorMessage, type GscSitemap } from '@/integrations/shared';

type T = (k: string) => string;

export function SitemapTab({ items, site, t }: { items: GscSitemap[]; site?: string; t: T }) {
  const [feedpath, setFeedpath] = React.useState('');
  const [submit, submitState] = useGscSubmitSitemapMutation();
  const [remove, removeState] = useGscDeleteSitemapMutation();

  const submitFeed = async () => {
    if (!feedpath.trim()) return;
    try {
      await submit({ feedpath: feedpath.trim(), site_url: site }).unwrap();
      setFeedpath('');
      toast.success(t('sm.submitted'));
    } catch (err) {
      toast.error(`${t('sm.failed')}: ${getErrorMessage(err)}`);
    }
  };

  const deleteFeed = async (path: string) => {
    try {
      await remove({ feedpath: path, site_url: site }).unwrap();
      toast.success(t('sm.deleted'));
    } catch (err) {
      toast.error(`${t('sm.failed')}: ${getErrorMessage(err)}`);
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">{t('sitemaps')}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Input value={feedpath} onChange={(e) => setFeedpath(e.target.value)} placeholder={t('sm.placeholder')} className="h-9" />
          <Button size="sm" onClick={submitFeed} disabled={!feedpath.trim() || submitState.isLoading}>
            <Send className="mr-2 h-4 w-4" />{t('sm.submit')}
          </Button>
        </div>
        <ul className="space-y-1 text-sm">
          {items.map((s) => (
            <li key={s.path} className="flex items-center justify-between gap-2 border-border/60 border-b py-1.5">
              <span className="truncate" title={s.path}>{s.path}</span>
              <span className="flex shrink-0 items-center gap-2">
                {s.errors > 0 ? <Badge variant="destructive">{s.errors} {t('sm.errors')}</Badge> : null}
                {s.warnings > 0 ? <Badge variant="secondary">{s.warnings} {t('sm.warnings')}</Badge> : null}
                {s.errors === 0 && s.warnings === 0 ? <Badge variant="default">{t('sm.ok')}</Badge> : null}
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={removeState.isLoading} onClick={() => deleteFeed(s.path)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </span>
            </li>
          ))}
          {items.length === 0 ? <li className="py-2 text-muted-foreground">{t('sm.empty')}</li> : null}
        </ul>
      </CardContent>
    </Card>
  );
}
