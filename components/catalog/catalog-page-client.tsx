"use client";

import { useEffect, useMemo, useState } from "react";
import type { CatalogItem } from "@/lib/types";

type CatalogPageProps = {
  title: string;
  dataPath: string;
  pinStorageKey: string;
  categoryOptions: string[];
};

type CustomApp = {
  name: string;
  link: string;
  image: string;
  categories: string[];
};

function normalizeCategory(category: string) {
  return category.replaceAll(",", "").trim().toLowerCase();
}

function normalizeItem(item: CatalogItem): CatalogItem {
  return {
    ...item,
    categories: (item.categories ?? ["all"]).map(normalizeCategory),
  };
}

export function CatalogPageClient({
  title,
  dataPath,
  categoryOptions,
}: CatalogPageProps) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    fetch(dataPath)
      .then(res => res.json())
      .then((data: CatalogItem[]) => {
        const normalized = Array.isArray(data)
          ? data.map(normalizeItem).sort((a, b) => a.name.localeCompare(b.name))
          : [];
        setItems(normalized);
      })
      .catch(() => setItems([]));
  }, [dataPath]);

  const isLikelyUrl = (value: string) =>
    /^http(s?):\/\//.test(value) || (value.includes(".") && !value.startsWith(" "));

  const normalizeHttpUrl = (value: string) => {
    const trimmed = value.trim();
    if (!isLikelyUrl(trimmed)) return trimmed;
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
    return `https://${trimmed}`;
  };

  const pickLink = (item: CatalogItem) => {
    if (item.links?.length) {
      if (item.links.length === 1) return item.links[0].url;
      const options = item.links
        .map((link, index) => `${index + 1}: ${link.name}`)
        .join("\n");
      const selected = window.prompt(
        `Select a link by entering a number:\n${options}`,
        "1",
      );
      const selectedIndex = Number.parseInt(selected ?? "", 10) - 1;
      if (Number.isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= item.links.length) {
        return null;
      }
      return item.links[selectedIndex].url;
    }
    return item.link ?? null;
  };

  const openInTabs = (target: string) => {
    if (!target) return;
    if (target.startsWith("/e/") || target.startsWith("/")) {
      localStorage.setItem("InfraredPendingGoUrl", target);
      const opened = window.open("/d", "_blank");
      if (!opened) {
        sessionStorage.setItem("GoUrl", target);
        window.location.href = "/d";
      }
      return;
    }

    const normalized = normalizeHttpUrl(target);
    if (!isLikelyUrl(normalized)) return;
    localStorage.setItem("InfraredPendingRawUrl", normalized);
    const opened = window.open("/d", "_blank");
    if (!opened) {
      sessionStorage.setItem("GoUrlRaw", normalized);
      window.location.href = "/d";
    }
  };

  const openItem = (item: CatalogItem) => {
    if (item.custom) {
      const appName = window.prompt("Enter title for the app:");
      const appLink = window.prompt("Enter link for the app:");
      if (!appName || !appLink) return;

      const newApp: CustomApp = {
        name: `[Custom] ${appName}`,
        link: appLink,
        image: "/assets/media/icons/custom.webp",
        categories: ["all"],
      };

      setItems(prev => [newApp, ...prev]);
      return;
    }

    if (item.say) {
      alert(item.say);
    }

    const targetUrl = pickLink(item);
    if (!targetUrl) return;
    openInTabs(targetUrl);
  };

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();

    return items.filter(item => {
      const matchesName = item.name.toLowerCase().includes(normalizedQuery);
      const matchesCategory =
        category === "all" || item.categories.includes(normalizeCategory(category));
      return matchesName && matchesCategory;
    });
  }, [category, items, query]);

  return (
    <main className="catalog-root">
      <section className="catalog-header">
        <h1>{title}</h1>
        <div className="catalog-controls">
          <input
            aria-label="Search"
            placeholder="Search"
            type="text"
            value={query}
            onChange={event => setQuery(event.target.value)}
          />
          <select
            aria-label="Category"
            value={category}
            onChange={event => setCategory(event.target.value)}
          >
            {categoryOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="catalog-grid">
        {filteredItems.map(item => {
          const index = items.indexOf(item);
          return (
            <article key={`${item.name}-${index}`} className="catalog-card">
              <button
                className="catalog-open"
                onClick={() => openItem(item)}
                type="button"
              >
                {item.image ? <img alt={item.name} src={item.image} /> : null}
                <p>{item.name}</p>
              </button>
              <button className="pin-btn" onClick={() => openItem(item)} type="button">
                Open
              </button>
            </article>
          );
        })}
      </section>
    </main>
  );
}
