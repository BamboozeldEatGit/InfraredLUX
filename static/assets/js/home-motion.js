document.addEventListener("DOMContentLoaded", () => {
  const motion = window.Motion;
  const subtitle = document.getElementById("dynamic-subtitle");
  const title = document.querySelector(".main > .title");

  if (!motion?.animate || !motion?.stagger) {
    return;
  }

  const navItems = Array.from(document.querySelectorAll(".nav-item"));
  const heroItems = Array.from(document.querySelectorAll(".main > .subtitle"));
  let titleChars = [];

  if (title) {
    const titleText = title.textContent ?? "";

    title.setAttribute("aria-label", titleText);
    title.innerHTML = "";

    titleChars = Array.from(titleText).map(character => {
      const span = document.createElement("span");
      span.className = "title-char";
      span.setAttribute("aria-hidden", "true");
      span.textContent = character === " " ? "\u00A0" : character;
      title.appendChild(span);
      return span;
    });
  }

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

  window.animateHomeTipReveal = (isInitial = false) => {
    if (!subtitle) {
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
});
