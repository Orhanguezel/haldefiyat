export function isAutomatedAnalysis(report: object): boolean {
  return "source" in report && report.source === "auto";
}
