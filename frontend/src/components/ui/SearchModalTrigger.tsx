"use client";

import { useEffect, useState } from "react";
import SearchModal from "./SearchModal";

/**
 * Global search modal launcher.
 *
 * NEDEN: HeaderNavClient'a prop gecmek yerine DOM custom event kullaniyoruz.
 * Bu sayede sayfanin herhangi bir yerinden `document.dispatchEvent(new Event('open-search'))`
 * cagrilarak modal acilabilir (search input click, ⌘K, programatik openSearchModal()).
 */
export default function SearchModalTrigger() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function handleOpen() {
      setIsOpen(true);
    }
    document.addEventListener("open-search", handleOpen);
    return () => document.removeEventListener("open-search", handleOpen);
  }, []);

  return <SearchModal isOpen={isOpen} onClose={() => setIsOpen(false)} />;
}
