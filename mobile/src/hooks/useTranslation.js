import { useContext } from "react";

import { LocalizationContext } from "../context/LocalizationContext";

export function useTranslation() {
  const ctx = useContext(LocalizationContext);
  if (!ctx) {
    throw new Error("useTranslation must be used within a LocalizationProvider");
  }
  return ctx;
}
