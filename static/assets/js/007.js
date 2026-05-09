// t.js

// Cookie management helpers (top-level so they're available everywhere)
function getCookie(name) {
  const nameEQ = name + "=";
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith(nameEQ)) {
      return decodeURIComponent(cookie.substring(nameEQ.length));
    }
  }
  return null;
}

function setCookie(name, value, days = 30) {
  const d = new Date();
  d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = "expires=" + d.toUTCString();
  document.cookie = name + "=" + encodeURIComponent(value) + ";" + expires + ";path=/";
}

function trackSearch(url) {
  const history = JSON.parse(getCookie("searchHistory") || "{}");
  history[url] = (history[url] || 0) + 1;
  setCookie("searchHistory", JSON.stringify(history));
}

function tabsBuildSearchUrl(query) {
  const searchBase = localStorage.getItem("engine") || "https://duckduckgo.com/?q=";
  return `${searchBase}${encodeURIComponent(query)}`;
}

function tabsIsUrl(val = "") {
  if (
    /^http(s?):\/\//.test(val) ||
    (val.includes(".") && val.substr(0, 1) !== " ")
  ) {
    return true;
  }
  return false;
}

function tabsPrependHttps(url) {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return `https://${url}`;
  }
  return url;
}

function tabsResolveDisplayValue(target, mode = "auto") {
  const rawTarget = `${target ?? ""}`.trim();

  if (!rawTarget) {
    return "";
  }

  if (
    mode === "direct" ||
    rawTarget.startsWith("/") ||
    rawTarget.startsWith("./") ||
    rawTarget.startsWith("../") ||
    rawTarget === "search-start.html"
  ) {
    return rawTarget;
  }

  return tabsIsUrl(rawTarget) ? tabsPrependHttps(rawTarget) : tabsBuildSearchUrl(rawTarget);
}

function tabsResolveFrameSrc(target, mode = "auto") {
  const rawTarget = `${target ?? ""}`.trim();

  if (!rawTarget) {
    return "search-start.html";
  }

  const isDirectTarget =
    rawTarget.startsWith("/") ||
    rawTarget.startsWith("./") ||
    rawTarget.startsWith("../") ||
    rawTarget === "search-start.html";

  let resolvedMode = mode;

  if (resolvedMode === "auto") {
    resolvedMode = isDirectTarget ? "direct" : (localStorage.getItem("rayser") === "true" ? "rayser" : (localStorage.getItem("dy") === "true" ? "dynamic" : "uv"));
  }

  if (resolvedMode === "direct" || isDirectTarget) {
    return new URL(rawTarget, window.location.origin).href;
  }

  if (typeof __uv$config === "undefined") {
    throw new Error("__uv$config not available");
  }

  if (resolvedMode === "rayser") {
    const proxyBase = "https://ojlbvfuijh3093ic-0o91uih.teition.com/";
    return proxyBase + "?url=" + encodeURIComponent(rawTarget);
  }

  const preparedTarget = tabsResolveDisplayValue(rawTarget, resolvedMode);
  const encodedTarget = __uv$config.encodeUrl(preparedTarget);

  return resolvedMode === "dynamic" ? `/a/q/${encodedTarget}` : `/a/${encodedTarget}`;
}

