'use client';

import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import type {
  PressCampaign,
  PressContact,
  PressContactStatus,
  PressLogStatus,
  PressPublicationType,
} from '@/integrations/endpoints/admin/press-admin-endpoints';
import {
  useCreatePressCampaignAdminMutation,
  useCreatePressContactAdminMutation,
  useCreatePressLogAdminMutation,
  useGetPressSummaryAdminQuery,
  useImportPressContactsAdminMutation,
  useLazyExportPressContactsAdminQuery,
  useListEmailTemplatesAdminQuery,
  useListPublicAnalysisReportsForPressQuery,
  useListPressCampaignsAdminQuery,
  useListPressContactsAdminQuery,
  useListPressLogsAdminQuery,
} from '@/integrations/hooks';

type ContactForm = {
  organization: string;
  email: string;
  contactName: string;
  city: string;
  tags: string;
};

type CampaignForm = {
  name: string;
  subject: string;
  pitch: string;
  segmentTags: string;
};

const initialContact: ContactForm = {
  organization: '',
  email: '',
  contactName: '',
  city: '',
  tags: 'tarım, ekonomi',
};

const initialCampaign: CampaignForm = {
  name: 'HaldeFiyat Lansman Basın Bülteni',
  subject: 'HaldeFiyat: Türkiye geneli ücretsiz hal fiyat platformu yayında',
  pitch:
    'HaldeFiyat, Türkiye genelindeki resmi hal fiyatlarını günlük olarak derleyen ücretsiz ve bağımsız bir veri platformudur. Platform; üretici, tüccar, medya ve tüketiciler için şehir bazlı fiyat takibi, haftalık analiz ve API erişimi sunar.',
  segmentTags: 'tarım, ekonomi, hal fiyatları',
};

const csvSample = 'organization,email,contactName,city,tags,publicationType,notes\nDünya Gazetesi,editor@example.com,Editör,İstanbul,"tarım; ekonomi",newspaper,İlk lansman hedefi';
const publicBaseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://haldefiyat.com').replace(/\/$/, '');

const logStatusLabel: Record<PressLogStatus, string> = {
  planned: 'Planlandı',
  sent: 'Gönderildi',
  replied: 'Cevap',
  published: 'Yayınlandı',
  bounced: 'Döndü',
  rejected: 'Olumsuz',
};

const contactStatuses: Array<{ label: string; value: PressContactStatus | '' }> = [
  { label: 'Tüm durumlar', value: '' },
  { label: 'Hedef', value: 'target' },
  { label: 'Gönderildi', value: 'contacted' },
  { label: 'Cevap geldi', value: 'replied' },
  { label: 'Yayınlandı', value: 'published' },
  { label: 'Engelli', value: 'blocked' },
];

const publicationTypes: Array<{ label: string; value: PressPublicationType | '' }> = [
  { label: 'Tüm yayın tipleri', value: '' },
  { label: 'Gazete', value: 'newspaper' },
  { label: 'Web sitesi', value: 'website' },
  { label: 'Dernek', value: 'association' },
  { label: 'Oda/Birlik', value: 'chamber' },
  { label: 'Ajans', value: 'agency' },
  { label: 'Diğer', value: 'other' },
];

function splitTags(value: string): string[] {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  return value.slice(0, 10);
}

