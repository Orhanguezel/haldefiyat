"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { trackConversion, type ConversionEventName } from "@/lib/analytics";

type Props = {
  href: string;
  eventName: ConversionEventName;
  eventLabel: string;
  className?: string;
  children: ReactNode;
};

export default function TrackedConversionLink({
  href,
  eventName,
  eventLabel,
  className,
  children,
}: Props) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => trackConversion(eventName, { event_label: eventLabel })}
    >
      {children}
    </Link>
  );
}
