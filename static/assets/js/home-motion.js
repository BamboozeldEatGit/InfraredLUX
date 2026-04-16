document.addEventListener("DOMContentLoaded", () => {
  const motion = window.Motion;
  const subtitle = document.getElementById("dynamic-subtitle");
  const title = document.querySelector(".main > .title");
  const shouldDelayIntro = window.InfraredShellBridge?.isEmbedded;

  if (!motion?.animate || !motion?.stagger) {
    return;
  }

  function animationsEnabled() {
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

  const navItems = Array.from(document.querySelectorAll(".nav-item"));
  const heroItems = Array.from(document.querySelectorAll(".main > .subtitle"));

  function splitTitleText(nextText) {
    if (!title) {
      return [];
    }

    const titleText = typeof nextText === "string" ? nextText : (title.textContent ?? "");
    title.setAttribute("aria-label", titleText);
    title.innerHTML = "";

    const spans = Array.from(titleText).map(character => {
      const span = document.createElement("span");
      span.className = "title-char";
      span.setAttribute("aria-hidden", "true");
      span.textContent = character === " " ? "\u00A0" : character;
      // Title chars default to opacity:0 in CSS; make them visible unless the intro animation resets them.
      span.style.opacity = "1";
      span.style.transform = "";
      span.style.filter = "";
      title.appendChild(span);
      return span;
    });

    return spans;
  }

  function getTitleChars() {
    if (!title) {
      return [];
    }
    return Array.from(title.querySelectorAll(".title-char"));
  }

  // Split whatever is in the title on first load.
  splitTitleText();

  // Allow other scripts (settings/personalization) to update the title while keeping stagger animation.
  window.InfraredHomeTitle = {
    setText(text) {
      return splitTitleText(text);
    },
    getChars() {
      return getTitleChars();
    },
    updateDiff(nextText) {
      if (!title) {
        return [];
      }

      const currentText = title.getAttribute("aria-label") ?? "";
      if (typeof nextText !== "string" || !nextText) {
        return getTitleChars();
      }

      // If the length changed, rebuild and ensure visibility.
      if (currentText.length !== nextText.length) {
        const spans = splitTitleText(nextText);
        spans.forEach(span => {
          span.style.opacity = "1";
          span.style.transform = "";
          span.style.filter = "";
        });
        return spans;
      }

      const chars = getTitleChars();
      title.setAttribute("aria-label", nextText);

      chars.forEach((span, idx) => {
        const nextChar = nextText[idx] ?? "";
        const prevChar = currentText[idx] ?? "";
        if (nextChar === prevChar) {
          return;
        }

        span.textContent = nextChar === " " ? "\u00A0" : nextChar;
        span.style.opacity = "1";

        if (!animationsEnabled()) {
          span.style.transform = "";
          span.style.filter = "";
          return;
        }

        // Quick per-character tick animation for just the changing digits.
        motion.animate(
          span,
          { opacity: [0, 1], y: [14, 0], filter: ["blur(10px)", "blur(0px)"] },
          { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
        );
      });

      return chars;
    },
  };

  function resetIntroState() {
    navItems.forEach(item => {
      item.style.opacity = "0";
      item.style.transform = "translateY(-14px)";
      item.style.filter = "blur(8px)";
    });

    getTitleChars().forEach(item => {
      item.style.opacity = "0";
      item.style.transform = "translateY(28px)";
      item.style.filter = "blur(12px)";
    });

    heroItems.forEach(item => {
      item.style.opacity = "0";
      item.style.transform = "translateY(22px)";
      item.style.filter = "blur(12px)";
    });
  }

  const runIntro = () => {
    if (!animationsEnabled()) {
      navItems.forEach(item => {
        item.style.opacity = "1";
        item.style.transform = "";
        item.style.filter = "";
      });
      getTitleChars().forEach(item => {
        item.style.opacity = "1";
        item.style.transform = "";
        item.style.filter = "";
      });
      heroItems.forEach(item => {
        item.style.opacity = "1";
        item.style.transform = "";
        item.style.filter = "";
      });
      return;
    }

    resetIntroState();

    if (navItems.length) {
      motion.animate(
        navItems,
        {
          opacity: [0, 1],
          y: [-14, 0],
          filter: ["blur(8px)", "blur(0px)"],
        },
        {
          delay: motion.stagger(0.06, { startDelay: 0.08 }),
          duration: 0.42,
          ease: [0.22, 1, 0.36, 1],
        },
      );
    }

    const titleChars = getTitleChars();
    if (titleChars.length) {
      motion.animate(
        titleChars,
        {
          opacity: [0, 1],
          y: [28, 0],
          filter: ["blur(12px)", "blur(0px)"],
        },
        {
          delay: motion.stagger(0.06, { startDelay: 0.18 }),
          duration: 0.54,
          ease: [0.22, 1, 0.36, 1],
        },
      );
    }

    if (heroItems.length) {
      motion.animate(
        heroItems,
        {
          opacity: [0, 1],
          y: [22, 0],
          filter: ["blur(12px)", "blur(0px)"],
        },
        {
          delay: motion.stagger(0.1, { startDelay: titleChars.length ? 0.62 : 0.16 }),
          duration: 0.62,
          ease: [0.22, 1, 0.36, 1],
        },
      );
    }
  };

  window.animateHomeTipReveal = (isInitial = false) => {
    if (!subtitle) {
      return;
    }

    if (!animationsEnabled()) {
      subtitle.style.opacity = "1";
      subtitle.style.transform = "";
      subtitle.style.filter = "";
      return;
    }

    motion.animate(
      subtitle,
      {
        opacity: [0, 1],
        y: isInitial ? [14, 0] : [10, 0],
        filter: ["blur(10px)", "blur(0px)"],
      },
      {
        duration: isInitial ? 0.55 : 0.42,
        ease: [0.22, 1, 0.36, 1],
      },
    );
  };

  window.animateHomeTipExit = callback => {
    if (!subtitle) {
      callback?.();
      return;
    }

    if (!animationsEnabled()) {
      callback?.();
      return;
    }

    motion.animate(
      subtitle,
      {
        opacity: [1, 0],
        y: [0, -8],
        filter: ["blur(0px)", "blur(8px)"],
      },
      {
        duration: 0.24,
        ease: [0.55, 0, 1, 0.45],
      },
    );

    window.setTimeout(() => {
      callback?.();
    }, 240);
  };

  if (!shouldDelayIntro || window.InfraredShellBridge?.isActive()) {
    runIntro();
  }

  if (shouldDelayIntro) {
    window.addEventListener("infrared:shell-activate", () => {
      runIntro();
    });
  }
});