"use client";

import { useEffect, useState } from "react";
import type { Listing } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { ListingCard } from "./ListingCard";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8088").replace(/\/$/, "") + "/api/v1";

export function MyListingsClient() {
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch(`${API_BASE}/listings/me`, { credentials: "include" });
    const json = res.ok ? await res.json() as { items?: Listing[] } : {};
    setItems(json.items ?? []);
    setLoading(false);
  }

  async function close(id: number) {
    await fetch(`${API_BASE}/listings/${id}/close`, { method: "POST", credentials: "include" });
    await load();
  }

  useEffect(() => { void load(); }, []);

  if (loading) return <p className="text-sm text-(--color-muted)">İlanlar yükleniyor...</p>;

  return (
    <div className="grid gap-4">
      {items.map((item) => (
        <div key={item.id} className="grid gap-2">
          <ListingCard item={item} compact />
          <div className="flex items-center justify-between text-sm text-(--color-muted)">
            <span>Durum: {item.status}</span>
            {item.status !== "closed" ? <Button variant="secondary" size="sm" onClick={() => close(item.id)}>Kapat</Button> : null}
          </div>
        </div>
      ))}
      {!items.length ? <p className="text-sm text-(--color-muted)">Henüz ilanınız yok.</p> : null}
    </div>
  );
}
