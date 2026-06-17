import PricesPage from './prices';

interface Props {
  searchParams: Promise<{ q?: string; product?: string; market?: string; city?: string; category?: string; range?: string }>;
}

export default async function Page({ searchParams }: Props) {
  const params = await searchParams;
  const { product, ...rest } = params;
  return <PricesPage initialFilters={{ ...rest, q: params.q ?? product }} />;
}
