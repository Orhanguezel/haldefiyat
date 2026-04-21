import CustomPageDetailClient from '../_components/custom-page-detail-client';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <CustomPageDetailClient id={id} />;
}
