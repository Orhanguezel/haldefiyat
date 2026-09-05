'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, Save } from 'lucide-react';
import { toast } from 'sonner';

import { AdminImageUploadField } from '@/components/common/admin-image-upload-field';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { AuthorAdmin } from '@/integrations/endpoints/authors-admin-endpoints';
import {
  useCreateAuthorAdminMutation,
  useGetAuthorAdminQuery,
  useUpdateAuthorAdminMutation,
} from '@/integrations/hooks';
import { BASE_URL } from '@/integrations/api-base';
import { useAdminT } from '@/app/(main)/admin/_components/common/use-admin-t';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? BASE_URL.replace(/\/api\/v1\/?$/, '')).replace(/\/$/, '');

type AuthorForm = {
  slug: string;
  fullName: string;
  title: string;
  bio: string;
  expertise: string;
  avatarUrl: string;
  credentials: string;
  email: string;
  website: string;
  linkedin: string;
  instagram: string;
  x: string;
  youtube: string;
  facebook: string;
  isActive: boolean;
  displayOrder: string;
};

const emptyForm: AuthorForm = {
  slug: '',
  fullName: '',
  title: '',
  bio: '',
  expertise: '',
  avatarUrl: '',
  credentials: '',
  email: '',
  website: '',
  linkedin: '',
  instagram: '',
  x: '',
  youtube: '',
  facebook: '',
  isActive: true,
  displayOrder: '100',
};

