"use client";

import { useEffect } from "react";
import { trackSeriesReturn } from "@/lib/analytics";
import { captureAttribution } from "@/lib/attribution";

export function AttributionProvider() {
  useEffect(() => {
    captureAttribution();
    trackSeriesReturn();
  }, []);

  return null;
}
