"use client";

import { useEffect } from "react";
import { trackDiscoveryEvent } from "@/lib/analytics";

export default function PriceViewTracker({
  productSlug,
  marketCount,
  sourceCount,
}: {
  productSlug: string;
  marketCount: number;
  sourceCount: number;
}) {
  useEffect(() => {
    trackDiscoveryEvent("price_viewed", {
      product_slug: productSlug,
      market_count: marketCount,
      source_count: sourceCount,
    });
  }, [marketCount, productSlug, sourceCount]);

  return null;
}
