import { setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { Heart, MessageCircle, Repeat2, Eye, ExternalLink } from "lucide-react";
import { getPageMetadata, ORG_REF } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";
import Breadcrumb from "@/components/seo/Breadcrumb";
import PageContainer from "@/components/layout/PageContainer";
import { fetchSocialFeed, type SocialTweet } from "@/lib/api";

export const revalidate = 300;

type Props = { params: Promise<{ locale: string }> };

const HANDLE = "haldefiyat";
const PROFILE_URL = `https://twitter.com/${HANDLE}`;

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return getPageMetadata("sosyal", {
    locale,
    pathname: "/sosyal",
    title: "Sosyal Medya — @haldefiyat | HalDeFiyat",
    description:
      "HalDeFiyat'ın güncel sosyal medya paylaşımları: günlük hal fiyatı değişimleri, en çok artan ve ucuzlayan ürünler, piyasa içerikleri. @haldefiyat X (Twitter) akışı.",
  });
}

function formatDateTr(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

function compact(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}B`;
  return String(n);
}

function Metric({ icon: Icon, value }: { icon: typeof Heart; value: number }) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[13px] text-slate-500">
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {compact(value)}
    </span>
  );
}

function TweetCard({ t }: { t: SocialTweet }) {
  const date = formatDateTr(t.postedAt);
  return (
    <a
      href={t.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <span className="text-[14px] font-semibold text-emerald-700">@{HANDLE}</span>
        <ExternalLink className="h-4 w-4 text-slate-300 transition group-hover:text-emerald-500" aria-hidden />
      </div>
      <p className="whitespace-pre-line text-[15px] leading-relaxed text-slate-800">{t.text}</p>
      {t.mediaUrls.length > 0 && (
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-100">
          <Image src={t.mediaUrls[0]!} alt="" fill className="object-cover" sizes="(max-width:768px) 100vw, 33vw" unoptimized />
        </div>
      )}
      <div className="mt-auto flex items-center justify-between pt-1">
        {date && <time className="text-[13px] text-slate-400">{date}</time>}
        <div className="flex items-center gap-3">
          <Metric icon={Heart} value={t.likes} />
          <Metric icon={MessageCircle} value={t.comments} />
          <Metric icon={Repeat2} value={t.shares} />
          <Metric icon={Eye} value={t.impressions} />
        </div>
      </div>
    </a>
  );
}

export default async function SosyalPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tweets = await fetchSocialFeed(30);

  const collectionSchema = {
    name: "HalDeFiyat Sosyal Medya Akışı",
    description: "HalDeFiyat'ın @haldefiyat hesabından güncel hal fiyatı ve piyasa paylaşımları.",
    publisher: ORG_REF,
    url: "https://haldefiyat.com/sosyal",
  };

  return (
    <PageContainer>
      <JsonLd type="CollectionPage" data={collectionSchema} />
      <Breadcrumb items={[{ name: "Ana Sayfa", href: "/" }, { name: "Sosyal Medya", href: "/sosyal" }]} />

      <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Sosyal Medya</h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Günlük hal fiyatı değişimleri, en çok artan ve ucuzlayan ürünler ve piyasa içeriklerini
            <strong> @haldefiyat</strong> hesabından paylaşıyoruz.
          </p>
        </div>
        <a
          href={PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-slate-700"
        >
          X'te Takip Et
          <ExternalLink className="h-4 w-4" aria-hidden />
        </a>
      </header>

      {tweets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500">
          Paylaşımlar şu an yüklenemedi.{" "}
          <a href={PROFILE_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-emerald-700 underline">
            @{HANDLE}
          </a>{" "}
          hesabını ziyaret edebilirsiniz.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tweets.map((t) => (
            <TweetCard key={t.tweetId} t={t} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
