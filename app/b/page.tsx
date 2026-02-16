import { CatalogPageClient } from "@/components/catalog/catalog-page-client";

const APP_CATEGORIES = [
  "all",
  "android",
  "social",
  "stream",
  "message",
  "media",
  "game",
  "cloud",
  "tool",
  "ai",
  "emu",
  "mail",
];

export default function AppsPage() {
  return (
    <CatalogPageClient
      categoryOptions={APP_CATEGORIES}
      dataPath="/assets/json/a.json"
      pinStorageKey="Apinned"
      title="Apps"
    />
  );
}
