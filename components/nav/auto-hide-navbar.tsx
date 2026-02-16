"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAutoHideNavbar } from "@/hooks/use-auto-hide-navbar";
import { NAV_LINKS } from "./nav-links";

export function AutoHideNavbar() {
  const pathname = usePathname();
  const visible = useAutoHideNavbar();
  if (pathname === "/d") {
    return null;
  }

  return (
    <nav className={`navbar${visible ? " visible" : ""}`}>
      <div className="nav-content">
        {NAV_LINKS.map(link => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              className={`nav-item${isActive ? " active" : ""}`}
              href={link.href}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
