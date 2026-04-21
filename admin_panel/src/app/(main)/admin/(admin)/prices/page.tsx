import PricesPage from './prices';

interface Props {
  searchParams: Promise<{ product?: string; market?: string; city?: string; category?: string; range?: string }>;
}

export default async function Page({ searchParams }: Props) {
  const params = await searchParams;
  return <PricesPage initialFilters={params} />;
}
