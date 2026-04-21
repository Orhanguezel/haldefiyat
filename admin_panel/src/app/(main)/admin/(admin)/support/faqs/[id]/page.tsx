import SupportFaqDetailClient from "../../_components/support-faq-detail-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <SupportFaqDetailClient id={id} />;
}
