import { AuthorDetailClient } from '../_components/author-detail-client';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <AuthorDetailClient id={id} />;
}
