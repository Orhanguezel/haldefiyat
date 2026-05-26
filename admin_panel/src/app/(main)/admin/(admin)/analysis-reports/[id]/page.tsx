import { AnalysisReportDetailClient } from '../_components/analysis-report-detail-client';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <AnalysisReportDetailClient id={id} />;
}
