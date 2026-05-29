'use client';

import { useState } from 'react';
import { Save, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

import { AdminImageUploadField } from '@/components/common/admin-image-upload-field';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import type { AuthorAdmin } from '@/integrations/endpoints/authors-admin-endpoints';
import {
  useCreateAuthorAdminMutation,
  useListAuthorsAdminQuery,
  useUpdateAuthorAdminMutation,
} from '@/integrations/hooks';

type AuthorForm = {
  id?: number;
  slug: string;
  fullName: string;
  title: string;
  bio: string;
  expertise: string;
  avatarUrl: string;
  credentials: string;
  email: string;
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
    id: author.id,
    slug: author.slug,
    fullName: author.fullName,
    title: author.title ?? '',
    bio: author.bio ?? '',
    expertise: author.expertise.join(', '),
    avatarUrl: author.avatarUrl ?? '',
    credentials: author.credentials ?? '',
    email: author.email ?? '',
    isActive: author.isActive,
    displayOrder: String(author.displayOrder),
  };
}

function splitCsv(value: string): string[] {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

export default function Page() {
  const { data, isLoading, refetch } = useListAuthorsAdminQuery({ active: 'all', limit: 500 });
  const [createAuthor, { isLoading: isCreating }] = useCreateAuthorAdminMutation();
  const [updateAuthor, { isLoading: isUpdating }] = useUpdateAuthorAdminMutation();
  const [form, setForm] = useState<AuthorForm>(emptyForm);

  const authors = data?.items ?? [];
  const isSaving = isCreating || isUpdating;

  async function handleSave() {
    if (!form.fullName.trim()) {
      toast.error('Yazar adı zorunlu.');
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
      email: form.email || null,
      isActive: form.isActive,
      displayOrder: Number(form.displayOrder) || 100,
    };

    if (form.id) {
      await updateAuthor({ id: form.id, patch: payload }).unwrap();
      toast.success('Yazar güncellendi');
    } else {
      await createAuthor(payload).unwrap();
      toast.success('Yazar oluşturuldu');
    }

    setForm(emptyForm);
    await refetch();
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Yazar Profilleri</CardTitle>
          <CardDescription>Google News ve E-E-A-T için analiz yazılarına bağlanan isimli yazarlar.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Yazar</TableHead>
                <TableHead>Uzmanlık</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={4}>Yükleniyor...</TableCell>
                </TableRow>
              )}
              {!isLoading && authors.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4}>Henüz yazar yok.</TableCell>
                </TableRow>
              )}
              {authors.map((author) => (
                <TableRow key={author.id}>
                  <TableCell className="min-w-[260px]">
                    <div className="font-medium">{author.fullName}</div>
                    <div className="text-muted-foreground text-xs">/yazar/{author.slug}</div>
                    {author.title && <div className="mt-1 text-sm">{author.title}</div>}
                  </TableCell>
                  <TableCell>
                    <div className="flex max-w-[360px] flex-wrap gap-1">
                      {author.expertise.slice(0, 5).map((item) => (
                        <Badge key={item} variant="outline">{item}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={author.isActive ? 'default' : 'secondary'}>{author.isActive ? 'Aktif' : 'Pasif'}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => setForm(toForm(author))}>
                      Düzenle
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="h-4 w-4" />
            {form.id ? 'Yazarı Düzenle' : 'Yeni Yazar'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="author-name">Ad Soyad</Label>
            <Input
              id="author-name"
              value={form.fullName}
              onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
              onBlur={() => setForm((prev) => (prev.slug ? prev : { ...prev, slug: slugify(prev.fullName) }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="author-slug">Slug</Label>
            <Input
              id="author-slug"
              value={form.slug}
              onChange={(event) => setForm((prev) => ({ ...prev, slug: slugify(event.target.value) }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="author-title">Ünvan</Label>
            <Input id="author-title" value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="author-bio">Biyografi</Label>
            <Textarea id="author-bio" className="min-h-28" value={form.bio} onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="author-expertise">Uzmanlıklar</Label>
            <Input id="author-expertise" value={form.expertise} onChange={(event) => setForm((prev) => ({ ...prev, expertise: event.target.value }))} />
          </div>
          <AdminImageUploadField
            label="Profil görseli"
            value={form.avatarUrl}
            onChange={(url) => setForm((prev) => ({ ...prev, avatarUrl: url }))}
            folder="uploads/authors"
            previewAspect="1x1"
            previewObjectFit="cover"
          />
          <div className="grid gap-2">
            <Label htmlFor="author-credentials">Yetkinlik / deneyim</Label>
            <Input id="author-credentials" value={form.credentials} onChange={(event) => setForm((prev) => ({ ...prev, credentials: event.target.value }))} />
          </div>
          <div className="grid grid-cols-[1fr_120px] gap-3">
            <div className="grid gap-2">
              <Label htmlFor="author-email">E-posta</Label>
              <Input id="author-email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="author-order">Sıra</Label>
              <Input id="author-order" value={form.displayOrder} onChange={(event) => setForm((prev) => ({ ...prev, displayOrder: event.target.value }))} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
            />
            Aktif
          </label>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="mr-1.5 h-4 w-4" />
              {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
            {form.id && (
              <Button variant="outline" onClick={() => setForm(emptyForm)}>
                Yeni kayıt
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