function tabsOpenTarget(target, mode = "auto") {
  const iframeContainer = document.getElementById("frame-container");
  const urlInput = document.getElementById("iv");

  if (!iframeContainer) {
    return false;
  }

  const activeIframe = Array.from(iframeContainer.querySelectorAll("iframe")).find(
    iframe => iframe.classList.contains("active"),
  );

  if (!activeIframe) {
    return false;
  }

  try {
    const displayValue = tabsResolveDisplayValue(target, mode);
    const frameSrc = tabsResolveFrameSrc(target, mode);

    if (/^http(s?):\/\//.test(displayValue)) {
      const domain = displayValue.replace(/https?:\/\//i, "").split("/")[0];
      trackSearch(domain);
    }

    if (frameSrc.includes("https://ojlbvfuijh3093ic-0o91uih.teition.com/")) {
      fetch(frameSrc).then(r => r.text()).then(html => {
        activeIframe.srcdoc = html;
        activeIframe.dataset.tabUrl = displayValue || target;
      }).catch(error => {
        console.error("Error fetching Rayser proxy:", error);
      });
    } else {
      activeIframe.src = frameSrc.startsWith("http") ? frameSrc : `${window.location.origin}${frameSrc}`;
      activeIframe.dataset.tabUrl = displayValue || target;
    }

    if (urlInput) {
      urlInput.value = displayValue || target;
    }

    return true;
  } catch (error) {
    console.error("Error opening target in tabs:", error);
    return false;
  }
}

window.addEventListener("load", () => {
  // Wait for config to be available before registering service worker
  const waitForConfig = setInterval(() => {
    if (typeof __uv$config !== 'undefined') {
      clearInterval(waitForConfig);
      navigator.serviceWorker.register("../sw.js?v=2025-04-15", { scope: "/a/" })
        .then(registration => {
          console.log('Mathematics SW registered:', registration.scope);
        })
        .catch(error => {
          console.error('Mathematics SW registration failed:', error);
        });
    }
  }, 100);

  const form = document.getElementById("fv");
  const input = document.getElementById("iv");
  function buildSearchUrl(query) {
    return tabsBuildSearchUrl(query);
  }

  if (input) {
    // Handle Enter key press on the input field
    input.addEventListener("keydown", async event => {
      if (event.key === "Enter") {
        event.preventDefault();
        const formValue = input.value.trim();
        const url = isUrl(formValue)
          ? prependHttps(formValue)
          : buildSearchUrl(formValue);
        processUrl(url);
      }
    });

    // Keep form submit as fallback
    if (form) {
      form.addEventListener("submit", async event => {
        event.preventDefault();
        const formValue = input.value.trim();
        const url = isUrl(formValue)
          ? prependHttps(formValue)
          : buildSearchUrl(formValue);
        processUrl(url);
      });
    }
  }
  function processUrl(url) {
    tabsOpenTarget(url, "auto");
  }
  function isUrl(val = "") {
    return tabsIsUrl(val);
  }
  function prependHttps(url) {
    return tabsPrependHttps(url);
  }

  // Check if there's a URL to open from home page command box
  const urlToOpen = sessionStorage.getItem("urlToOpen");
  if (urlToOpen) {
    sessionStorage.removeItem("urlToOpen");
    processUrl(urlToOpen);
  }
});
document.addEventListener("DOMContentLoaded", event => {
  const addTabButton = document.getElementById("add-tab");
  const tabList = document.getElementById("tab-list");
  const iframeContainer = document.getElementById("frame-container");
  const urlInput = document.getElementById("iv");
  let tabCounter = 1;

  function animateNewTabEntry(tabElement) {
    const motion = window.Motion;

    if (!motion?.animate || !tabElement) {
      return;
    }

    motion.animate(
      tabElement,
      {
        opacity: [0, 1],
        y: [10, 0],
        scale: [0.97, 1],
        filter: ["blur(8px)", "blur(0px)"],
      },
      {
        duration: 0.32,
        ease: [0.22, 1, 0.36, 1],
      },
    );
  }

  function focusUrlBar() {
    if (!urlInput) {
      return;
    }

    urlInput.value = "";
    window.requestAnimationFrame(() => {
      urlInput.focus({ preventScroll: true });
      urlInput.select();
    });
  }

  function setFallbackIcon(tabFallback, label) {
    const cleanLabel = (label || "Tab").replace(/[^a-z0-9]/gi, "").toUpperCase();
    tabFallback.textContent = cleanLabel.slice(0, 2) || "T";
  }

  function updateTabMetadata(iframe, tabTitle, tabFavicon, tabFallback) {
    let resolvedTitle = "Tab";

    try {
      const title = iframe.contentDocument?.title?.trim();
      if (title && title.length > 1) {
        if (title.length <= 100) {
          resolvedTitle = title;
        } else {
          const currentUrl = iframe.contentWindow.location.href;
          try {
            const url = new URL(currentUrl);
            resolvedTitle = url.hostname;
          } catch (error) {
            resolvedTitle = "Tab";
          }
        }
      }

      const faviconLink = iframe.contentDocument?.querySelector(
        "link[rel~='icon'], link[rel='shortcut icon'], link[rel='apple-touch-icon']",
      );

      if (faviconLink?.href) {
        tabFavicon.src = faviconLink.href;
        tabFavicon.hidden = false;
        tabFallback.hidden = true;
      } else {
        tabFavicon.hidden = true;
        tabFallback.hidden = false;
      }
    } catch (error) {
      tabFavicon.hidden = true;
      tabFallback.hidden = false;
    }

    tabTitle.textContent = resolvedTitle;
    setFallbackIcon(tabFallback, resolvedTitle);
  }

  const pendingGoUrl = localStorage.getItem("InfraredPendingGoUrl");
  const pendingRawUrl = localStorage.getItem("InfraredPendingRawUrl");
  if (pendingGoUrl) {
    sessionStorage.setItem("GoUrl", pendingGoUrl);
    localStorage.removeItem("InfraredPendingGoUrl");
  }
  if (pendingRawUrl) {
    sessionStorage.setItem("GoUrlRaw", pendingRawUrl);
    localStorage.removeItem("InfraredPendingRawUrl");
  }

  addTabButton.addEventListener("click", () => {
    createNewTab(true);
    Load();
    focusUrlBar();
  });
  function createNewTab(shouldAnimate = false) {
    const newTab = document.createElement("li");
    const tabEntry = document.createElement("div");
    const tabIconWrap = document.createElement("span");
    const tabFavicon = document.createElement("img");
    const tabFallback = document.createElement("span");
    const tabTitle = document.createElement("span");
    const newIframe = document.createElement("iframe");
    newIframe.sandbox =
      "allow-same-origin allow-scripts allow-forms allow-pointer-lock allow-modals allow-orientation-lock allow-presentation allow-storage-access-by-user-activation";
    // When Top Navigation is not allowed links with the "top" value will be entirely blocked, if we allow Top Navigation it will overwrite the tab, which is obviously not wanted.
    tabTitle.textContent = `New Tab ${tabCounter}`;
    tabTitle.className = "tab-title";
    tabEntry.className = "tab-entry";
    tabIconWrap.className = "tab-icon-wrap";
    tabFavicon.className = "tab-favicon";
    tabFavicon.alt = "";
    tabFavicon.hidden = true;
    tabFallback.className = "tab-fallback-icon";
    setFallbackIcon(tabFallback, tabTitle.textContent);
    newTab.dataset.tabId = tabCounter;
    newTab.addEventListener("click", switchTab);
    newTab.setAttribute("draggable", true);
    const closeButton = document.createElement("button");
    closeButton.classList.add("close-tab");
    closeButton.innerHTML = "&#10005;";
    closeButton.addEventListener("click", closeTab);
    tabIconWrap.appendChild(tabFavicon);
    tabIconWrap.appendChild(tabFallback);
    tabEntry.appendChild(tabIconWrap);
    tabEntry.appendChild(tabTitle);
    newTab.appendChild(tabEntry);
    newTab.appendChild(closeButton);
    tabList.appendChild(newTab);
    if (shouldAnimate) {
      animateNewTabEntry(newTab);
    }
    const allTabs = Array.from(tabList.querySelectorAll("li"));
    for (const tab of allTabs) {
      tab.classList.remove("active");
    }
    const allIframes = Array.from(iframeContainer.querySelectorAll("iframe"));
    for (const iframe of allIframes) {
      iframe.classList.remove("active");
    }
    newTab.classList.add("active");
    newIframe.dataset.tabId = tabCounter;
    newIframe.classList.add("active");
    newIframe.addEventListener("load", () => {
      updateTabMetadata(newIframe, tabTitle, tabFavicon, tabFallback);
      newIframe.contentWindow.open = url => {
        if (typeof __uv$config !== 'undefined') {
          sessionStorage.setItem("URL", `/a/${__uv$config.encodeUrl(url)}`);
        }
        createNewTab();
        return null;
      };
      
       // Inject script to listen for Ctrl+K inside iframe
       try {
         const iframeDoc = newIframe.contentDocument || newIframe.contentWindow.document;
         if (iframeDoc) {
           const script = iframeDoc.createElement("script");
            script.textContent = `
              document.addEventListener("keydown", (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                  e.preventDefault();
                  window.parent.postMessage({ type: "openCommandBox" }, "*");
                }
              }, true);

              // Replace blocking native alerts with a toast in the Tabs parent.
              (function () {
                try {
                  const nativeAlert = window.alert;
                  const nativeConfirm = window.confirm;
                  const nativePrompt = window.prompt;
                  window.alert = function (message) {
                    try {
                      window.parent.postMessage(
                        { type: "infrared-tabs:alert", message: String(message ?? "") },
                        "*"
                      );
                    } catch (e) {
                      nativeAlert(message);
                    }
                  };

                  window.confirm = function (message) {
                    try {
                      window.parent.postMessage(
                        { type: "infrared-tabs:confirm", message: String(message ?? "") },
                        "*"
                      );
                      return false;
                    } catch (e) {
                      return nativeConfirm(message);
                    }
                  };

                  window.prompt = function (message, defaultValue) {
                    try {
                      window.parent.postMessage(
                        {
                          type: "infrared-tabs:prompt",
                          message: String(message ?? ""),
                          defaultValue: defaultValue === undefined ? "" : String(defaultValue),
                        },
                        "*"
                      );
                      return null;
                    } catch (e) {
                      return nativePrompt(message, defaultValue);
                    }
                  };
                } catch (e) {
                  // ignore
                }
              })();
            `;
           iframeDoc.head.appendChild(script);
         }
       } catch (error) {
         // Silently fail for cross-origin iframes
       }
      
      if (newIframe.contentDocument.documentElement.outerHTML.trim().length > 0) {
        Load();
      }
      Load();
    });
    const goUrlRaw = sessionStorage.getItem("GoUrlRaw");
    if (goUrlRaw && typeof __uv$config !== "undefined") {
      try {
        sessionStorage.setItem("GoUrl", __uv$config.encodeUrl(goUrlRaw));
      } catch (error) {
        console.error("Error encoding pending raw URL:", error);
      }
      sessionStorage.removeItem("GoUrlRaw");
    }

    const goUrl = sessionStorage.getItem("GoUrl");
    const url = sessionStorage.getItem("URL");

    if (tabCounter === 0 || tabCounter === 1) {
      if (goUrl !== null) {
        if (goUrl.includes("/e/")) {
          newIframe.src = window.location.origin + goUrl;
        } else {
          newIframe.src = `${window.location.origin}/a/${goUrl}`;
        }
        sessionStorage.removeItem("GoUrl");
      } else {
        newIframe.src = "search-start.html";
      }
    } else if (tabCounter > 1) {
      if (url !== null) {
        newIframe.src = window.location.origin + url;
        sessionStorage.removeItem("URL");
      } else if (goUrl !== null) {
        if (goUrl.includes("/e/")) {
          newIframe.src = window.location.origin + goUrl;
        } else {
          newIframe.src = `${window.location.origin}/a/${goUrl}`;
        }
        sessionStorage.removeItem("GoUrl");
      } else {
        newIframe.src = "search-start.html";
      }
    }

    iframeContainer.appendChild(newIframe);
    tabCounter += 1;
  }
  function closeTab(event) {
    event.stopPropagation();
    const tabId = event.target.closest("li").dataset.tabId;
    const tabToRemove = tabList.querySelector(`[data-tab-id='${tabId}']`);
    const iframeToRemove = iframeContainer.querySelector(`[data-tab-id='${tabId}']`);
    if (tabToRemove && iframeToRemove) {
      tabToRemove.remove();
      iframeToRemove.remove();
      const remainingTabs = Array.from(tabList.querySelectorAll("li"));
      if (remainingTabs.length === 0) {
        tabCounter = 0;
        document.getElementById("iv").value = "";
      } else {
        const nextTabIndex = remainingTabs.findIndex(
          tab => tab.dataset.tabId !== tabId,
        );
        if (nextTabIndex > -1) {
          const nextTabToActivate = remainingTabs[nextTabIndex];
          const nextIframeToActivate = iframeContainer.querySelector(
            `[data-tab-id='${nextTabToActivate.dataset.tabId}']`,
          );
          for (const tab of remainingTabs) {
            tab.classList.remove("active");
          }
          remainingTabs[nextTabIndex].classList.add("active");
          const allIframes = Array.from(iframeContainer.querySelectorAll("iframe"));
          for (const iframe of allIframes) {
            iframe.classList.remove("active");
          }
          nextIframeToActivate.classList.add("active");
        }
      }
    }
  }
  function switchTab(event) {
    const tabId = event.target.closest("li").dataset.tabId;
    const allTabs = Array.from(tabList.querySelectorAll("li"));
    for (const tab of allTabs) {
      tab.classList.remove("active");
    }
    const allIframes = Array.from(iframeContainer.querySelectorAll("iframe"));
    for (const iframe of allIframes) {
      iframe.classList.remove("active");
    }
    const selectedTab = tabList.querySelector(`[data-tab-id='${tabId}']`);
    if (selectedTab) {
      selectedTab.classList.add("active");
      Load();
    } else {
      console.log("No selected tab found with ID:", tabId);
    }
    const selectedIframe = iframeContainer.querySelector(`[data-tab-id='${tabId}']`);
    if (selectedIframe) {
      selectedIframe.classList.add("active");
      
      // Update command box with current tab's URL
      const commandBoxInput = document.getElementById("command-box-input");
      if (commandBoxInput && selectedIframe.dataset.tabUrl) {
        commandBoxInput.value = selectedIframe.dataset.tabUrl;
      }
      // Also update the URL bar in sidebar
      const urlInput = document.getElementById("iv");
      if (urlInput && selectedIframe.dataset.tabUrl) {
        urlInput.value = selectedIframe.dataset.tabUrl;
      }
    } else {
      console.log("No selected iframe found with ID:", tabId);
    }
  }
  let dragTab = null;
  let draggedTabId = null;
  let splitInstance = null;
  
  const layoutPopupIsland = document.getElementById("layout-popup-island");
  
  tabList.addEventListener("dragstart", event => {
    const tabItem = event.target.closest("li");
    if (tabItem) {
      dragTab = tabItem;
      draggedTabId = tabItem.dataset.tabId;
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", draggedTabId);
      
      // Show layout popup island after a short delay
      setTimeout(() => {
        if (layoutPopupIsland) {
          layoutPopupIsland.classList.add("is-visible");
        }
      }, 200);
    }
  });
  tabList.addEventListener("dragover", event => {
    event.preventDefault();
    const targetTab = event.target.closest("li");
    if (targetTab && targetTab !== dragTab) {
      const targetIndex = Array.from(tabList.children).indexOf(targetTab);
      const dragIndex = Array.from(tabList.children).indexOf(dragTab);
      if (targetIndex < dragIndex) {
        tabList.insertBefore(dragTab, targetTab);
      } else {
        tabList.insertBefore(dragTab, targetTab.nextSibling);
      }
    }
  });
  tabList.addEventListener("dragend", () => {
    dragTab = null;
    draggedTabId = null;
    if (layoutPopupIsland) {
      layoutPopupIsland.classList.remove("is-visible");
    }
  });
  
  // Handle layout option clicks
  if (layoutPopupIsland) {
    const layoutOptions = layoutPopupIsland.querySelectorAll(".layout-option");
    layoutOptions.forEach(option => {
      option.addEventListener("click", () => {
        const layout = option.dataset.layout;
        // Use stored tab ID if available from drop event
        const pendingTabId = layoutPopupIsland.dataset.pendingTabId;
        if (pendingTabId) {
          draggedTabId = pendingTabId;
          delete layoutPopupIsland.dataset.pendingTabId;
        }
        applySplitLayout(layout);
        layoutPopupIsland.classList.remove("is-visible");
      });
      
      // Handle hover detection for pane highlighting
      option.addEventListener("mousemove", (e) => {
        const rect = option.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const width = rect.width;
        const height = rect.height;
        const layout = option.dataset.layout;
        
        // Reset all highlights
        option.classList.remove("pane-highlight-left", "pane-highlight-right", "pane-highlight-top", "pane-highlight-bottom");
        
        // Only highlight when cursor is exactly over a specific pane (tighter bounds)
        if (layout === "left-right") {
          const splitX = width * 0.44;
          if (x > 2 && x < splitX) {
            option.classList.add("pane-highlight-left");
          } else if (x >= splitX && x < width - 2) {
            option.classList.add("pane-highlight-right");
          }
        } else if (layout === "top-bottom") {
          const splitY = height * 0.44;
          if (y > 2 && y < splitY) {
            option.classList.add("pane-highlight-top");
          } else if (y >= splitY && y < height - 2) {
            option.classList.add("pane-highlight-bottom");
          }
        }
      });
      
      // Also handle dragover for when tabs are dragged onto the options
      option.addEventListener("dragover", (e) => {
        e.preventDefault();
        const rect = option.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const width = rect.width;
        const height = rect.height;
        const layout = option.dataset.layout;
        
        option.classList.remove("pane-highlight-left", "pane-highlight-right", "pane-highlight-top", "pane-highlight-bottom");
        
        if (layout === "left-right") {
          const splitX = width * 0.44;
          if (x > 2 && x < splitX) {
            option.classList.add("pane-highlight-left");
          } else if (x >= splitX && x < width - 2) {
            option.classList.add("pane-highlight-right");
          }
        } else if (layout === "top-bottom") {
          const splitY = height * 0.44;
          if (y > 2 && y < splitY) {
            option.classList.add("pane-highlight-top");
          } else if (y >= splitY && y < height - 2) {
            option.classList.add("pane-highlight-bottom");
          }
        }
      });
      
      option.addEventListener("dragleave", () => {
        option.classList.remove("pane-highlight-left", "pane-highlight-right", "pane-highlight-top", "pane-highlight-bottom");
      });
      
      // Handle drop on layout option - apply split immediately
      option.addEventListener("drop", (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const tabId = e.dataTransfer.getData("text/plain");
        if (!tabId) return;
        
        const layout = option.dataset.layout;
        
        // Determine which pane target was selected (for order)
        const rect = option.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const width = rect.width;
        const height = rect.height;
        
        let targetPosition = "right";
        if (layout === "left-right") {
          const splitX = width * 0.44;
          if (x > 2 && x < splitX) {
            targetPosition = "left";
          }
        } else if (layout === "top-bottom") {
          const splitY = height * 0.44;
          if (y > 2 && y < splitY) {
            targetPosition = "top";
          }
        }
        
        // Apply split immediately
        applySplitLayoutWithTab(tabId, layout, targetPosition);
        
        // Hide popup
        if (layoutPopupIsland) {
          layoutPopupIsland.classList.remove("is-visible");
          delete layoutPopupIsland.dataset.pendingTabId;
        }
      });
      
      option.addEventListener("mouseleave", () => {
        // Reset highlights but keep base classes
        option.classList.remove("pane-highlight-left", "pane-highlight-right", "pane-highlight-top", "pane-highlight-bottom");
      });
    });
  }
  
  function applySplitLayout(layout) {
    if (!draggedTabId) return;
    applySplitLayoutWithTab(draggedTabId, layout, "right");
  }
  
  function applySplitLayoutWithTab(tabId, layout, targetPosition) {
    const sourceTab = tabList.querySelector(`[data-tab-id="${tabId}"]`);
    const sourceIframe = iframeContainer.querySelector(`[data-tab-id="${tabId}"]`);
    const activeIframe = iframeContainer.querySelector("iframe.active") || iframeContainer.querySelector("iframe");
    
    if (!sourceTab || !sourceIframe || !activeIframe) return;
    
    // Remove existing split if any
    const existingSplitWrappers = iframeContainer.querySelectorAll(".split-wrapper");
    existingSplitWrappers.forEach(w => {
      while (w.firstChild) {
        iframeContainer.appendChild(w.firstChild);
      }
      w.remove();
    });
    iframeContainer.classList.remove("has-split");
    if (splitInstance) {
      splitInstance.destroy();
      splitInstance = null;
    }
    
    // Create wrapper divs
    const wrap1 = document.createElement("div");
    wrap1.className = "split-wrapper";
    wrap1.style.width = "100%";
    wrap1.style.height = "100%";
    
    const wrap2 = document.createElement("div");
    wrap2.className = "split-wrapper";
    wrap2.style.width = "100%";
    wrap2.style.height = "100%";
    
    // Check which iframe is which for positioning
    const sourceIsActive = sourceIframe === activeIframe;
    
    // Apply layout and border
    if (layout === "left-right") {
      if (targetPosition === "left") {
        // Dropped tab on left, current active on right
        wrap1.style.cssText = "width: 50%; height: 100%; float: left; box-sizing: border-box;";
        wrap2.style.cssText = "width: 50%; height: 100%; float: left; box-sizing: border-box;";
        
        iframeContainer.appendChild(wrap1);
        wrap1.appendChild(sourceIframe);
        iframeContainer.appendChild(wrap2);
        wrap2.appendChild(activeIframe);
      } else {
        // Current active on left, dropped tab on right
        wrap1.style.cssText = "width: 50%; height: 100%; float: left; box-sizing: border-box;";
        wrap2.style.cssText = "width: 50%; height: 100%; float: left; box-sizing: border-box;";
        
        iframeContainer.appendChild(wrap1);
        wrap1.appendChild(activeIframe);
        iframeContainer.appendChild(wrap2);
        wrap2.appendChild(sourceIframe);
      }
      
      // Add resize gutter
      const gutter = document.createElement("div");
      gutter.className = "split-gutter split-gutter-horizontal";
      gutter.style.cssText = "width: 4px; height: 100%; float: left; cursor: col-resize; background: transparent; position: relative; z-index: 10;";
      iframeContainer.appendChild(gutter);
      setupGutterDrag(gutter, wrap1, wrap2, "horizontal");
    } else {
      // top-bottom
      if (targetPosition === "top") {
        // Dropped tab on top, current active on bottom
        wrap1.style.cssText = "width: 100%; height: 50%; float: left; box-sizing: border-box;";
        wrap2.style.cssText = "width: 100%; height: 50%; float: left; box-sizing: border-box;";
        
        iframeContainer.appendChild(wrap1);
        wrap1.appendChild(sourceIframe);
        iframeContainer.appendChild(wrap2);
        wrap2.appendChild(activeIframe);
      } else {
        // Current active on top, dropped tab on bottom
        wrap1.style.cssText = "width: 100%; height: 50%; float: left; box-sizing: border-box;";
        wrap2.style.cssText = "width: 100%; height: 50%; float: left; box-sizing: border-box;";
        
        iframeContainer.appendChild(wrap1);
        wrap1.appendChild(activeIframe);
        iframeContainer.appendChild(wrap2);
        wrap2.appendChild(sourceIframe);
      }
      
      // Add resize gutter
      const gutter = document.createElement("div");
      gutter.className = "split-gutter split-gutter-vertical";
      gutter.style.cssText = "width: 100%; height: 4px; float: left; cursor: row-resize; background: transparent; position: relative; z-index: 10;";
      iframeContainer.appendChild(gutter);
      setupGutterDrag(gutter, wrap1, wrap2, "vertical");
    }
    
    // Make both iframes visible and full size
    sourceIframe.style.display = "block";
    sourceIframe.style.width = "100%";
    sourceIframe.style.height = "100%";
    activeIframe.style.display = "block";
    activeIframe.style.width = "100%";
    activeIframe.style.height = "100%";
    
    // Add split class to container for proper layout
    if (iframeContainer) {
      iframeContainer.classList.add("has-split");
    }
    
    // Activate the dropped tab (sourceTab)
    const allTabs = Array.from(tabList.querySelectorAll("li"));
    for (const tab of allTabs) {
      tab.classList.remove("active");
    }
    sourceTab.classList.add("active");
    
    // Activate the dropped tab's iframe
    const allIframes = Array.from(iframeContainer.querySelectorAll("iframe"));
    for (const iframe of allIframes) {
      iframe.classList.remove("active");
    }
    sourceIframe.classList.add("active");
    activeIframe.classList.remove("active");
    
    // Update URL bars
    const commandBoxInput = document.getElementById("command-box-input");
    const urlInput = document.getElementById("iv");
    if (sourceIframe.dataset.tabUrl) {
      if (commandBoxInput) commandBoxInput.value = sourceIframe.dataset.tabUrl;
      if (urlInput) urlInput.value = sourceIframe.dataset.tabUrl;
    }
  }
  
  // Handle drop on frame container - show layout popup
  if (iframeContainer) {
    iframeContainer.addEventListener("dragover", event => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    });
    
    iframeContainer.addEventListener("drop", event => {
      event.preventDefault();
      const tabId = event.dataTransfer.getData("text/plain");
      if (!tabId) return;
      
      // Store the dropped tab info for when user selects layout
      const sourceTab = tabList.querySelector(`[data-tab-id="${tabId}"]`);
      const sourceIframe = iframeContainer.querySelector(`[data-tab-id="${tabId}"]`);
      
      if (!sourceTab || !sourceIframe) return;
      
      // Show the layout popup instead of applying split directly
      if (layoutPopupIsland) {
        // Store the tab info on the popup for the click handler
        layoutPopupIsland.dataset.pendingTabId = tabId;
        layoutPopupIsland.classList.add("is-visible");
      }
      
      // Also reset drag state since dragend might not fire reliably
      dragTab = null;
      draggedTabId = null;
});
  }
  
  // Setup gutter drag for resizing split panes
  function setupGutterDrag(gutter, wrap1, wrap2, direction) {
    let isDragging = false;
    let startPos = 0;
    let startSize1 = 0;
    
    gutter.addEventListener("mousedown", (e) => {
      isDragging = true;
      startPos = direction === "horizontal" ? e.clientX : e.clientY;
      startSize1 = direction === "horizontal" ? wrap1.offsetWidth : wrap1.offsetHeight;
      document.body.style.cursor = direction === "horizontal" ? "col-resize" : "row-resize";
      document.body.style.userSelect = "none";
      e.preventDefault();
    });
    
    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      
      const container = iframeContainer.getBoundingClientRect();
      const currentPos = direction === "horizontal" ? e.clientX : e.clientY;
      const delta = currentPos - startPos;
      let newSize1 = startSize1 + delta;
      const containerSize = direction === "horizontal" ? container.width : container.height;
      
      const minSize = 100;
      const maxSize = containerSize - minSize;
      newSize1 = Math.max(minSize, Math.min(maxSize, newSize1));
      
      const size1Percent = (newSize1 / containerSize) * 100;
      const size2Percent = 100 - size1Percent;
      
      if (direction === "horizontal") {
        wrap1.style.width = size1Percent + "%";
        wrap2.style.width = size2Percent + "%";
      } else {
        wrap1.style.height = size1Percent + "%";
        wrap2.style.height = size2Percent + "%";
      }
    });
    
    document.addEventListener("mouseup", () => {
      if (isDragging) {
        isDragging = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    });
  }

  createNewTab();

  // Check if command box should auto-open from Ctrl+K outside tabs
  const shouldOpenCommandBox = sessionStorage.getItem("openCommandBox");
  if (shouldOpenCommandBox) {
    sessionStorage.removeItem("openCommandBox");
  }

  // Command Box Functionality
  const commandBoxOverlay = document.getElementById("command-box-overlay");
  const commandBoxInput = document.getElementById("command-box-input");
  const commandBoxSuggestions = document.getElementById("command-box-suggestions");
  let currentSuggestionIndex = -1;
  let suggestions = [];
  window._tabsCommandLastWasMenu = window._tabsCommandLastWasMenu || false;

  function filterSuggestions(query) {
    // Check for /a, /games, /b, /apps shortcuts first
    const lowerQuery = query.toLowerCase().trim();
    currentSuggestionIndex = -1;
    const isGamesPrefix = lowerQuery.startsWith("/a") || lowerQuery.startsWith("/games");
    const isAppsPrefix = lowerQuery.startsWith("/b") || lowerQuery.startsWith("/apps");
    const isMenuQuery = isGamesPrefix || isAppsPrefix;
    // If we were showing a menu and now left it, animate existing items out
    if (window._tabsCommandLastWasMenu && !isMenuQuery && commandBoxSuggestions && commandBoxSuggestions.children.length) {
      // if the user cleared the input entirely, collapse the command box instead of closes it
      if (!lowerQuery) {
        const commandBox = document.querySelector('.command-box');
        if (commandBox) {
          commandBox.classList.remove('expanded');
          // Animate collapse with Motion library
          const motion = window.Motion;
          if (motion?.animate) {
            motion.animate(
              commandBox,
              { maxHeight: ["80vh", "50px"] },
              { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
            );
            // Fade out suggestions
            motion.animate(
              commandBoxSuggestions,
              { opacity: [1, 0] },
              { duration: 0.25, ease: [0.22, 1, 0.36, 1] }
            );
          }
          setTimeout(() => {
            commandBox.classList.add('collapsed');
          }, 25);
        }
        commandBoxSuggestions.innerHTML = "";
        window._tabsCommandLastWasMenu = false;
        return;
      }
      Array.from(commandBoxSuggestions.children).forEach(c => { c.classList.remove('entering'); c.classList.add('exiting'); });
      setTimeout(() => {
        // Don't reset the flag yet; let it reset when normal suggestions are rendered
        // continue with normal suggestion flow
        filterSuggestions(query);
      }, 220);
      return;
    }
    if (isGamesPrefix) {
      // Expand the command box if it was collapsed
      const commandBox = document.querySelector('.command-box');
      if (commandBox && commandBox.classList.contains('collapsed')) {
        commandBox.classList.remove('collapsed');
        const motion = window.Motion;
        if (motion?.animate) {
          motion.animate(
            commandBox,
            { maxHeight: ["50px", "80vh"] },
            { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
          );
          motion.animate(
            commandBoxSuggestions,
            { opacity: [0, 1] },
            { duration: 0.25, ease: [0.22, 1, 0.36, 1] }
          );
        }
        commandBox.classList.add('expanded');
      }
      // Fetch games list
      fetch("/assets/json/g.json")
        .then(res => res.json())
        .then(games => {
          // allow trailing filter text after the command
          let filterTerm = "";
          if (lowerQuery.startsWith("/games")) filterTerm = lowerQuery.replace(/^\/games\s*/, '');
          else filterTerm = lowerQuery.replace(/^\/a\s*/, '');
          const list = filterTerm ? games.filter(g => g.name.toLowerCase().includes(filterTerm)) : games;
          suggestions = list.map((g, idx) => ({
            title: g.name,
            url: g.link,
            icon: 'gamepad-2',
            isMenuItem: true
          }));
          renderSuggestions();
          window._tabsCommandLastWasMenu = true;
        })
        .catch(err => {
          console.error("Error loading games:", err);
          suggestions = [];
          renderSuggestions();
        });
      return;
    } else if (isAppsPrefix) {
      // Expand the command box if it was collapsed
      const commandBox = document.querySelector('.command-box');
      if (commandBox && commandBox.classList.contains('collapsed')) {
        commandBox.classList.remove('collapsed');
        const motion = window.Motion;
        if (motion?.animate) {
          motion.animate(
            commandBox,
            { maxHeight: ["50px", "80vh"] },
            { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
          );
          motion.animate(
            commandBoxSuggestions,
            { opacity: [0, 1] },
            { duration: 0.25, ease: [0.22, 1, 0.36, 1] }
          );
        }
        commandBox.classList.add('expanded');
      }
      // Fetch apps list
      fetch("/assets/json/a.json")
        .then(res => res.json())
        .then(apps => {
          let filterTerm = "";
          if (lowerQuery.startsWith("/apps")) filterTerm = lowerQuery.replace(/^\/apps\s*/, '');
          else filterTerm = lowerQuery.replace(/^\/b\s*/, '');
          const list = filterTerm ? apps.filter(a => a.name.toLowerCase().includes(filterTerm)) : apps;
          suggestions = list.map((a, idx) => ({
            title: a.name,
            url: a.link,
            icon: 'smartphone',
            isMenuItem: true
          }));
          renderSuggestions();
          window._tabsCommandLastWasMenu = true;
        })
        .catch(err => {
          console.error("Error loading apps:", err);
          suggestions = [];
          renderSuggestions();
        });
      return;
    } else if (!query.trim()) {
      suggestions = getSortedSuggestions();
      // Reset menu flag when showing default suggestions
      window._tabsCommandLastWasMenu = false;
    } else {
      const allSuggestions = getSortedSuggestions();
      suggestions = allSuggestions.filter(s =>
        s.title.toLowerCase().includes(lowerQuery) ||
        s.url.toLowerCase().includes(lowerQuery)
      );
      // Reset menu flag when showing filtered suggestions
      window._tabsCommandLastWasMenu = false;
    }
    renderSuggestions();
  }

  function navigateToSuggestion(suggestion) {
    trackSearch(suggestion.url);
    commandBoxInput.value = suggestion.url;
    const enterEvent = new KeyboardEvent("keydown", { key: "Enter" });
    commandBoxInput.dispatchEvent(enterEvent);
    closeCommandBox();
  }

  function openCommandBox() {
    if (!commandBoxOverlay) return;
    commandBoxOverlay.classList.add("active");
    commandBoxInput.value = urlInput ? urlInput.value || "" : "";
    commandBoxInput.focus();
    commandBoxInput.select();
    filterSuggestions("");
  }

  function closeCommandBox() {
    if (!commandBoxOverlay) return;
    commandBoxOverlay.classList.remove("active");
    commandBoxInput.value = "";
    commandBoxSuggestions.innerHTML = "";
  }

  function renderSuggestions() {
    commandBoxSuggestions.innerHTML = "";
    // Do not visually highlight the input for menu commands (user requested no highlighting)
    commandBoxInput.style.background = "transparent";
    commandBoxInput.style.backgroundClip = "unset";
    commandBoxInput.style.webkitBackgroundClip = "unset";

    suggestions.forEach((suggestion, idx) => {
      const div = document.createElement("div");
      div.className = suggestion.isMenuItem ? "command-box-suggestion command-box-menu-item entering" : "command-box-suggestion entering";
      
      const iconHtml = `<i data-lucide="${suggestion.icon || 'globe'}" class="suggestion-icon"></i>`;
      div.innerHTML = `\n        ${iconHtml}\n        <div class="suggestion-content">\n          <div class="suggestion-title">${suggestion.title}</div>\n        </div>\n      `;
      
      div.addEventListener("click", () => {
        if (suggestion.isMenuItem) {
          tabsOpenTarget(suggestion.url, "auto");
          closeCommandBox();
        } else {
          navigateToSuggestion(suggestion);
        }
      });
      
      commandBoxSuggestions.appendChild(div);
    });
    // initialize lucide icons in the newly added nodes
    window.lucide?.createIcons();
    // animate entering -> entered
    requestAnimationFrame(() => {
      commandBoxSuggestions.querySelectorAll('.command-box-suggestion.entering').forEach(el => {
        el.classList.remove('entering');
        el.classList.add('entered');
      });
    });
  }

  // Auto-open command box if coming from Ctrl+K outside tabs
  if (shouldOpenCommandBox) {
    setTimeout(() => {
      openCommandBox();
    }, 100);
  }

  // Click on URL bar opens command box
  if (urlInput) {
    urlInput.addEventListener("click", openCommandBox);
  }

  // Click outside command box closes it
  if (commandBoxOverlay) {
    commandBoxOverlay.addEventListener("click", (e) => {
      if (e.target === commandBoxOverlay) {
        closeCommandBox();
      }
    });
  }

  // Input handling
  if (commandBoxInput) {
    commandBoxInput.addEventListener("input", (e) => {
      filterSuggestions(e.target.value);
    });

    commandBoxInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeCommandBox();
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (currentSuggestionIndex >= 0) {
          const items = commandBoxSuggestions.querySelectorAll(".command-box-suggestion");
          items[currentSuggestionIndex].click();
        } else {
          const value = commandBoxInput.value.trim();
          if (value && urlInput) {
            urlInput.value = value;
            const enterEvent = new KeyboardEvent("keydown", { key: "Enter" });
            urlInput.dispatchEvent(enterEvent);
          }
          closeCommandBox();
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        currentSuggestionIndex = Math.min(currentSuggestionIndex + 1, suggestions.length - 1);
        updateSuggestionHighlight();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        currentSuggestionIndex = Math.max(currentSuggestionIndex - 1, -1);
        updateSuggestionHighlight();
      }
    });
  }

  function updateSuggestionHighlight() {
    const items = commandBoxSuggestions.querySelectorAll(".command-box-suggestion");
    items.forEach((item, index) => {
      if (index === currentSuggestionIndex) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });
    if (currentSuggestionIndex >= 0) {
      const sel = items[currentSuggestionIndex];
      requestAnimationFrame(() => {
        if (sel && typeof sel.scrollIntoView === 'function') {
          try { sel.scrollIntoView({ block: 'nearest', behavior: 'auto' }); } catch (e) { /* ignore */ }
        }
      });
    }
  }

  // Add new tab opens command box
  if (addTabButton) {
    addTabButton.addEventListener("click", () => {
      setTimeout(() => {
        openCommandBox();
      }, 100);
    });
  }

  // Global Ctrl+K handler (with capture phase to work even when iframe is focused)
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      openCommandBox();
    }
  }, true);

  // Global Escape handler to close command box even when iframe is focused
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && commandBoxOverlay && commandBoxOverlay.classList.contains("active")) {
      e.preventDefault();
      e.stopPropagation();
      closeCommandBox();
    }
  }, true); // Use capture phase

  // Listen for postMessage from iframes (for Ctrl+K inside iframes)
  window.addEventListener("message", (event) => {
    if (event.data && event.data.type === "openCommandBox") {
      openCommandBox();
      return;
    }

    if (event.data && event.data.type === "infrared-tabs:alert") {
      const message = typeof event.data.message === "string" ? event.data.message : String(event.data.message ?? "");
      showTabsToast(message);
      return;
    }

    if (event.data && event.data.type === "infrared-tabs:confirm") {
      showTabsToast("Confirm not supported");
      return;
    }

    if (event.data && event.data.type === "infrared-tabs:prompt") {
      showTabsToast("Prompt not supported");
      return;
    }

    if (event.origin !== window.location.origin) {
      return;
    }

    if (event.data && event.data.type === "infrared-shell:open-tab-target") {
      tabsOpenTarget(event.data.target, event.data.mode || "auto");
    }
  });
});

