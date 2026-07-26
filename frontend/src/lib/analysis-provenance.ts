export function isAutomatedAnalysis(report: object): boolean {
  return "source" in report && report.source === "auto";
}

export function hasVerifiedHumanReview(report: object): boolean {
  return (
    isAutomatedAnalysis(report) &&
    "reviewedAt" in report &&
    typeof report.reviewedAt === "string" &&
    report.reviewedAt.length > 0
  );
}
