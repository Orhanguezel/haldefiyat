"use client";

import { useEffect } from "react";
import { captureAttribution } from "@/lib/attribution";

export function AttributionProvider() {
  useEffect(() => {
    captureAttribution();
  }, []);

  return null;
}