function showTabsToast(message) {
  const text = (message || "").trim();
  if (!text) {
    return;
  }

  const { host, stack, dim, glow } = ensureToastHost();
  dim.classList.add("is-visible");
  glow.classList.add("is-visible");

  const item = document.createElement("div");
  item.className = "tabs-toast-inner";
  item.setAttribute("role", "status");
  item.setAttribute("aria-live", "polite");

  const toastText = document.createElement("div");
  toastText.className = "tabs-toast-text";
  toastText.textContent = text;

  const toastAction = document.createElement("button");
  toastAction.type = "button";
  toastAction.className = "tabs-toast-action";
  toastAction.title = "Copy message";
  toastAction.setAttribute("aria-label", "Copy message");
  toastAction.innerHTML = `<i data-lucide="copy"></i>`;

  toastAction.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(toastText.textContent || "");
      showTabsToast("Copied to clipboard");
    } catch (e) {
      // ignore
    }
  });

  item.appendChild(toastText);
  item.appendChild(toastAction);
  stack.appendChild(item);
  host.classList.add("is-visible");

  // Cap stack so it doesn't grow forever.
  const items = Array.from(stack.querySelectorAll(".tabs-toast-inner"));
  if (items.length > 4) {
    for (const extra of items.slice(0, items.length - 4)) {
      extra.remove();
    }
  }

  // Trigger fade-in for the new item (next frame so transition applies).
  requestAnimationFrame(() => {
    window.lucide?.createIcons?.();
    item.style.opacity = "1";
    item.style.transform = "translateY(0)";
  });

  // Auto-remove this toast.
  const hideTimer = setTimeout(() => {
    item.classList.remove("is-visible");
    item.style.opacity = "0";
    item.style.transform = "translateY(8px)";
    setTimeout(() => {
      item.remove();
      cleanupToastHostIfEmpty();
    }, 220);
  }, 2600);

  // Store so we can cancel if needed later (not currently used).
  item._infraredTimer = hideTimer;
}

