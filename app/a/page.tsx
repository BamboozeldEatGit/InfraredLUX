import { CatalogPageClient } from "@/components/catalog/catalog-page-client";

const GAME_CATEGORIES = ["all", "android", "2P", "sports", "flash", "emu", "local"];

export default function GamesPage() {
  return (
    <CatalogPageClient
      categoryOptions={GAME_CATEGORIES}
      dataPath="/assets/json/g.json"
      pinStorageKey="Gpinned"
      title="Games"
    />
  );
}