function contactMailto(contact: PressContact, campaign: PressCampaign | null): string {
  const subject = campaign?.subject ?? 'HaldeFiyat basın bilgilendirmesi';
  const body = campaign?.pitch ?? 'Merhaba, HaldeFiyat medya kiti ve güncel analizleri hakkında bilgi paylaşmak isteriz.';
  return `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function htmlToPlainText(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function renderTemplateText(value: string, vars: Record<string, string>): string {
  return value.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => vars[key] ?? '');
}

export default function Page() {
  const { data: summary } = useGetPressSummaryAdminQuery();
  const { data: emailTemplates = [] } = useListEmailTemplatesAdminQuery({ q: 'press_', is_active: true });
  const { data: latestReports } = useListPublicAnalysisReportsForPressQuery();
  const [contactSearch, setContactSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PressContactStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<PressPublicationType | ''>('');
  const { data: contactsData, isLoading: contactsLoading } = useListPressContactsAdminQuery({
    limit: 120,
    q: contactSearch || undefined,
    status: statusFilter || undefined,
    publicationType: typeFilter || undefined,
  });
  const { data: campaignsData, isLoading: campaignsLoading } = useListPressCampaignsAdminQuery({ limit: 40 });
  const [createContact, { isLoading: creatingContact }] = useCreatePressContactAdminMutation();
  const [importContacts, { isLoading: importingContacts }] = useImportPressContactsAdminMutation();
  const [exportContacts, { isLoading: exportingContacts }] = useLazyExportPressContactsAdminQuery();
  const [createCampaign, { isLoading: creatingCampaign }] = useCreatePressCampaignAdminMutation();
  const [createLog, { isLoading: creatingLog }] = useCreatePressLogAdminMutation();
  const [contactForm, setContactForm] = useState<ContactForm>(initialContact);
  const [campaignForm, setCampaignForm] = useState<CampaignForm>(initialCampaign);
  const [csvText, setCsvText] = useState(csvSample);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [publishedUrls, setPublishedUrls] = useState<Record<number, string>>({});

  const contacts = contactsData?.items ?? [];
  const campaigns = campaignsData?.items ?? [];
  const selectedCampaign = useMemo(
    () => campaigns.find((campaign) => campaign.id === selectedCampaignId) ?? campaigns[0] ?? null,
    [campaigns, selectedCampaignId],
  );
  const { data: logsData } = useListPressLogsAdminQuery(
    { campaignId: selectedCampaign?.id ?? 0 },
    { skip: !selectedCampaign },
  );
  const logs = logsData?.items ?? [];
  const pressTemplates = emailTemplates.filter((template) => template.template_key.startsWith('press_') || template.template_key.includes('release') || template.template_key.includes('story_pitch'));
  const latestReport = latestReports?.items?.[0] ?? null;
  const templateDefaults = useMemo<Record<string, string>>(() => ({
    press_url: `${publicBaseUrl}/basin`,
    analysis_url: latestReport ? `${publicBaseUrl}/analiz/${latestReport.slug}` : `${publicBaseUrl}/analiz`,
    api_docs_url: `${publicBaseUrl}/api-docs`,
    index_url: `${publicBaseUrl}/endeks`,
    report_url: latestReport ? `${publicBaseUrl}/analiz/${latestReport.slug}` : `${publicBaseUrl}/analiz`,
    week_title: latestReport?.baslik || 'Bu haftanın HaldeFiyat endeks görünümü',
  }), [latestReport]);

  function handleSelectTemplate(templateKey: string) {
    const template = pressTemplates.find((item) => item.template_key === templateKey);
    if (!template) return;
    const subject = renderTemplateText(template.subject || '', templateDefaults);
    const content = renderTemplateText(template.content || '', templateDefaults);
    setCampaignForm((prev) => ({
      ...prev,
      subject: subject || prev.subject,
      pitch: htmlToPlainText(content || prev.pitch),
    }));
  }

  async function handleCreateContact() {
    await createContact({
      organization: contactForm.organization,
      email: contactForm.email,
      contactName: contactForm.contactName || null,
      city: contactForm.city || null,
      tags: splitTags(contactForm.tags),
    }).unwrap();
    setContactForm(initialContact);
  }

  async function handleCreateCampaign() {
    const result = await createCampaign({
      name: campaignForm.name,
      subject: campaignForm.subject,
      pitch: campaignForm.pitch,
      segmentTags: splitTags(campaignForm.segmentTags),
      status: 'draft',
    }).unwrap();
    setSelectedCampaignId(result.data.id);
  }

  async function handleImportCsv() {
    const result = await importContacts({ csv: csvText }).unwrap();
    setImportMessage(`${result.imported} kayıt içe aktarıldı/güncellendi, ${result.skipped} satır atlandı.`);
  }

  async function handleExportCsv() {
    const blob = await exportContacts().unwrap();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `haldefiyat-press-contacts-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function handleLog(contact: PressContact, status: PressLogStatus) {
    if (!selectedCampaign) return;
    await createLog({
      campaignId: selectedCampaign.id,
      contactId: contact.id,
      channel: 'email',
      status,
      publishedUrl: status === 'published' ? publishedUrls[contact.id] || null : null,
      note: `${selectedCampaign.name} kampanyası için ${logStatusLabel[status]} olarak işlendi.`,
    }).unwrap();
    if (status === 'published') {
      setPublishedUrls((prev) => ({ ...prev, [contact.id]: '' }));
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Medya Kişileri</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{summary?.totals.contacts ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kampanyalar</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{summary?.totals.campaigns ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Yayın Linkleri</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{summary?.totals.publishedLinks ?? 0}</CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basın Kampanyaları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 md:grid-cols-2">
              <Input
                value={campaignForm.name}
                onChange={(event) => setCampaignForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Kampanya adı"
              />
              <Input
                value={campaignForm.subject}
                onChange={(event) => setCampaignForm((prev) => ({ ...prev, subject: event.target.value }))}
                placeholder="Mail konusu"
              />
              <Input
                className="md:col-span-2"
                value={campaignForm.segmentTags}
                onChange={(event) => setCampaignForm((prev) => ({ ...prev, segmentTags: event.target.value }))}
                placeholder="Segment etiketleri"
              />
              <select
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm md:col-span-2"
                onChange={(event) => handleSelectTemplate(event.target.value)}
                defaultValue=""
              >
                <option value="">Email şablonundan doldur</option>
                {pressTemplates.map((template) => (
                  <option key={template.id} value={template.template_key}>
                    {template.template_name || template.template_key}
                  </option>
                ))}
              </select>
              <Textarea
                className="min-h-28 md:col-span-2"
                value={campaignForm.pitch}
                onChange={(event) => setCampaignForm((prev) => ({ ...prev, pitch: event.target.value }))}
                placeholder="Basın bülteni kısa metni"
              />
              <Button className="md:col-span-2" onClick={handleCreateCampaign} disabled={creatingCampaign}>
                {creatingCampaign ? 'Oluşturuluyor...' : 'Kampanya Oluştur'}
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kampanya</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Etiket</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaignsLoading && (
                  <TableRow>
                    <TableCell colSpan={3}>Yükleniyor...</TableCell>
                  </TableRow>
                )}
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id} className={selectedCampaign?.id === campaign.id ? 'bg-muted/40' : undefined}>
                    <TableCell>
                      <button type="button" className="text-left font-medium hover:underline" onClick={() => setSelectedCampaignId(campaign.id)}>
                        {campaign.name}
                      </button>
                      <div className="mt-1 text-muted-foreground text-xs">{campaign.subject}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>{campaign.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {campaign.segmentTags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline">{tag}</Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Medya Kişisi Ekle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={contactForm.organization}
              onChange={(event) => setContactForm((prev) => ({ ...prev, organization: event.target.value }))}
              placeholder="Kurum"
            />
            <Input
              value={contactForm.email}
              onChange={(event) => setContactForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="E-posta"
            />
            <Input
              value={contactForm.contactName}
              onChange={(event) => setContactForm((prev) => ({ ...prev, contactName: event.target.value }))}
              placeholder="Kişi adı"
            />
            <Input
              value={contactForm.city}
              onChange={(event) => setContactForm((prev) => ({ ...prev, city: event.target.value }))}
              placeholder="Şehir"
            />
            <Input
              value={contactForm.tags}
              onChange={(event) => setContactForm((prev) => ({ ...prev, tags: event.target.value }))}
              placeholder="Etiketler"
            />
            <Button className="w-full" onClick={handleCreateContact} disabled={creatingContact}>
              {creatingContact ? 'Ekleniyor...' : 'Kişi Ekle'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">CSV İçe / Dışa Aktarım</CardTitle>
            <p className="mt-1 text-muted-foreground text-xs">
              Desteklenen başlıklar: organization, email, contactName, city, tags, publicationType, notes.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={handleExportCsv} disabled={exportingContacts}>
            {exportingContacts ? 'Hazırlanıyor...' : 'CSV İndir'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            className="min-h-32 font-mono text-xs"
            value={csvText}
            onChange={(event) => setCsvText(event.target.value)}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" onClick={handleImportCsv} disabled={importingContacts}>
              {importingContacts ? 'Aktarılıyor...' : 'CSV İçe Aktar'}
            </Button>
            {importMessage && <span className="text-muted-foreground text-sm">{importMessage}</span>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hedef Medya Listesi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px]">
            <Input
              value={contactSearch}
              onChange={(event) => setContactSearch(event.target.value)}
              placeholder="Kurum adına göre ara"
            />
            <select
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as PressContactStatus | '')}
            >
              {contactStatuses.map((status) => (
                <option key={status.value || 'all'} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
            <select
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as PressPublicationType | '')}
            >
              {publicationTypes.map((type) => (
                <option key={type.value || 'all'} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kurum</TableHead>
                <TableHead>E-posta</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Son Temas</TableHead>
                <TableHead>Yayın Linki</TableHead>
                <TableHead>İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contactsLoading && (
                <TableRow>
                  <TableCell colSpan={6}>Yükleniyor...</TableCell>
                </TableRow>
              )}
              {contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <div className="font-medium">{contact.organization}</div>
                    <div className="mt-1 text-muted-foreground text-xs">
                      {[contact.contactName, contact.city].filter(Boolean).join(' · ') || '—'}
                    </div>
                  </TableCell>
                  <TableCell>{contact.email}</TableCell>
                  <TableCell>
                    <Badge variant={contact.status === 'published' ? 'default' : 'secondary'}>{contact.status}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(contact.lastContactedAt)}</TableCell>
                  <TableCell>
                    <Input
                      className="min-w-56 text-xs"
                      value={publishedUrls[contact.id] ?? ''}
                      onChange={(event) => setPublishedUrls((prev) => ({ ...prev, [contact.id]: event.target.value }))}
                      placeholder="https://..."
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <a href={contactMailto(contact, selectedCampaign)}>Mail</a>
                      </Button>
                      <Button size="sm" variant="ghost" disabled={!selectedCampaign || creatingLog} onClick={() => handleLog(contact, 'sent')}>
                        Gönderildi
                      </Button>
                      <Button size="sm" variant="ghost" disabled={!selectedCampaign || creatingLog} onClick={() => handleLog(contact, 'replied')}>
                        Cevap
                      </Button>
                      <Button size="sm" variant="ghost" disabled={!selectedCampaign || creatingLog} onClick={() => handleLog(contact, 'published')}>
                        Yayın
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedCampaign && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{selectedCampaign.name} Temas Geçmişi</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kurum</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Not</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="font-medium">{log.organization}</div>
                      <div className="mt-1 text-muted-foreground text-xs">{log.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={log.status === 'published' ? 'default' : 'secondary'}>{logStatusLabel[log.status]}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(log.contactedAt)}</TableCell>
                    <TableCell className="max-w-xl text-muted-foreground text-sm">{log.note ?? '—'}</TableCell>
                  </TableRow>
                ))}
                {logs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4}>Bu kampanya için temas kaydı yok.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
