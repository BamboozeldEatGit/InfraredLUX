// t.js
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
    const searchBase = localStorage.getItem("engine") || "https://duckduckgo.com/?q=";
    return `${searchBase}${encodeURIComponent(query)}`;
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
    const isRayser = localStorage.getItem("rayser") === "true";
    if (isRayser) {
      const proxyBase = "https://ojlbvfuijh3093ic-0o91uih.teition.com/";
      const proxyUrl = proxyBase + "?url=" + encodeURIComponent(url);
      const iframeContainer = document.getElementById("frame-container");
      const activeIframe = Array.from(iframeContainer.querySelectorAll("iframe")).find(
        iframe => iframe.classList.contains("active"),
      );
      fetch(proxyUrl)
        .then(r => r.text())
        .then(html => {
          const navScript = `<script>(function(){function sendNav(u){window.parent.postMessage({type:'rayser-navigate',url:u},'*');}document.addEventListener('click',e=>{const a=e.target.closest('a');if(a&&a.href){e.preventDefault();sendNav(a.href);}},true);document.addEventListener('submit',e=>{const f=e.target;if(f&&f.action){e.preventDefault();const p=new URLSearchParams(new FormData(f)).toString();sendNav(f.action+(f.method?.toLowerCase()==='get'&&p?'?'+p:''));}},true);window.location.assign=u=>sendNav(u);window.location.replace=u=>sendNav(u);Object.defineProperty(window.location,'href',{set:u=>sendNav(u)});})();</script>`;
          const finalHtml = html.includes('</body>') ? html.replace('</body>', navScript + '</body>') : html + navScript;
          const realUrl = sanitizeUrlInput(new URL(proxyUrl).searchParams.get("url") || url);
          activeIframe.dataset.rayserProxy = proxyUrl;
          activeIframe.dataset.tabUrl = realUrl;
          input.value = realUrl;
          const cmdInput = document.getElementById("command-box-input");
          if (cmdInput) cmdInput.value = realUrl;
          console.log("[Rayser] Initial open set URL →", realUrl);

          activeIframe.srcdoc = finalHtml;
        })
        .catch(() => {
          activeIframe.srcdoc = "<h1>Proxy error</h1>";
        });
      console.log("Rayser Proxy URL:", proxyUrl);
      return;
    }
    if (typeof __uv$config === 'undefined') {
      console.error('__uv$config not available');
      return;
    }
    try {
      const encodedUrl = __uv$config.encodeUrl(url);
      sessionStorage.setItem("GoUrl", encodedUrl);
      const iframeContainer = document.getElementById("frame-container");
      const activeIframe = Array.from(iframeContainer.querySelectorAll("iframe")).find(
        iframe => iframe.classList.contains("active"),
      );
      activeIframe.src = `/a/${encodedUrl}`;
      activeIframe.dataset.tabUrl = url;
      input.value = url;
      console.log("Original URL:", url);
      console.log("Encoded URL:", encodedUrl);
    } catch (error) {
      console.error("Error encoding URL:", error);
    }
  }
  function isUrl(val = "") {
    if (
      /^http(s?):\/\//.test(val) ||
      (val.includes(".") && val.substr(0, 1) !== " ")
    ) {
      return true;
    }
    return false;
  }
  function prependHttps(url) {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return `https://${url}`;
    }
    return url;
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

    // Keep URL bar in sync (same pattern as title) - Rayser safe
    const urlInput = document.getElementById("iv");
    if (urlInput && iframe.dataset.tabUrl) {
      const full = sanitizeUrlInput(iframe.dataset.tabUrl);
      const val = (urlInput === document.activeElement) ? full : (full.split('/')[2] || full);
      urlInput.value = val;
      console.log("[Rayser] updateTabMetadata set URL →", val);
    }
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
    } else {
      console.log("No selected iframe found with ID:", tabId);
    }
  }
  let dragTab = null;
  tabList.addEventListener("dragstart", event => {
    dragTab = event.target;
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
  });
  createNewTab();
});

