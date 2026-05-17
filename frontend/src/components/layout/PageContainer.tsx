import type { ReactNode } from "react";

/**
 * Tüm public sayfalar için merkezi wrapper.
 * Standart genişlik (1400px) ve responsive padding tek yerde tanımlı.
 *
 * Referans: /hal sayfası — `mx-auto max-w-[1400px] px-8 py-12`.
 * Padding mobile-first: px-4 (mobile) → sm:px-6 → lg:px-8.
 *
 * Kullanım:
 *   <PageContainer>...sayfa içeriği...</PageContainer>
 *
 * Özel durumlar:
 *   - `as="div"` → main yerine div render (zaten parent main varsa)
 *   - `wide={false}` → max-w yerine narrow (örn. metin ağırlıklı sayfa)
 *   - `className` → ek class (boşluk vb.)
 */
interface PageContainerProps {
  children: ReactNode;
  as?: "main" | "div" | "section";
  /** false ise max-w-[1100px] (uzun metin için) — default true (1400px) */
  wide?: boolean;
  /** Y padding tier — default "md" (py-12). "sm" = py-8, "lg" = py-16 */
  py?: "sm" | "md" | "lg" | "none";
  className?: string;
}

export default function PageContainer({
  children,
  as: Tag = "main",
  wide = true,
  py = "md",
  className = "",
}: PageContainerProps) {
  const widthCls = wide ? "max-w-[1400px]" : "max-w-[1100px]";
  const pyCls = {
    none: "",
    sm: "py-8",
    md: "py-12",
    lg: "py-16",
  }[py];
  const finalClass = `relative z-10 mx-auto ${widthCls} px-4 sm:px-6 lg:px-8 ${pyCls} ${className}`.trim();

  return <Tag className={finalClass}>{children}</Tag>;
}
