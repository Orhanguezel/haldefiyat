import PriceDetailClient from '../_components/price-detail-client';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <PriceDetailClient id={id} />;
}
