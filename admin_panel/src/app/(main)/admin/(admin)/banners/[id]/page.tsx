import { BannerDetailClient } from '../_components/banner-detail-client';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <BannerDetailClient id={id} />;
}