function ensureToastHost() {
  let host = document.getElementById("infrared-tabs-toast");
  let dim = document.getElementById("infrared-tabs-toast-dim");
  let glow = document.getElementById("infrared-tabs-toast-glow");

  if (!dim) {
    dim = document.createElement("div");
    dim.id = "infrared-tabs-toast-dim";
    dim.className = "tabs-toast-dim";
    document.body.appendChild(dim);
  }

  if (!glow) {
    glow = document.createElement("div");
    glow.id = "infrared-tabs-toast-glow";
    glow.className = "tabs-toast-glow";
    document.body.appendChild(glow);
  }

  if (!host) {
    host = document.createElement("div");
    host.id = "infrared-tabs-toast";
    host.className = "tabs-toast";

    const stack = document.createElement("div");
    stack.className = "tabs-toast-stack";
    host.appendChild(stack);
    document.body.appendChild(host);
  }

  const stack = host.querySelector(".tabs-toast-stack");
  return { host, stack, dim, glow };
}

function cleanupToastHostIfEmpty() {
  const host = document.getElementById("infrared-tabs-toast");
  const dim = document.getElementById("infrared-tabs-toast-dim");
  const glow = document.getElementById("infrared-tabs-toast-glow");
  const stack = host?.querySelector(".tabs-toast-stack");
  const hasItems = !!stack?.querySelector(".tabs-toast-inner");

  if (!hasItems) {
    host?.classList.remove("is-visible");
    if (dim) {
      dim.classList.remove("is-visible");
    }
    if (glow) {
      glow.classList.remove("is-visible");
    }
  }
}

