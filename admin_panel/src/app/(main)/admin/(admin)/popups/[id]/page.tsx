import PopupDetailClient from '../_components/popup-detail-client';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PopupDetailClient id={id} />;
}
