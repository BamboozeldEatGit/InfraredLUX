"use client";

import { useEffect, useState } from "react";

const SEARCH_ENGINES: Record<string, string> = {
  Google: "https://www.google.com/search?q=",
  Bing: "https://www.bing.com/search?q=",
  DuckDuckGo: "https://duckduckgo.com/?q=",
  Qwant: "https://www.qwant.com/?q=",
  Startpage: "https://www.startpage.com/search?q=",
  SearchEncrypt: "https://www.searchencrypt.com/search/?q=",
  Ecosia: "https://www.ecosia.org/search?q=",
};

export function SettingsPage() {
  const [engineName, setEngineName] = useState("Google");
  const [customEngine, setCustomEngine] = useState("");
  const [proxyMode, setProxyMode] = useState("uv");

  useEffect(() => {
    const storedEngine = localStorage.getItem("enginename");
    const storedUv = localStorage.getItem("uv");
    const storedDy = localStorage.getItem("dy");

    if (storedEngine) setEngineName(storedEngine);
    if (storedUv === "true") setProxyMode("uv");
    if (storedDy === "true") setProxyMode("dy");
  }, []);

  const saveEnginePreset = (value: string) => {
    setEngineName(value);
    localStorage.setItem("enginename", value);
    localStorage.setItem("engine", SEARCH_ENGINES[value] ?? SEARCH_ENGINES.Google);
  };

  const saveCustomEngine = () => {
    if (!customEngine.trim()) return;
    localStorage.setItem("enginename", "Custom");
    localStorage.setItem("engine", customEngine.trim());
    setEngineName("Custom");
    setCustomEngine("");
  };

  const saveProxy = (value: string) => {
    setProxyMode(value);
    if (value === "dy") {
      localStorage.setItem("uv", "false");
      localStorage.setItem("dy", "true");
      return;
    }
    localStorage.setItem("uv", "true");
    localStorage.setItem("dy", "false");
  };

  return (
    <main className="settings-root settings-shell">
      <aside className="settings-sidebar">
        <div className="settings-profile">
          <div className="settings-avatar">I</div>
          <div>
            <p className="settings-profile-name">Infrared User</p>
            <p className="settings-profile-plan">Turbo Plan</p>
          </div>
        </div>
        <input className="settings-search" placeholder="Search settings" type="text" />
        <nav className="settings-nav">
          <button className="settings-nav-item active" type="button">General</button>
          <button className="settings-nav-item" type="button">Tabs</button>
          <button className="settings-nav-item" type="button">Privacy</button>
          <button className="settings-nav-item" type="button">Advanced</button>
        </nav>
      </aside>

      <section className="settings-main">
        <h1 className="settings-title">General</h1>

        <section className="settings-section">
          <h2>Manage</h2>
          <article className="settings-row">
            <div>
              <h3>Search Engine</h3>
              <p>Configure how search queries are resolved.</p>
              <select value={engineName} onChange={e => saveEnginePreset(e.target.value)}>
                {Object.keys(SEARCH_ENGINES).map(name => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
                <option value="Custom">Custom</option>
              </select>
            </div>
            <button className="settings-action-btn" type="button">Open</button>
          </article>

          <article className="settings-row">
            <div>
              <h3>Custom Engine URL</h3>
              <p>Use a custom search endpoint (must include query param).</p>
              <div className="settings-inline">
                <input
                  placeholder="https://example.com/search?q="
                  type="text"
                  value={customEngine}
                  onChange={e => setCustomEngine(e.target.value)}
                />
                <button onClick={saveCustomEngine} type="button">
                  Save
                </button>
              </div>
            </div>
          </article>
        </section>

        <section className="settings-section">
          <h2>Preferences</h2>
          <article className="settings-row">
            <div>
              <h3>Proxy Mode</h3>
              <p>Switch between Infrared Turbo and Dynamic routing.</p>
              <select value={proxyMode} onChange={e => saveProxy(e.target.value)}>
                <option value="uv">Infrared Turbo (UV)</option>
                <option value="dy">Dynamic</option>
              </select>
            </div>
            <button className="settings-action-btn" type="button">Apply</button>
          </article>
        </section>
      </section>
    </main>
  );
}
