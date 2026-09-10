import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { MyListingsClient } from "@/components/listings/MyListingsClient";
export const dynamic = "force-dynamic";
export default async function MyListingPage({params}:{params:Promise<{locale:string;id:string}>}) {
 const {locale,id}=await params;setRequestLocale(locale);
 if(!/^\d+$/.test(id)||Number(id)<1)notFound();
 return <div className="space-y-4"><Link href="/hesabim/ilanlarim" className="inline-flex min-h-11 items-center text-sm underline">← İlanlarım</Link><h1 className="text-2xl font-bold">İlanım</h1><MyListingsClient listingId={Number(id)}/></div>;
}
