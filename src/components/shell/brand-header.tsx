import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { BrandLogo } from "@/components/shell/brand-logo";
import { SiteNav, type NavItem } from "@/components/shell/site-nav";

/** Black header band: logo, area navigation, signed-in user and logout. */
export function BrandHeader({
  homeHref,
  navLabel,
  nav,
  userLabel,
}: {
  homeHref: string;
  navLabel: string;
  nav: NavItem[];
  userLabel: string | undefined;
}) {
  return (
    <header className="on-band bg-band text-ink-on-band">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 px-4 pt-3 md:flex-nowrap md:px-6 md:py-2">
        <Link
          href={homeHref}
          aria-label="MHK Moto Repuestos, inicio"
          className="block w-28 shrink-0 md:w-32"
        >
          <BrandLogo priority sizes="128px" />
        </Link>

        <div className="flex min-w-0 items-center gap-3 md:order-3">
          {userLabel ? (
            <span className="hidden max-w-56 truncate text-sm text-ink-on-band-muted sm:inline">
              {userLabel}
            </span>
          ) : null}
          <LogoutButton variant="inverse" />
        </div>

        <div className="-mx-3 mt-2 w-full md:order-2 md:mx-0 md:mt-0 md:w-auto md:flex-1 md:pl-4">
          <SiteNav label={navLabel} items={nav} />
        </div>
      </div>
      <div aria-hidden="true" className="brand-rule" />
    </header>
  );
}
