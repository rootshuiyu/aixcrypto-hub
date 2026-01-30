"use client";

import { useEffect } from "react";
import { useLanguageStore } from "../../stores/language-store";

export function LanguageHydration() {
  const hydrate = useLanguageStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return null;
}
