// Widget route group — sadece children render edilir.
// Header, footer, ambient background yok — iframe için temiz sayfa.
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function WidgetLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
