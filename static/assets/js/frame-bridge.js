(() => {
  const origin = window.location.origin;
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
  const pageIdToRoute = {
    home: "/",
    games: "/a",
    apps: "/b",
    settings: "/c",
    tabs: "/d",
  };

  let isShellEmbedded = false;

  try {
    isShellEmbedded =
      window.parent !== window &&
      window.parent.document?.documentElement?.dataset?.infraredShell === "true";
  } catch (error) {
    isShellEmbedded = false;
  }

  function normalizePageId(value) {
    if (!value || typeof value !== "string") {
      return null;
    }

    if (pageIdToRoute[value]) {
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

  function fallbackRoute(pageIdOrHref) {
    const pageId = normalizePageId(pageIdOrHref);

    if (pageId) {
      return pageIdToRoute[pageId];
    }

    return typeof pageIdOrHref === "string" ? pageIdOrHref : null;
  }

  function dispatchShellEvent(name, detail) {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }

  function setActiveState(isActive, detail = {}) {
    document.documentElement.dataset.shellActive = String(isActive);
    dispatchShellEvent(isActive ? "infrared:shell-activate" : "infrared:shell-deactivate", detail);
  }

  function navigate(pageIdOrHref) {
    const pageId = normalizePageId(pageIdOrHref);

    if (isShellEmbedded && pageId) {
      window.parent.postMessage({ type: "infrared-shell:navigate", pageId }, origin);
      return true;
    }

    const route = fallbackRoute(pageIdOrHref);

    if (route) {
      window.location.href = route;
      return true;
    }

    return false;
  }

  function openTabsTarget(target, options = {}) {
    const mode = options.mode || "auto";

    if (isShellEmbedded) {
      window.parent.postMessage(
        {
          type: "infrared-shell:open-tabs-target",
          target,
          mode,
        },
        origin,
      );
      return true;
    }

    return false;
  }

  function handleInternalNavigation(event) {
    if (!isShellEmbedded) {
      return;
    }

    const explicitTarget = event.target.closest("[data-shell-page-target]");

    if (explicitTarget) {
      event.preventDefault();
      navigate(explicitTarget.dataset.shellPageTarget);
      return;
    }

    const anchor = event.target.closest("a[href]");

    if (!anchor) {
      return;
    }

    if (anchor.target && anchor.target !== "_self") {
      return;
    }

    const href = anchor.getAttribute("href");

    if (!href || href.startsWith("#") || href.startsWith("javascript:")) {
      return;
    }

    let url;

    try {
      url = new URL(href, window.location.href);
    } catch (error) {
      return;
    }

    if (url.origin !== origin) {
      return;
    }

    const pageId = normalizePageId(url.pathname);

    if (!pageId) {
      return;
    }

    event.preventDefault();
    navigate(pageId);
  }

  document.addEventListener("click", handleInternalNavigation, true);

  window.addEventListener("message", event => {
    if (event.origin !== origin) {
      return;
    }

    const data = event.data || {};

    if (data.type === "infrared-shell:activate") {
      setActiveState(true, data);
    }

    if (data.type === "infrared-shell:deactivate") {
      setActiveState(false, data);
    }
  });

  if (!isShellEmbedded) {
    setActiveState(true, {
      pageId: normalizePageId(window.location.pathname),
      firstActivation: true,
      standalone: true,
    });
  }

  window.InfraredShellBridge = {
    isEmbedded: isShellEmbedded,
    navigate,
    openTabsTarget,
    isActive() {
      return document.documentElement.dataset.shellActive === "true";
    },
    currentPageId() {
      return normalizePageId(window.location.pathname);
    },
  };
})();