// Reload
function reload() {
  const activeIframe = document.querySelector("#frame-container iframe.active");
  if (activeIframe) {
    // biome-ignore lint/correctness/noSelfAssign:
    activeIframe.src = activeIframe.src;
    Load();
  } else {
    console.error("No active iframe found");
  }
}

// Popout
function popout() {
  const activeIframe = document.querySelector("#frame-container iframe.active");
  if (activeIframe) {
    const newWindow = window.open("about:blank", "_blank");
    if (newWindow) {
      const name = localStorage.getItem("name") || "My Drive - Google Drive";
      const icon =
        localStorage.getItem("icon") ||
        "https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png";
      newWindow.document.title = name;
      const link = newWindow.document.createElement("link");
      link.rel = "icon";
      link.href = encodeURI(icon);
      newWindow.document.head.appendChild(link);

      const newIframe = newWindow.document.createElement("iframe");
      const style = newIframe.style;
      style.position = "fixed";
      style.top = style.bottom = style.left = style.right = 0;
      style.border = style.outline = "none";
      style.width = style.height = "100%";

      newIframe.src = activeIframe.src;

      newWindow.document.body.appendChild(newIframe);
    }
  } else {
    console.error("No active iframe found");
  }
}

function eToggle() {
  const activeIframe = document.querySelector("#frame-container iframe.active");
  if (!activeIframe) {
    console.error("No active iframe found");
    return;
  }
  const erudaWindow = activeIframe.contentWindow;
  if (!erudaWindow) {
    console.error("No content window found for the active iframe");
    return;
  }
  if (erudaWindow.eruda) {
    if (erudaWindow.eruda._isInit) {
      erudaWindow.eruda.destroy();
    } else {
      console.error("Eruda is not initialized in the active iframe");
    }
  } else {
    const erudaDocument = activeIframe.contentDocument;
    if (!erudaDocument) {
      console.error("No content document found for the active iframe");
      return;
    }
    const script = erudaDocument.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/eruda";
    script.onload = () => {
      if (!erudaWindow.eruda) {
        console.error("Failed to load Eruda in the active iframe");
        return;
      }
      erudaWindow.eruda.init();
      erudaWindow.eruda.show();
    };
    erudaDocument.head.appendChild(script);
  }
}
// Fullscreen
function FS() {
  const activeIframe = document.querySelector("#frame-container iframe.active");
  if (activeIframe) {
    if (activeIframe.contentDocument.fullscreenElement) {
      activeIframe.contentDocument.exitFullscreen();
    } else {
      activeIframe.contentDocument.documentElement.requestFullscreen();
    }
  } else {
    console.error("No active iframe found");
  }
}
const fullscreenButton = document.getElementById("fullscreen-button");
fullscreenButton.addEventListener("click", FS);
// Home
function Home() {
  if (!window.InfraredShellBridge?.navigate("home")) {
    window.location.href = "/";
  }
}
const homeButton = document.getElementById("back-home-button") || document.getElementById("home-page");
if (homeButton) {
  homeButton.addEventListener("click", Home);
}
// Back
function goBack() {
  const activeIframe = document.querySelector("#frame-container iframe.active");
  if (activeIframe) {
    activeIframe.contentWindow.history.back();
    iframe.src = activeIframe.src;
    Load();
  } else {
    console.error("No active iframe found");
  }
}
// Forward
function goForward() {
  const activeIframe = document.querySelector("#frame-container iframe.active");
  if (activeIframe) {
    activeIframe.contentWindow.history.forward();
    iframe.src = activeIframe.src;
    Load();
  } else {
    console.error("No active iframe found");
  }
}
// Toggle Tabs Sidebar
document.addEventListener("DOMContentLoaded", () => {
  const tb = document.getElementById("tabs-button");
  const listWrapper = document.getElementById("tabs-list-wrapper");
  if (!tb || !listWrapper) return;
  tb.addEventListener("click", () => {
    if (listWrapper.classList.contains("is-hidden")) {
      listWrapper.classList.remove("is-hidden");
      tb.querySelector("i").classList.remove("fa-magnifying-glass-plus");
      tb.querySelector("i").classList.add("fa-magnifying-glass-minus");
    } else {
      listWrapper.classList.add("is-hidden");
      tb.querySelector("i").classList.remove("fa-magnifying-glass-minus");
      tb.querySelector("i").classList.add("fa-magnifying-glass-plus");
    }
  });
});
if (navigator.userAgent.includes("Chrome") && navigator.keyboard && navigator.keyboard.lock) {
  window.addEventListener("resize", () => {
    navigator.keyboard.lock(["Escape"]);
  });
}
function Load() {
  const activeIframe = document.querySelector("#frame-container iframe.active");
  if (
    activeIframe &&
    activeIframe.contentWindow.document.readyState === "complete"
  ) {
    const website = activeIframe.contentWindow.document.location.href;
    if (website.includes("/a/")) {
      const websitePath = website
        .replace(window.location.origin, "")
        .replace("/a/", "");
      localStorage.setItem("decoded", websitePath);
      const decodedValue = __uv$config ? __uv$config.decodeUrl(websitePath) : decodeXor(websitePath);
      document.getElementById("iv").value = decodedValue;
    } else if (website.includes("/a/q/")) {
      const websitePath = website
        .replace(window.location.origin, "")
        .replace("/a/q/", "");
      const decodedValue = __uv$config ? __uv$config.decodeUrl(websitePath) : decodeXor(websitePath);
      localStorage.setItem("decoded", websitePath);
      document.getElementById("iv").value = decodedValue;
    } else {
      const websitePath = website.replace(window.location.origin, "");
      // Don't show search-start.html in the URL bar, keep it empty with placeholder
      if (!websitePath.includes("search-start.html")) {
        document.getElementById("iv").value = websitePath;
        localStorage.setItem("decoded", websitePath);
      }
    }
  }
}
function decodeXor(input) {
  if (!input) {
    return input;
  }
  const [str, ...search] = input.split("?");
  return (
    decodeURIComponent(str)
      .split("")
      .map((char, ind) =>
        ind % 2 ? String.fromCharCode(char.charCodeAt() ^ 2) : char,
      )
      .join("") + (search.length ? `?${search.join("?")}` : "")
  );
}
