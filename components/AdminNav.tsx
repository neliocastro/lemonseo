"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Leads e relatórios" },
  { href: "/admin/ferramentas", label: "Ferramentas" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="ls-tabs-nav" style={{ marginBottom: "1.5rem" }}>
      {NAV_ITEMS.map((item) => {
        const active =
          item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`ls-tab-btn${active ? " active" : ""}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