// Reload
function reload() {
  const activeIframe = document.querySelector("#frame-container iframe.active");
  if (activeIframe) {
    if (activeIframe.srcdoc) {
      const proxyUrl = activeIframe.dataset.rayserProxy || (() => {
        const u = activeIframe.dataset.tabUrl;
        return u ? "https://ojlbvfuijh3093ic-0o91uih.teition.com/?url=" + encodeURIComponent(u) : null;
      })();
      if (proxyUrl) {
        fetch(proxyUrl).then(r => r.text()).then(html => {
          const real = sanitizeUrlInput(new URL(proxyUrl).searchParams.get("url"));
          activeIframe.dataset.rayserProxy = proxyUrl;
          if (real) activeIframe.dataset.tabUrl = real;
          console.log("[Rayser] Reload set URL →", real);
          const navScript = `<script>(function(){function sendNav(u){window.parent.postMessage({type:'rayser-navigate',url:u},'*');}document.addEventListener('click',e=>{const a=e.target.closest('a');if(a&&a.href){e.preventDefault();sendNav(a.href);}},true);document.addEventListener('submit',e=>{const f=e.target;if(f&&f.action){e.preventDefault();const p=new URLSearchParams(new FormData(f)).toString();sendNav(f.action+(f.method?.toLowerCase()==='get'&&p?'?'+p:''));}},true);window.location.assign=u=>sendNav(u);window.location.replace=u=>sendNav(u);Object.defineProperty(window.location,'href',{set:u=>sendNav(u)});})();</script>`;
          const final = html.includes('</body>') ? html.replace('</body>', navScript + '</body>') : html + navScript;
          activeIframe.srcdoc = final;
        });
      }
    } else {
      activeIframe.src = activeIframe.src;
    }
    Load();
  } else {
    console.error("No active iframe found");
  }
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

      if (activeIframe.srcdoc) {
        newIframe.srcdoc = activeIframe.srcdoc;
      } else {
        newIframe.src = activeIframe.src;
      }

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
  window.location.href = "./";
}
const homeButton = document.getElementById("home-page");
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

  // Command Box Functionality
  const commandBoxOverlay = document.getElementById("command-box-overlay");
  const commandBoxInput = document.getElementById("command-box-input");
  const urlInput = document.getElementById("iv");

  function openCommandBox() {
    if (!commandBoxOverlay) return;
    commandBoxOverlay.classList.add("active");
    commandBoxInput.value = urlInput.value || "";
    commandBoxInput.focus();
    commandBoxInput.select();
  }

  function closeCommandBox() {
    if (!commandBoxOverlay) return;
    commandBoxOverlay.classList.remove("active");
    commandBoxInput.value = "";
  }

  if (urlInput) {
    urlInput.addEventListener("click", openCommandBox);

    // Hard sanitize: never allow Rayser proxy string in the box
    const sanitizeInputs = () => {
      if (urlInput) urlInput.value = sanitizeUrlInput(urlInput.value);
      const cmd = document.getElementById("command-box-input");
      if (cmd) cmd.value = sanitizeUrlInput(cmd.value);
    };
    urlInput.addEventListener("input", sanitizeInputs);
    urlInput.addEventListener("blur", sanitizeInputs);

    // Rayser-friendly URL display: show only domain when not focused
    urlInput.addEventListener("blur", () => {
      const activeIframe = document.querySelector("#frame-container iframe.active");
      if (activeIframe && activeIframe.dataset.tabUrl) {
        const full = sanitizeUrlInput(activeIframe.dataset.tabUrl);
        urlInput.value = full.split('/')[2] || full;
      }
    });
    urlInput.addEventListener("focus", () => {
      const activeIframe = document.querySelector("#frame-container iframe.active");
      if (activeIframe && activeIframe.dataset.tabUrl) {
        urlInput.value = sanitizeUrlInput(activeIframe.dataset.tabUrl);
      }
    });
  }

  if (commandBoxOverlay) {
    commandBoxOverlay.addEventListener("click", (e) => {
      if (e.target === commandBoxOverlay) {
        closeCommandBox();
      }
    });
  }

  if (commandBoxInput) {
    commandBoxInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeCommandBox();
      } else if (e.key === "Enter") {
        e.preventDefault();
        const value = commandBoxInput.value.trim();
        if (value) {
          urlInput.value = value;
          // Trigger the same logic as the URL input
          const event = new KeyboardEvent("keydown", { key: "Enter" });
          urlInput.dispatchEvent(event);
        }
        closeCommandBox();
      }
    });
  }

  // Open command box when adding a new tab
  const addTabButton = document.getElementById("add-tab");
  if (addTabButton) {
    addTabButton.addEventListener("click", () => {
      setTimeout(() => {
        openCommandBox();
      }, 100);
    });
  }
});
if (navigator.userAgent.includes("Chrome") && navigator.keyboard && navigator.keyboard.lock) {
  window.addEventListener("resize", () => {
    navigator.keyboard.lock(["Escape"]);
  });
}
function Load() {
  const activeIframe = document.querySelector("#frame-container iframe.active");
  if (activeIframe) {
    // Always prefer stored real URL for Rayser (never show proxy or about:srcdoc)
    if (activeIframe.dataset.tabUrl) {
      const raw = sanitizeUrlInput(activeIframe.dataset.tabUrl);
      const display = document.getElementById("iv") === document.activeElement 
        ? raw 
        : (raw.split('/')[2] || raw);
      document.getElementById("iv").value = display;
      console.log("[Rayser] Load() used dataset.tabUrl →", display);
      return;
    }
    if (!activeIframe.contentWindow || activeIframe.contentWindow.document.readyState !== "complete") return;
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

// Hard block for Rayser proxy URL ever appearing in the address bar
function sanitizeUrlInput(val) {
  if (!val) return val;
  const bad = "https://ojlbvfuijh3093ic-0o91uih.teition.com/?url=";
  if (val.includes(bad)) {
    return val.split(bad)[1] || val;
  }
  return val;
}

// Rayser navigation re-render handler (for link clicks inside srcdoc)
window.addEventListener("message", (event) => {
  if (event.data && event.data.type === "rayser-navigate" && event.data.url) {
    const activeIframe = document.querySelector("#frame-container iframe.active");
    if (activeIframe) {
      const proxyBase = "https://ojlbvfuijh3093ic-0o91uih.teition.com/";
      const newProxyUrl = proxyBase + "?url=" + encodeURIComponent(event.data.url);
      fetch(newProxyUrl)
        .then(r => r.text())
        .then(html => {
          const navScript = `<script>(function(){function sendNav(u){window.parent.postMessage({type:'rayser-navigate',url:u},'*');}document.addEventListener('click',e=>{const a=e.target.closest('a');if(a&&a.href){e.preventDefault();sendNav(a.href);}},true);document.addEventListener('submit',e=>{const f=e.target;if(f&&f.action){e.preventDefault();const p=new URLSearchParams(new FormData(f)).toString();sendNav(f.action+(f.method?.toLowerCase()==='get'&&p?'?'+p:''));}},true);window.location.assign=u=>sendNav(u);window.location.replace=u=>sendNav(u);Object.defineProperty(window.location,'href',{set:u=>sendNav(u)});})();</script>`;
          const final = html.includes('</body>') ? html.replace('</body>', navScript + '</body>') : html + navScript;
          const realUrl = sanitizeUrlInput(new URL(newProxyUrl).searchParams.get("url") || event.data.url);
          activeIframe.dataset.rayserProxy = newProxyUrl;
          activeIframe.dataset.tabUrl = realUrl;
          const uInput = document.getElementById("iv");
          const cmdInput = document.getElementById("command-box-input");
          if (uInput) uInput.value = realUrl;
          if (cmdInput) cmdInput.value = realUrl;
          console.log("[Rayser] Link navigation set URL →", realUrl);

          activeIframe.srcdoc = final;
        })
        .catch(() => { activeIframe.srcdoc = "<h1>Proxy error</h1>"; });
    }
  }
});
