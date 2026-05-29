'use client';

import Link from 'next/link';
import { Edit, Plus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useListAuthorsAdminQuery } from '@/integrations/hooks';

export default function Page() {
  const { data, isLoading } = useListAuthorsAdminQuery({ active: 'all', limit: 500 });
  const authors = data?.items ?? [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Yazarlar</CardTitle>
            <CardDescription>Google News ve E-E-A-T için analiz yazılarına bağlanan yazar profilleri.</CardDescription>
          </div>
          <Button size="sm" asChild>
            <Link href="/admin/authors/new">
              <Plus className="mr-1.5 h-4 w-4" />
              Yeni Yazar
            </Link>
          </Button>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="pt-6">
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
                  <TableCell className="min-w-[320px]">
                    <Link href={`/admin/authors/${author.id}`} className="font-medium hover:underline">
                      {author.fullName}
                    </Link>
                    <div className="mt-1 text-muted-foreground text-xs">/yazar/{author.slug}</div>
                    {author.title && <div className="mt-1 text-sm">{author.title}</div>}
                  </TableCell>
                  <TableCell>
                    <div className="flex max-w-[420px] flex-wrap gap-1">
                      {author.expertise.slice(0, 6).map((item) => (
                        <Badge key={item} variant="outline">{item}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={author.isActive ? 'default' : 'secondary'}>{author.isActive ? 'Aktif' : 'Pasif'}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/admin/authors/${author.id}`}>
                          <Edit className="mr-1.5 h-4 w-4" />
                          Düzenle
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
