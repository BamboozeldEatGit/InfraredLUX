(() => {
  const origin = window.location.origin;
  const pageToHash = {
    home: "#/home",
    games: "#/a",
    apps: "#/b",
    tabs: "#/d",
    settings: "#/c",
  };
  const routeToPageId = new Map([
    ["/", "home"],
    ["/home", "home"],
    ["/index.html", "home"],
    ["/a", "games"],
    ["/play.html", "games"],
    ["/b", "apps"],
    ["/c", "settings"],
    ["/d", "tabs"],
  ]);

  const pageFrames = new Map(
    Array.from(document.querySelectorAll("[data-shell-page]")).map(frame => [frame.dataset.shellPage, frame]),
  );
  const loadedPages = new Set();
  const activatedPages = new Set();

  const preloader = document.getElementById("page-preloader");
  const preloaderBarline = document.getElementById("page-preloader-barline");

  function updatePreloader() {
    if (!preloader) {
      return;
    }

    const total = Math.max(pageFrames.size, 1);
    const loaded = loadedPages.size;
    const width = 20;
    const filled = Math.max(0, Math.min(width, Math.round((loaded / total) * width)));
    if (preloaderBarline) {
      preloaderBarline.textContent = `[${"#".repeat(filled)}${".".repeat(width - filled)}]`;
    }

    if (loaded >= total) {
      preloader.classList.add("is-hidden");
      preloader.setAttribute("aria-hidden", "true");
    } else {
      preloader.classList.remove("is-hidden");
      preloader.setAttribute("aria-hidden", "false");
    }
  }

  // Safety: don't block forever if a frame never loads.
  window.setTimeout(() => {
    if (loadedPages.size < pageFrames.size) {
      preloader?.classList.add("is-hidden");
      preloader?.setAttribute("aria-hidden", "true");
    }
  }, 8000);

  let activePageId = null;
  let pendingTabsTarget = null;

  function normalizePageId(value) {
    if (!value || typeof value !== "string") {
      return null;
    }

    if (pageFrames.has(value)) {
      return value;
    }

    let candidate = value.trim();

    if (!candidate) {
      return null;
    }

    if (candidate.startsWith("#")) {
      candidate = candidate.slice(1) || "/";
    }

    try {
      candidate = new URL(candidate, origin).pathname;
    } catch (error) {
      if (!candidate.startsWith("/")) {
        candidate = `/${candidate}`;
      }
    }

    return routeToPageId.get(candidate) || null;
  }

  function postToPage(pageId, message) {
    const frame = pageFrames.get(pageId);

    if (!frame?.contentWindow) {
      return;
    }

    frame.contentWindow.postMessage(message, origin);
  }

  function updateFrameVisibility(nextPageId) {
    pageFrames.forEach((frame, pageId) => {
      const isActive = pageId === nextPageId;
      frame.classList.toggle("is-active", isActive);
      frame.setAttribute("aria-hidden", String(!isActive));
    });
  }

  function syncHash(pageId) {
    const nextHash = pageToHash[pageId];

    if (!nextHash || window.location.hash === nextHash) {
      return;
    }

    history.replaceState(null, "", nextHash);
  }

  function flushPendingTabsTarget() {
    if (!pendingTabsTarget) {
      return;
    }

    const tabsFrame = pageFrames.get("tabs");

    if (!tabsFrame?.contentWindow || !loadedPages.has("tabs")) {
      return;
    }

    postToPage("tabs", {
      type: "infrared-shell:open-tab-target",
      target: pendingTabsTarget.target,
      mode: pendingTabsTarget.mode,
    });

    pendingTabsTarget = null;
  }

  function activatePage(pageId, options = {}) {
    const nextPageId = normalizePageId(pageId) || "home";
    const shouldSyncHash = options.syncHash !== false;
    const previousPageId = activePageId;

    if (!pageFrames.has(nextPageId)) {
      return;
    }

    if (previousPageId && previousPageId !== nextPageId && loadedPages.has(previousPageId)) {
      postToPage(previousPageId, {
        type: "infrared-shell:deactivate",
        pageId: previousPageId,
        nextPageId,
      });
    }

    activePageId = nextPageId;
    updateFrameVisibility(nextPageId);

    if (shouldSyncHash) {
      syncHash(nextPageId);
    }

    const firstActivation = !activatedPages.has(nextPageId);

    if (loadedPages.has(nextPageId)) {
      postToPage(nextPageId, {
        type: "infrared-shell:activate",
        pageId: nextPageId,
        previousPageId,
        firstActivation,
      });
      activatedPages.add(nextPageId);
    } else {
      pageFrames.get(nextPageId).dataset.pendingActivation = firstActivation ? "first" : "repeat";
    }

    if (nextPageId === "tabs") {
      flushPendingTabsTarget();
    }
  }

  function openTabsTarget(target, mode = "auto") {
    pendingTabsTarget = { target, mode };
    activatePage("tabs");
    flushPendingTabsTarget();
  }

  pageFrames.forEach((frame, pageId) => {
    frame.addEventListener("load", () => {
      loadedPages.add(pageId);
      updatePreloader();

      const pendingActivation = frame.dataset.pendingActivation;

      if (pendingActivation || activePageId === pageId) {
        const firstActivation = pendingActivation === "first" || !activatedPages.has(pageId);

        postToPage(pageId, {
          type: "infrared-shell:activate",
          pageId,
          previousPageId: activePageId,
          firstActivation,
        });

        activatedPages.add(pageId);
        delete frame.dataset.pendingActivation;
      }

      if (pageId === "tabs") {
        flushPendingTabsTarget();
      }
    });
  });

  updatePreloader();

  window.addEventListener("message", event => {
    if (event.origin !== origin) {
      return;
    }

    const data = event.data || {};

    if (data.type === "infrared-shell:navigate") {
      activatePage(data.pageId || data.href);
    }

    if (data.type === "infrared-shell:open-tabs-target" && data.target) {
      openTabsTarget(data.target, data.mode || "auto");
    }
  });

  window.addEventListener("hashchange", () => {
    const hashPageId = normalizePageId(window.location.hash);

    if (hashPageId && hashPageId !== activePageId) {
      activatePage(hashPageId, { syncHash: false });
    }
  });

  const initialPageId = normalizePageId(window.location.hash) || "home";
  activatePage(initialPageId, { syncHash: false });

  window.InfraredPageShell = {
    activatePage,
    openTabsTarget,
  };
})();
