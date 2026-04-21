// Widget route group — sadece children render edilir.
// Header, footer, ambient background yok — iframe için temiz sayfa.
export default function WidgetLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
