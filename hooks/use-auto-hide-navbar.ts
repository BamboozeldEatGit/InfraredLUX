"use client";

import { useEffect, useState } from "react";

export function useAutoHideNavbar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let hideTimeout: ReturnType<typeof setTimeout>;

    const show = () => {
      setVisible(true);
      clearTimeout(hideTimeout);
      hideTimeout = setTimeout(() => setVisible(false), 2000);
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (event.clientY <= 60) show();
    };

    const handleScroll = () => {
      if (window.scrollY === 0) show();
    };

    const bootTimeout = setTimeout(show, 500);

    document.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll);

    return () => {
      clearTimeout(bootTimeout);
      clearTimeout(hideTimeout);
      document.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return visible;
}
