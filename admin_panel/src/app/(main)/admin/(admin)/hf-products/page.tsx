"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { Edit, Plus, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useListHfProductsAdminQuery } from "@/integrations/hooks";

const ALL = "all";

function qualityVariant(score: number): "default" | "secondary" | "destructive" | "outline" {
  if (score >= 75) return "default";
  if (score >= 45) return "secondary";
  return "destructive";
}

export default function Page() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState(ALL);
  const [isActive, setIsActive] = useState(ALL);
  const [seoIndex, setSeoIndex] = useState(ALL);

  const query = {
    q: q.trim() || undefined,
    category: category === ALL ? undefined : category,
    isActive: isActive === ALL ? undefined : isActive === "active",
    seoIndex: seoIndex === ALL ? undefined : seoIndex === "index",
  };
  const { data, isLoading, isFetching } = useListHfProductsAdminQuery(query);
  const items = data?.items ?? [];
  const categories = useMemo(
    () => Array.from(new Set(items.map((item) => item.categorySlug).filter(Boolean))).sort(),
    [items],
  );
  const stats = useMemo(() => {
    const indexed = items.filter((item) => Boolean(item.seoIndex)).length;
    const active = items.filter((item) => Boolean(item.isActive)).length;
    const avgQuality = items.length
      ? Math.round(items.reduce((sum, item) => sum + Number(item.dataQuality ?? 0), 0) / items.length)
      : 0;
    return { indexed, active, avgQuality };
  }, [items]);

  return (
    <Card className="rounded-lg">
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Hal ürünleri</CardTitle>
            <p className="mt-1 text-muted-foreground text-sm">
              {items.length} ürün · {stats.active} aktif · {stats.indexed} index · ortalama kalite {stats.avgQuality}
            </p>
          </div>
          <Button asChild size="sm">
            <Link href="/admin/hf-products/new">
              <Plus className="mr-2 size-4" />
              Yeni ürün
            </Link>
          </Button>
        </div>
        <div className="grid gap-2 md:grid-cols-[minmax(220px,1fr)_180px_150px_150px]">
          <div className="relative">
            <Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Ad, slug veya görünen ad ara"
              value={q}
              onChange={(event) => setQ(event.target.value)}
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tüm kategoriler</SelectItem>
              {categories.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={isActive} onValueChange={setIsActive}>
            <SelectTrigger>
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tüm durumlar</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="passive">Pasif</SelectItem>
            </SelectContent>
          </Select>
          <Select value={seoIndex} onValueChange={setSeoIndex}>
            <SelectTrigger>
              <SelectValue placeholder="SEO" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Index + noindex</SelectItem>
              <SelectItem value="index">Index</SelectItem>
              <SelectItem value="noindex">Noindex</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ad</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Birim</TableHead>
              <TableHead>Kalite</TableHead>
              <TableHead>Arama</TableHead>
              <TableHead>SEO</TableHead>
              <TableHead className="w-24 text-right">İşlem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(isLoading || isFetching) && (
              <TableRow>
                <TableCell colSpan={8}>Yükleniyor...</TableCell>
              </TableRow>
            )}
            {!isLoading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={8}>Kayıt bulunamadı.</TableCell>
              </TableRow>
            )}
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Link className="text-primary" href={`/admin/hf-products/${item.id}`}>
                    {item.displayName || item.nameTr}
                  </Link>
                </TableCell>
                <TableCell>{item.slug}</TableCell>
                <TableCell>{item.categorySlug}</TableCell>
                <TableCell>{item.unit}</TableCell>
                <TableCell>
                  <Badge variant={qualityVariant(Number(item.dataQuality ?? 0))}>{item.dataQuality ?? 0}</Badge>
                </TableCell>
                <TableCell>{item.searchVolume ?? 0}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Badge variant={item.seoIndex ? "default" : "outline"}>{item.seoIndex ? "Index" : "Noindex"}</Badge>
                    {!item.isActive && <Badge variant="secondary">Pasif</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="ghost" size="icon">
                    <Link href={`/admin/hf-products/${item.id}`} aria-label="Düzenle">
                      <Edit className="size-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
