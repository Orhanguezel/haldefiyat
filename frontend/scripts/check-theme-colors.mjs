import { execFileSync } from "node:child_process";

const allowed = [
  /^src\/app\/og\//,
  /^src\/app\/\[locale\]\/\(widget\)\//,
  /^src\/components\/ads\//,
  /^src\/lib\/og-brand\.tsx$/,
  /^src\/app\/(globals\.css|manifest\.ts|layout\.tsx|icon\.tsx|ad-preview\/page\.tsx)$/,
  /^src\/components\/auth\/AuthPanel\.tsx$/,
  /^src\/components\/sections\/SeasonCompare(?:Chart)?\.tsx$/,
  /^src\/proxy\.ts$/,
  /\.test\.(?:ts|tsx)$/,
];

const output = execFileSync("rg", [
  "-n",
  "--glob", "*.{tsx,ts,css}",
  "#[0-9a-fA-F]{3,8}\\b|rgb\\(|rgba\\(",
  "src",
], { encoding: "utf8" });

const violations = output.trim().split("\n").filter(Boolean).filter((line) => {
  const file = line.slice(0, line.indexOf(":"));
  if (allowed.some((pattern) => pattern.test(file))) return false;
  // Token tabanli rgba(var(--brand-rgb),...) sabit renk degildir.
  return !line.includes("rgba(var(--");
});

if (violations.length) {
  console.error("Tema renk kaynagi disinda hard-coded renk bulundu:\n" + violations.join("\n"));
  process.exit(1);
}

console.log(`Tema renk denetimi gecti; ${output.trim().split("\n").filter(Boolean).length} kontrollu/istisna kullanimi incelendi.`);
