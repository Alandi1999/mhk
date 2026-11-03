"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
  /** Match nested routes too (default: exact match). */
  prefix?: boolean;
}

export function isActive(pathname: string, item: NavItem): boolean {
  if (item.prefix) {
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }
  return pathname === item.href;
}

/** Primary navigation inside the black header band. */
export function SiteNav({ label, items }: { label: string; items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label={label}>
      <ul className="flex items-center gap-1">
        {items.map((item) => {
          const active = isActive(pathname, item);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-11 items-center px-3 text-sm font-semibold transition-colors duration-150",
                  active
                    ? "text-ink-on-band"
                    : "text-ink-on-band-muted hover:text-ink-on-band",
                )}
              >
                {item.label}
                {active ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-1 bottom-0 h-1 bg-brand-orange slant-bar"
                  />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
