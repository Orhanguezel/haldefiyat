"use client";

import { useEffect } from "react";
import { trackAdConversion, type AdConversionEvent } from "@/lib/ad-conversions";

export function AdConversionTracker({ eventType, entityType, entityId }: {
  eventType: AdConversionEvent;
  entityType: "listing" | "firm" | "product";
  entityId: string | number;
}) {
  useEffect(() => trackAdConversion(eventType, entityType, entityId), [eventType, entityType, entityId]);
  return null;
}

export function TrackedAdLink({ eventType, entityType, entityId, ...props }: React.ComponentProps<"a"> & {
  eventType: AdConversionEvent;
  entityType: "listing" | "firm" | "product";
  entityId: string | number;
}) {
  return <a {...props} onClick={(event) => {
    trackAdConversion(eventType, entityType, entityId);
    props.onClick?.(event);
  }} />;
}
