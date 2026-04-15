document.addEventListener("DOMContentLoaded", () => {
  const motion = window.Motion;
  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  const tabButtons = Array.from(document.querySelectorAll("[data-settings-tab]"));
  const panels = Array.from(document.querySelectorAll("[data-settings-panel]"));
  const panelMap = new Map(panels.map(panel => [panel.dataset.settingsPanel, panel]));
  const searchInput = document.querySelector(".settings-search");

  const engineSelect = document.getElementById("engine");
  const engineInput = document.getElementById("engine-form");
  const saveEngineButton = document.getElementById("save-engine");
  const proxySelect = document.getElementById("pChange");
  const exportButton = document.getElementById("export-save");
  const importButton = document.getElementById("import-save");

  function getAnimationPreference() {
    try {
      const stored = localStorage.getItem("infraredPersonalization");
      if (!stored) {
        return true;
      }

      return JSON.parse(stored).enableAnimations !== false;
    } catch (error) {
      return true;
    }
  }

  // Search functionality
  function searchSettings(query) {
    const lowerQuery = query.toLowerCase();

    // Clear all hidden classes first
    tabButtons.forEach(btn => btn.classList.remove("hidden"));
    panels.forEach(panel => panel.classList.remove("hidden"));
    document.querySelectorAll(".settings-card").forEach(card => card.classList.remove("hidden"));
    document.querySelectorAll(".shortcut-item").forEach(item => item.classList.remove("hidden"));

    if (!lowerQuery) return; // If empty, show everything

    // Hide only items that don't match
    panels.forEach(panel => {
      const tabName = panel.dataset.settingsPanel;
      const button = document.querySelector(`[data-settings-tab="${tabName}"]`);
      
      if (tabName === "keyboard") {
        const shortcuts = panel.querySelectorAll(".shortcut-item");
        let hasVisibleShortcuts = false;
        
        shortcuts.forEach(shortcut => {
          const text = shortcut.textContent.toLowerCase();
          const matches = text.includes(lowerQuery);
          if (!matches) shortcut.classList.add("hidden");
          else hasVisibleShortcuts = true;
        });
        
        // Hide keyboard tab only if no shortcuts match
        if (!hasVisibleShortcuts) {
          button?.classList.add("hidden");
          panel.classList.add("hidden");
        }
      } else {
        const cards = panel.querySelectorAll(".settings-card");
        let hasVisibleCards = false;
        
        cards.forEach(card => {
          const content = card.textContent.toLowerCase();
          const matches = content.includes(lowerQuery);
          if (!matches) card.classList.add("hidden");
          else hasVisibleCards = true;
        });
        
        // Hide tab and panel only if no cards match
        if (!hasVisibleCards) {
          button?.classList.add("hidden");
          panel.classList.add("hidden");
        }
      }
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchSettings(e.target.value);
    });
  }

  function animateTargets(targets, keyframes, options) {
    if (!motion?.animate || prefersReducedMotion || !getAnimationPreference() || !targets.length) {
      return null;
    }

    return motion.animate(targets, keyframes, options);
  }

  function getPanelItems(panel) {
    return Array.from(panel.querySelectorAll("[data-animate-item]"));
  }

  function animatePageIn() {
    if (!getAnimationPreference()) {
      return;
    }

    const sidebarTargets = Array.from(document.querySelectorAll(".settings-topbar, .settings-sidebar"));
    const activePanel = document.querySelector(".settings-panel.is-active");
    const panelTargets = activePanel ? getPanelItems(activePanel) : [];

    [...sidebarTargets, ...panelTargets].forEach(target => {
      target.style.opacity = "0";
      target.style.transform = "";
      target.style.filter = "blur(8px)";
    });

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

    if (!motion?.animate || prefersReducedMotion || !getAnimationPreference() || immediate || !currentPanel) {
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

  // Keyboard Shortcuts Management
  const DEFAULT_SHORTCUTS = {
    openCommandBox: {
      name: "Open Command Box",
      keys: ["Control", "k"],
      display: "Ctrl + K"
    }
  };

  function getShortcutsFromStorage() {
    const stored = localStorage.getItem("keyboardShortcuts");
    return stored ? JSON.parse(stored) : DEFAULT_SHORTCUTS;
  }

  function saveShortcutsToStorage(shortcuts) {
    localStorage.setItem("keyboardShortcuts", JSON.stringify(shortcuts));
  }

  function renderKeyboardVisualization(shortcuts) {
    const keyboardDisplay = document.getElementById("keyboard-display");
    if (!keyboardDisplay) return;

    const keyboardLayout = [
      { keys: ["Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12"], type: "function" },
      { keys: ["~", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "Backspace"], sizes: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2] },
      { keys: ["Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\"], sizes: [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5] },
      { keys: ["CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter"], sizes: [1.8, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.2] },
      { keys: ["Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Shift"], sizes: [2.3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.7] },
      { keys: ["Control", "Alt", "Space", "Alt", "Control"], sizes: [1.25, 1.25, 6, 1.25, 1.25] },
    ];

    const activeKeys = new Set();
    Object.values(shortcuts).forEach(shortcut => {
      shortcut.keys.forEach(key => {
        activeKeys.add(key.toUpperCase());
      });
    });

    const getShortcutsForKey = (key) => {
      const shortcuts_for_key = [];
      Object.values(shortcuts).forEach(shortcut => {
        if (shortcut.keys.some(k => k.toUpperCase() === key.toUpperCase())) {
          shortcuts_for_key.push(shortcut.name);
        }
      });
      return shortcuts_for_key;
    };

    keyboardDisplay.innerHTML = "";

    keyboardLayout.forEach((row, rowIdx) => {
      const rowEl = document.createElement("div");
      rowEl.className = "keyboard-row";
      rowEl.style.marginBottom = "6px";

      row.keys.forEach((key, keyIdx) => {
        const keyEl = document.createElement("div");
        keyEl.className = "key";
        const size = row.sizes ? row.sizes[keyIdx] : 1;
        keyEl.style.flex = `0 0 calc(${size} * 34px + ${size - 1} * 3px)`;
        
        if (row.type === "function") {
          keyEl.classList.add("key-function");
        }

        const displayKey = key === "Control" ? "Ctrl" : (key !== "Space" ? key : "");
        keyEl.textContent = displayKey;
        
        if (activeKeys.has(key.toUpperCase())) {
          keyEl.classList.add("active");
        }

        const shortcuts_for_key = getShortcutsForKey(key);
        if (shortcuts_for_key.length > 0) {
          const tooltip = document.createElement("div");
          tooltip.className = "key-tooltip";
          tooltip.textContent = shortcuts_for_key.join(", ");
          keyEl.appendChild(tooltip);
        }

        rowEl.appendChild(keyEl);
      });

      keyboardDisplay.appendChild(rowEl);
    });
  }

  function renderShortcutsList(shortcuts) {
    const shortcutsList = document.getElementById("shortcuts-list");
    if (!shortcutsList) return;

    shortcutsList.innerHTML = "";
    Object.entries(shortcuts).forEach(([id, config]) => {
      const item = document.createElement("div");
      item.className = "shortcut-item";
      item.innerHTML = `
        <div class="shortcut-name">${config.name}</div>
        <div class="shortcut-key-display">
          ${config.keys.map(k => `<span>${k === "Control" ? "Ctrl" : k}</span>`).join(" + ")}
        </div>
      `;
      shortcutsList.appendChild(item);

      item.addEventListener("click", () => {
        openShortcutRecorder(id, shortcuts);
      });
    });
  }

  function openShortcutRecorder(shortcutId, shortcuts) {
    const modal = document.createElement("div");
    modal.className = "keyboard-modal";
    modal.innerHTML = `
      <div class="keyboard-modal-content">
        <div class="keyboard-modal-title">Press new keys for: ${shortcuts[shortcutId].name}</div>
        <div class="keyboard-modal-keys" id="modal-keys">Press keys...</div>
        <div style="margin-top: 16px; display: flex; gap: 8px; justify-content: center;">
          <button class="settings-action" id="modal-cancel">Cancel</button>
          <button class="settings-action settings-action-primary" id="modal-save">Save</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const modalKeys = document.getElementById("modal-keys");
    const cancelBtn = document.getElementById("modal-cancel");
    const saveBtn = document.getElementById("modal-save");
    let recordedKeys = [];

    function updateKeyDisplay() {
      const keyNames = recordedKeys.map(k => k === "Control" ? "Ctrl" : k).join(" + ");
      modalKeys.textContent = keyNames || "Press keys...";
    }

    function handleKeyDown(e) {
      e.preventDefault();
      recordedKeys = [];
      if (e.ctrlKey) recordedKeys.push("Control");
      if (e.shiftKey) recordedKeys.push("Shift");
      if (e.altKey) recordedKeys.push("Alt");
      if (e.metaKey) recordedKeys.push("Meta");
      
      const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
      if (!["Control", "Shift", "Alt", "Meta"].includes(key)) {
        recordedKeys.push(key);
      }
      
      updateKeyDisplay();
    }

    modalKeys.classList.add("listening");
    document.addEventListener("keydown", handleKeyDown, true);

    cancelBtn.addEventListener("click", () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      modal.remove();
    });

    saveBtn.addEventListener("click", () => {
      if (recordedKeys.length > 0) {
        shortcuts[shortcutId].keys = recordedKeys;
        shortcuts[shortcutId].display = recordedKeys.map(k => k === "Control" ? "Ctrl" : k).join(" + ");
        saveShortcutsToStorage(shortcuts);
        renderKeyboardVisualization(shortcuts);
        renderShortcutsList(shortcuts);
        document.removeEventListener("keydown", handleKeyDown, true);
        modal.remove();
      }
    });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        document.removeEventListener("keydown", handleKeyDown, true);
        modal.remove();
      }
    });
  }

  function initKeyboardShortcuts() {
    const shortcuts = getShortcutsFromStorage();
    renderKeyboardVisualization(shortcuts);
    renderShortcutsList(shortcuts);
  }

  // Personalization Settings Management
  const PERSONALIZATION_KEY = "infraredPersonalization";

  function getPersonalizationSettings() {
    const stored = localStorage.getItem(PERSONALIZATION_KEY);
    const parsed = stored ? JSON.parse(stored) : null;
    const base = parsed || {
      backgroundImage: null,
      backgroundColor: "#1a1a1a",
      useDefaultBackground: true,
      titleMode: "logo",
      showNavbar: true,
      showTips: true,
      enableAnimations: true
    };

    // Backwards-compat: previously stored `showLogo` boolean.
    if (!base.titleMode && typeof base.showLogo === "boolean") {
      base.titleMode = base.showLogo ? "logo" : "none";
    }
    delete base.showLogo;

    if (base.titleMode !== "logo" && base.titleMode !== "clock" && base.titleMode !== "none") {
      base.titleMode = "logo";
    }

    return base;
  }

  function savePersonalizationSettings(settings) {
    localStorage.setItem(PERSONALIZATION_KEY, JSON.stringify(settings));
    applyPersonalizationSettings(settings);
  }

  function applyPersonalizationSettings(settings) {
    // Apply to current page (if on home)
    applyPersonalizationToWindow(window, settings);
    
    // Update hidden nav overlay for main window
    try {
      const hiddenNavOverlay = window.document.getElementById('hidden-nav-overlay');
      if (hiddenNavOverlay) {
        if (!settings.showNavbar) {
          hiddenNavOverlay.classList.add('navbar-hidden');
        } else {
          hiddenNavOverlay.classList.remove('navbar-hidden');
        }
      }
    } catch (e) {
      // Skip if no hidden nav overlay
    }
    
    // Update iframe if exists
    try {
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        try {
          if (iframe.contentWindow) {
            applyPersonalizationToWindow(iframe.contentWindow, settings);
            const hiddenNavOverlay = iframe.contentWindow.document.getElementById('hidden-nav-overlay');
            if (hiddenNavOverlay) {
              if (!settings.showNavbar) {
                hiddenNavOverlay.classList.add('navbar-hidden');
              } else {
                hiddenNavOverlay.classList.remove('navbar-hidden');
              }
            }
          }
        } catch (e) {
          // Cross-origin iframe, skip
        }
      });
    } catch (e) {
      // Skip if no iframes
    }
  }

  function applyPersonalizationToWindow(win, settings) {
    try {
      const doc = win.document;
      const root = doc.documentElement;
      
      // Apply background to wallpaper, blur, and navbar
      const wallpaper = doc.querySelector('.wallpaper');
      const wallpaperBlur = doc.querySelector('.wallpaper-blur');
      const navbar = doc.querySelector('.navbar');
      const navbarSurface = navbar?.querySelector?.(".nav-content") || navbar;

      // We don't theme the navbar background; always clear any previous inline styling.
      if (navbarSurface) {
        navbarSurface.style.backgroundImage = "";
        navbarSurface.style.backgroundColor = "";
        navbarSurface.style.backgroundSize = "";
        navbarSurface.style.backgroundPosition = "";
        navbarSurface.style.borderRadius = "";
        navbarSurface.style.overflow = "";
      }
      
      if (settings.useDefaultBackground) {
        // Use default background
        if (wallpaper) {
          wallpaper.style.backgroundImage = "url('/assets/media/homebg.png')";
          wallpaper.style.backgroundColor = '';
        }
        if (wallpaperBlur) {
          wallpaperBlur.style.backgroundImage = "url('/assets/media/homebg.png')";
          wallpaperBlur.style.backgroundColor = '';
        }
        // Navbar background is intentionally untouched (cleared above).
      } else if (settings.backgroundImage) {
        // Use custom uploaded image
        if (wallpaper) {
          wallpaper.style.backgroundImage = `url('${settings.backgroundImage}')`;
          wallpaper.style.backgroundSize = 'cover';
          wallpaper.style.backgroundPosition = 'center';
        }
        if (wallpaperBlur) {
          wallpaperBlur.style.backgroundImage = `url('${settings.backgroundImage}')`;
          wallpaperBlur.style.backgroundSize = 'cover';
          wallpaperBlur.style.backgroundPosition = 'center';
        }
        // Navbar background is intentionally untouched (cleared above).
      } else if (settings.backgroundColor) {
        // Use custom color
        if (wallpaper) {
          wallpaper.style.backgroundImage = '';
          wallpaper.style.backgroundColor = settings.backgroundColor;
        }
        if (wallpaperBlur) {
          wallpaperBlur.style.backgroundImage = '';
          wallpaperBlur.style.backgroundColor = settings.backgroundColor;
        }
        // Navbar background is intentionally untouched (cleared above).
      }
      
      // Title mode (logo / clock / none)
      const titleEl = doc.querySelector('.title');
      const subtitle = doc.querySelector('.subtitle, #dynamic-subtitle');
      const titleMode = settings.titleMode || "logo";
      const clockKey = "__infraredClockInterval";
      const applyClock = () => {
        if (!titleEl) return;
        const now = new Date();
        let hours = now.getHours();
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const suffix = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        if (hours === 0) hours = 12;
        const hourString = String(hours).padStart(2, "0");
        const nextText = `${hourString}:${minutes}${suffix}`;
        if (win.InfraredHomeTitle?.updateDiff) {
          win.InfraredHomeTitle.updateDiff(nextText);
        } else if (win.InfraredHomeTitle?.setText) {
          win.InfraredHomeTitle.setText(nextText);
        } else {
          titleEl.textContent = nextText;
        }
      };

      if (titleEl) {
        if (titleMode === "none") {
          titleEl.style.display = "none";
          if (win[clockKey]) {
            win.clearInterval(win[clockKey]);
            win[clockKey] = null;
          }
        } else if (titleMode === "clock") {
          titleEl.style.display = "block";
          applyClock();
          if (!win[clockKey]) {
            win[clockKey] = win.setInterval(applyClock, 1000 * 15);
          }
        } else {
          titleEl.style.display = "block";
          if (win.InfraredHomeTitle?.setText) {
            win.InfraredHomeTitle.setText("INFRARED");
          } else {
            titleEl.textContent = "INFRARED";
          }
          if (win[clockKey]) {
            win.clearInterval(win[clockKey]);
            win[clockKey] = null;
          }
        }
      }
      
      // Toggle navbar
      if (navbar) {
        navbar.style.display = settings.showNavbar ? 'flex' : 'none';
      }
      
      // Toggle tips
      if (subtitle) {
        subtitle.style.display = settings.showTips ? 'block' : 'none';
      }

      if (root) {
        root.classList.toggle("animations-disabled", settings.enableAnimations === false);
      }

      let animationStyle = doc.getElementById("infrared-animation-style");
        if (!animationStyle) {
          animationStyle = doc.createElement("style");
          animationStyle.id = "infrared-animation-style";
          animationStyle.textContent = `
            html.animations-disabled *,
            html.animations-disabled *::before,
            html.animations-disabled *::after {
              animation: none !important;
              transition: none !important;
              scroll-behavior: auto !important;
            }

            /* Some pages start with opacity: 0 and rely on animations to fade in. */
            html.animations-disabled body {
              opacity: 1 !important;
              animation: none !important;
            }
          `;
          doc.head?.appendChild(animationStyle);
        }
    } catch (e) {
      console.error('Error applying personalization:', e);
    }
  }

  function initPersonalization() {
    const settings = getPersonalizationSettings();
    
    // Update UI to reflect stored settings
    const titleModeGroup = document.getElementById("title-mode");
    const titleModeButtons = titleModeGroup ? Array.from(titleModeGroup.querySelectorAll("[data-title-mode]")) : [];
    const navbarToggle = document.getElementById('toggle-navbar');
    const tipsToggle = document.getElementById('toggle-tips');
    const animationsToggle = document.getElementById('toggle-animations');
    const bgUploadBtn = document.getElementById('bg-upload-btn');
    const bgImageInput = document.getElementById('bg-image-input');
    const bgDefaultRadio = document.getElementById('bg-default-radio');
    const bgCustomRadio = document.getElementById('bg-custom-radio');
    const bgDefaultPreview = document.getElementById('bg-default-preview');
    const bgCustomPreview = document.getElementById('bg-custom-preview');
    
    if (navbarToggle) navbarToggle.checked = settings.showNavbar;
    if (tipsToggle) tipsToggle.checked = settings.showTips;
    if (animationsToggle) animationsToggle.checked = settings.enableAnimations !== false;
    
    // Set radio button based on settings
    if (settings.useDefaultBackground) {
      if (bgDefaultRadio) bgDefaultRadio.checked = true;
    } else {
      if (bgCustomRadio) bgCustomRadio.checked = true;
    }
    
    // Update preview boxes
    const updatePreviews = () => {
      // Default preview (always show as default background)
      if (bgDefaultPreview) {
        bgDefaultPreview.style.backgroundImage = 'url("/assets/media/homebg.png")';
        bgDefaultPreview.style.backgroundColor = '';
      }
      
      // Custom preview
      if (bgCustomPreview) {
        if (settings.backgroundImage) {
          bgCustomPreview.style.backgroundImage = `url('${settings.backgroundImage}')`;
          bgCustomPreview.style.backgroundColor = '';
        } else if (settings.backgroundColor) {
          bgCustomPreview.style.backgroundImage = '';
          bgCustomPreview.style.backgroundColor = settings.backgroundColor;
        } else {
          bgCustomPreview.style.backgroundImage = '';
          bgCustomPreview.style.backgroundColor = '#1a1a1a';
        }
      }
    };
    
    updatePreviews();
    
    // Event listeners
    const syncTitleModeUI = () => {
      const current = settings.titleMode || "logo";
      titleModeButtons.forEach(btn => {
        const isActive = btn.dataset.titleMode === current;
        btn.setAttribute("aria-pressed", String(isActive));
      });
    };

    if (titleModeButtons.length) {
      syncTitleModeUI();
      titleModeButtons.forEach(btn => {
        btn.addEventListener("click", () => {
          settings.titleMode = btn.dataset.titleMode || "logo";
          syncTitleModeUI();
          savePersonalizationSettings(settings);
        });
      });
    }
    
    if (navbarToggle) {
      navbarToggle.addEventListener('change', (e) => {
        settings.showNavbar = e.target.checked;
        savePersonalizationSettings(settings);
      });
    }
    
    if (tipsToggle) {
      tipsToggle.addEventListener('change', (e) => {
        settings.showTips = e.target.checked;
        savePersonalizationSettings(settings);
      });
    }

    if (animationsToggle) {
      animationsToggle.addEventListener('change', (e) => {
        settings.enableAnimations = e.target.checked;
        savePersonalizationSettings(settings);
      });
    }

    if (bgUploadBtn) {
      bgUploadBtn.addEventListener('click', () => {
        bgImageInput?.click();
      });
    }
    
    if (bgImageInput) {
      bgImageInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            settings.backgroundImage = event.target?.result;
            settings.backgroundColor = '#1a1a1a';
            settings.useDefaultBackground = false;
            if (bgCustomRadio) bgCustomRadio.checked = true;
            updatePreviews();
            savePersonalizationSettings(settings);
          };
          reader.readAsDataURL(file);
        }
      });
    }
    
    // Radio button listeners
    if (bgDefaultRadio) {
      bgDefaultRadio.addEventListener('change', (e) => {
        if (e.target.checked) {
          settings.useDefaultBackground = true;
          updatePreviews();
          savePersonalizationSettings(settings);
        }
      });
    }
    
    if (bgCustomRadio) {
      bgCustomRadio.addEventListener('change', (e) => {
        if (e.target.checked) {
          settings.useDefaultBackground = false;
          updatePreviews();
          savePersonalizationSettings(settings);
        }
      });
    }
    
    // Click on preview boxes to toggle
    if (bgDefaultPreview) {
      bgDefaultPreview.addEventListener('click', () => {
        settings.useDefaultBackground = true;
        if (bgDefaultRadio) bgDefaultRadio.checked = true;
        updatePreviews();
        savePersonalizationSettings(settings);
      });
    }
    
    if (bgCustomPreview) {
      bgCustomPreview.addEventListener('click', () => {
        settings.useDefaultBackground = false;
        if (bgCustomRadio) bgCustomRadio.checked = true;
        updatePreviews();
        savePersonalizationSettings(settings);
      });
    }
    
    // Apply settings on load
    applyPersonalizationSettings(settings);
  }

  syncSearchEngineUI();
  syncProxyUI();
  initKeyboardShortcuts();
  initPersonalization();
  showPanel("general", true);
  
  const runInitialAnimation = () => {
    requestAnimationFrame(() => {
      animatePageIn();
    });
  };

  if (!window.InfraredShellBridge?.isEmbedded || window.InfraredShellBridge?.isActive()) {
    runInitialAnimation();
  }

  if (window.InfraredShellBridge?.isEmbedded) {
    window.addEventListener("infrared:shell-activate", () => {
      runInitialAnimation();
    });
  }
});
