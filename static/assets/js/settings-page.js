document.addEventListener("DOMContentLoaded", () => {
  const motion = window.Motion;
  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  const tabButtons = Array.from(document.querySelectorAll("[data-settings-tab]"));
  const panels = Array.from(document.querySelectorAll("[data-settings-panel]"));
  const panelMap = new Map(panels.map(panel => [panel.dataset.settingsPanel, panel]));

  const engineSelect = document.getElementById("engine");
  const engineInput = document.getElementById("engine-form");
  const saveEngineButton = document.getElementById("save-engine");
  const proxySelect = document.getElementById("pChange");
  const exportButton = document.getElementById("export-save");
  const importButton = document.getElementById("import-save");

  function animateTargets(targets, keyframes, options) {
    if (!motion?.animate || prefersReducedMotion || !targets.length) {
      return null;
    }

    return motion.animate(targets, keyframes, options);
  }

  function getPanelItems(panel) {
    return Array.from(panel.querySelectorAll("[data-animate-item]"));
  }

  function animatePageIn() {
    const sidebarTargets = Array.from(document.querySelectorAll(".settings-topbar, .settings-sidebar"));
    const activePanel = document.querySelector(".settings-panel.is-active");
    const panelTargets = activePanel ? getPanelItems(activePanel) : [];

    animateTargets(
      sidebarTargets,
      { opacity: [0, 1], x: [-18, 0], filter: ["blur(8px)", "blur(0px)"] },
      { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
    );

    animateTargets(
      panelTargets,
      { opacity: [0, 1], y: [18, 0], filter: ["blur(10px)", "blur(0px)"] },
      {
        delay: motion?.stagger ? motion.stagger(0.05, { startDelay: 0.08 }) : 0,
        duration: 0.42,
        ease: [0.22, 1, 0.36, 1],
      },
    );
  }

  function setTabState(activeId) {
    tabButtons.forEach(button => {
      const isActive = button.dataset.settingsTab === activeId;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", String(isActive));
    });
  }

  function showPanel(panelId, immediate = false) {
    const nextPanel = panelMap.get(panelId);
    const currentPanel = document.querySelector(".settings-panel.is-active");

    if (!nextPanel || nextPanel === currentPanel) {
      setTabState(panelId);
      return;
    }

    setTabState(panelId);

    if (!motion?.animate || prefersReducedMotion || immediate || !currentPanel) {
      currentPanel?.classList.remove("is-active");
      if (currentPanel) {
        currentPanel.hidden = true;
      }
      nextPanel.hidden = false;
      nextPanel.classList.add("is-active");
      animateTargets(
        getPanelItems(nextPanel),
        { opacity: [0, 1], y: [14, 0] },
        {
          delay: motion?.stagger ? motion.stagger(0.04) : 0,
          duration: 0.28,
          ease: [0.22, 1, 0.36, 1],
        },
      );
      return;
    }

    motion.animate(
      currentPanel,
      { opacity: [1, 0], x: [0, -18] },
      { duration: 0.18, ease: [0.4, 0, 1, 1] },
    );

    window.setTimeout(() => {
      currentPanel.hidden = true;
      currentPanel.classList.remove("is-active");

      nextPanel.hidden = false;
      nextPanel.classList.add("is-active");

      motion.animate(
        nextPanel,
        { opacity: [0, 1], x: [18, 0] },
        { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
      );

      animateTargets(
        getPanelItems(nextPanel),
        { opacity: [0, 1], y: [14, 0], filter: ["blur(8px)", "blur(0px)"] },
        {
          delay: motion.stagger(0.04, { startDelay: 0.04 }),
          duration: 0.32,
          ease: [0.22, 1, 0.36, 1],
        },
      );
    }, 170);
  }

  const engineUrls = {
    Google: "https://www.google.com/search?q=",
    Bing: "https://www.bing.com/search?q=",
    DuckDuckGo: "https://duckduckgo.com/?q=",
    Qwant: "https://www.qwant.com/?q=",
    Startpage: "https://www.startpage.com/search?q=",
    SearchEncrypt: "https://www.searchencrypt.com/search/?q=",
    Ecosia: "https://www.ecosia.org/search?q=",
  };

  function syncSearchEngineUI() {
    if (!engineSelect) {
      return;
    }

    const selectedEngineName = localStorage.getItem("enginename");
    const customEngine = localStorage.getItem("engine") || "";

    if (selectedEngineName && engineUrls[selectedEngineName]) {
      engineSelect.value = selectedEngineName;
      if (engineInput) {
        engineInput.value = "";
      }
    } else {
      engineSelect.value = "DuckDuckGo";
      if (engineInput && selectedEngineName === "Custom") {
        engineInput.value = customEngine;
      }
    }
  }

  function updateSearchEngine(selectedEngine) {
    if (!engineUrls[selectedEngine]) {
      return;
    }

    localStorage.setItem("engine", engineUrls[selectedEngine]);
    localStorage.setItem("enginename", selectedEngine);
    engineSelect.value = selectedEngine;
    if (engineInput) {
      engineInput.value = "";
    }
  }

  function saveCustomEngine() {
    const customEngine = engineInput?.value.trim();
    if (!customEngine) {
      alert("Please enter a custom search engine value.");
      return;
    }

    localStorage.setItem("engine", customEngine);
    localStorage.setItem("enginename", "Custom");
  }

  function syncProxyUI() {
    if (!proxySelect) {
      return;
    }

    const storedUv = localStorage.getItem("uv");
    const storedDy = localStorage.getItem("dy");

    if (storedUv === "true") {
      proxySelect.value = "uv";
    } else if (storedDy === "true" || storedDy === "auto") {
      proxySelect.value = "dy";
    } else {
      proxySelect.value = "uv";
    }
  }

  function updateProxy(selectedValue) {
    if (selectedValue === "dy") {
      localStorage.setItem("uv", "false");
      localStorage.setItem("dy", "true");
    } else {
      localStorage.setItem("uv", "true");
      localStorage.setItem("dy", "false");
    }
  }

  function exportSaveData() {
    function getCookies() {
      const cookies = document.cookie ? document.cookie.split("; ") : [];
      const cookieObj = {};
      cookies.forEach(cookie => {
        const [name, value] = cookie.split("=");
        cookieObj[name] = value;
      });
      return cookieObj;
    }

    function getLocalStorageData() {
      const localStorageObj = {};
      for (const key in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
          localStorageObj[key] = localStorage.getItem(key);
        }
      }
      return localStorageObj;
    }

    const data = {
      cookies: getCookies(),
      localStorage: getLocalStorageData(),
    };

    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "save_data.json";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  function importSaveData() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = event => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      const reader = new FileReader();
      reader.onload = fileEvent => {
        try {
          const data = JSON.parse(fileEvent.target.result);

          if (data.cookies) {
            Object.entries(data.cookies).forEach(([key, value]) => {
              document.cookie = `${key}=${value}; path=/`;
            });
          }

          if (data.localStorage) {
            Object.entries(data.localStorage).forEach(([key, value]) => {
              localStorage.setItem(key, value);
            });
          }

          alert("Your save data has been imported. Please test it out.");
        } catch (error) {
          console.error("Error parsing JSON file:", error);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  tabButtons.forEach(button => {
    button.addEventListener("click", () => {
      showPanel(button.dataset.settingsTab);
    });
  });

  engineSelect?.addEventListener("change", event => {
    updateSearchEngine(event.target.value);
  });

  saveEngineButton?.addEventListener("click", saveCustomEngine);
  proxySelect?.addEventListener("change", event => {
    updateProxy(event.target.value);
  });
  exportButton?.addEventListener("click", exportSaveData);
  importButton?.addEventListener("click", importSaveData);

  syncSearchEngineUI();
  syncProxyUI();
  showPanel("general", true);
  animatePageIn();
});
