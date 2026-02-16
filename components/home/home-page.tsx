"use client";

import { useEffect, useMemo, useState } from "react";
import type { Tip } from "@/lib/types";

const DEFAULT_SUBTITLE = "Using Interstellar to push boundary's of luxury at school";

export function HomePage() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [currentTip, setCurrentTip] = useState(DEFAULT_SUBTITLE);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch("/tips.json")
      .then(res => res.json())
      .then((data: Tip[]) => {
        if (!mounted || !Array.isArray(data) || data.length === 0) return;
        const first = data[Math.floor(Math.random() * data.length)];
        setTips(data);
        setCurrentTip(first.content);
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (tips.length === 0) return;

    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setCurrentTip(prev => {
          if (tips.length === 1) return tips[0].content;
          let next = tips[Math.floor(Math.random() * tips.length)].content;
          while (next === prev) {
            next = tips[Math.floor(Math.random() * tips.length)].content;
          }
          return next;
        });
        setFading(false);
      }, 450);
    }, 6500);

    return () => clearInterval(interval);
  }, [tips]);

  const subtitleClass = useMemo(
    () => `subtitle${fading ? " subtitle-fading" : ""}`,
    [fading],
  );

  return (
    <main className="home-root">
      <div className="wallpaper-blur" />
      <section className="home-shell">
        <div className="wallpaper" />
        <div className="main">
          <h1 className="title">INFRARED</h1>
          <p className={subtitleClass}>{currentTip}</p>
        </div>
      </section>
    </main>
  );
}
