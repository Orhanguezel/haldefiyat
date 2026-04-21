import EmailTemplateDetailClient from "../_components/email-template-detail-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <EmailTemplateDetailClient id={id} />;
}