function slugify(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function toForm(author: AuthorAdmin): AuthorForm {
  return {
    slug: author.slug,
    fullName: author.fullName,
    title: author.title ?? '',
    bio: author.bio ?? '',
    expertise: author.expertise.join(', '),
    avatarUrl: author.avatarUrl ?? '',
    credentials: author.credentials ?? '',
    email: author.email ?? '',
    website: author.socialLinks.website ?? '',
    linkedin: author.socialLinks.linkedin ?? '',
    instagram: author.socialLinks.instagram ?? '',
    x: author.socialLinks.x ?? '',
    youtube: author.socialLinks.youtube ?? '',
    facebook: author.socialLinks.facebook ?? '',
    isActive: author.isActive,
    displayOrder: String(author.displayOrder),
  };
}

function splitCsv(value: string): string[] {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function socialLinksFromForm(form: AuthorForm): Record<string, string> {
  return Object.fromEntries(
    Object.entries({
      website: form.website,
      linkedin: form.linkedin,
      instagram: form.instagram,
      x: form.x,
      youtube: form.youtube,
      facebook: form.facebook,
    }).filter(([, value]) => value.trim()),
  );
}

export function AuthorDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const t = useAdminT('admin.authors.detail');
  const tc = useAdminT('admin.common');
  const isNew = id === 'new';
  const { data: author, isFetching } = useGetAuthorAdminQuery({ id }, { skip: isNew });
  const [createAuthor, { isLoading: isCreating }] = useCreateAuthorAdminMutation();
  const [updateAuthor, { isLoading: isUpdating }] = useUpdateAuthorAdminMutation();
  const [form, setForm] = useState<AuthorForm>(emptyForm);
  const initializedRef = useRef<string | null>(null);

  useEffect(() => {
    if (isNew) {
      initializedRef.current = 'new';
      setForm(emptyForm);
      return;
    }
    if (!author) return;
    const key = `${author.id}-${author.updatedAt ?? ''}`;
    if (initializedRef.current === key) return;
    initializedRef.current = key;
    setForm(toForm(author));
  }, [author, isNew]);

  const isSaving = isCreating || isUpdating;
  const publicUrl = form.slug ? `${SITE_URL}/yazar/${form.slug}` : '';

  async function handleSave() {
    if (!form.fullName.trim()) {
      toast.error(t('toasts.nameRequired'));
      return;
    }

    const payload = {
      slug: form.slug || slugify(form.fullName),
      fullName: form.fullName,
      title: form.title || null,
      bio: form.bio || null,
      expertise: splitCsv(form.expertise),
      avatarUrl: form.avatarUrl || null,
      credentials: form.credentials || null,
      socialLinks: socialLinksFromForm(form),
      email: form.email || null,
      isActive: form.isActive,
      displayOrder: Number(form.displayOrder) || 100,
    };

    try {
      if (isNew) {
        const result = await createAuthor(payload).unwrap();
        toast.success(t('toasts.created'));
        router.replace(`/admin/authors/${result.data.id}`);
      } else if (author) {
        await updateAuthor({ id: author.id, patch: payload }).unwrap();
        toast.success(t('toasts.updated'));
      }
    } catch (error) {
      const e = error as { data?: { error?: { message?: string } | string }; message?: string };
      const msg = typeof e.data?.error === 'string' ? e.data.error : e.data?.error?.message;
      toast.error(msg || e.message || tc('saveFailed'));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/admin/authors')}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            {t('back')}
          </Button>
          <div>
            <h1 className="font-semibold text-lg">{isNew ? t('newTitle') : t('editTitle')}</h1>
            <p className="text-muted-foreground text-xs">
              {isNew ? t('newHint') : isFetching ? t('refreshing') : `/yazar/${form.slug}`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" asChild disabled={!publicUrl}>
            <a href={publicUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-1.5 h-4 w-4" />
              {tc('openPage')}
            </a>
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            <Save className="mr-1.5 h-4 w-4" />
            {isSaving ? tc('saving') : tc('save')}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('profile.title')}</CardTitle>
            <CardDescription>{t('profile.hint')}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="author-name">{t('fields.fullName')}</Label>
              <Input
                id="author-name"
                value={form.fullName}
                onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
                onBlur={() => setForm((prev) => (prev.slug ? prev : { ...prev, slug: slugify(prev.fullName) }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author-slug">Slug</Label>
              <Input
                id="author-slug"
                value={form.slug}
                onChange={(event) => setForm((prev) => ({ ...prev, slug: slugify(event.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author-title">{t('fields.title')}</Label>
              <Input id="author-title" value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author-email">{t('fields.email')}</Label>
              <Input id="author-email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="author-bio">{t('fields.bio')}</Label>
              <Textarea id="author-bio" className="min-h-32" value={form.bio} onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="author-expertise">{t('fields.expertise')}</Label>
              <Input id="author-expertise" value={form.expertise} onChange={(event) => setForm((prev) => ({ ...prev, expertise: event.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="author-credentials">{t('fields.credentials')}</Label>
              <Input id="author-credentials" value={form.credentials} onChange={(event) => setForm((prev) => ({ ...prev, credentials: event.target.value }))} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('visual.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AdminImageUploadField
              label={t('visual.avatar')}
              value={form.avatarUrl}
              onChange={(url) => setForm((prev) => ({ ...prev, avatarUrl: url }))}
              folder="uploads/authors"
              previewAspect="1x1"
              previewObjectFit="cover"
            />
            <div className="space-y-2">
              <Label htmlFor="author-order">{t('fields.order')}</Label>
              <Input id="author-order" value={form.displayOrder} onChange={(event) => setForm((prev) => ({ ...prev, displayOrder: event.target.value }))} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="author-active">{t('fields.active')}</Label>
              <Switch id="author-active" checked={form.isActive} onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isActive: checked }))} />
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t('social.title')}</CardTitle>
            <CardDescription>{t('social.hint')}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="author-website">{t('fields.website')}</Label><Input id="author-website" value={form.website} onChange={(event) => setForm((prev) => ({ ...prev, website: event.target.value }))} /></div>
            <div className="space-y-2"><Label htmlFor="author-linkedin">LinkedIn</Label><Input id="author-linkedin" value={form.linkedin} onChange={(event) => setForm((prev) => ({ ...prev, linkedin: event.target.value }))} /></div>
            <div className="space-y-2"><Label htmlFor="author-instagram">Instagram</Label><Input id="author-instagram" value={form.instagram} onChange={(event) => setForm((prev) => ({ ...prev, instagram: event.target.value }))} /></div>
            <div className="space-y-2"><Label htmlFor="author-x">X / Twitter</Label><Input id="author-x" value={form.x} onChange={(event) => setForm((prev) => ({ ...prev, x: event.target.value }))} /></div>
            <div className="space-y-2"><Label htmlFor="author-youtube">YouTube</Label><Input id="author-youtube" value={form.youtube} onChange={(event) => setForm((prev) => ({ ...prev, youtube: event.target.value }))} /></div>
            <div className="space-y-2"><Label htmlFor="author-facebook">Facebook</Label><Input id="author-facebook" value={form.facebook} onChange={(event) => setForm((prev) => ({ ...prev, facebook: event.target.value }))} /></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
