import type { ReactNode } from "react";
import { BrandLogo } from "@/components/shell/brand-logo";
import { cn } from "@/lib/utils";

const STATEMENT =
  "Tienda mayorista de repuestos de motos para talleres y locales.";

/**
 * Two-panel shell for signed-out screens: black brand panel on the left
 * (a top band on mobile) and the light form panel on the right.
 */
export function AuthShell({
  children,
  width = "sm",
}: {
  children: ReactNode;
  width?: "sm" | "md";
}) {
  return (
    <div className="grid flex-1 grid-rows-[auto_1fr] md:grid-cols-[minmax(20rem,5fr)_7fr] md:grid-rows-1">
      <header className="on-band bg-band text-ink-on-band md:sticky md:top-0 md:h-screen md:[clip-path:polygon(0_0,100%_0,calc(100%-2rem)_100%,0_100%)]">
        <div className="mx-auto flex max-w-md items-center gap-4 px-4 pt-4 pb-3 md:h-full md:flex-col md:items-start md:justify-center md:gap-8 md:px-10 md:py-12">
          <div className="w-32 shrink-0 md:w-full md:max-w-sm">
            <BrandLogo priority sizes="(min-width: 768px) 384px, 128px" />
          </div>
          <p className="max-w-xs text-xs leading-snug font-medium text-ink-on-band-muted md:text-lg">
            {STATEMENT}
          </p>
        </div>
        <div aria-hidden="true" className="brand-rule md:hidden" />
      </header>

      <main className="flex flex-col justify-start px-4 py-8 md:justify-center md:px-12 md:py-12">
        <div
          className={cn(
            "mx-auto flex w-full flex-col gap-6",
            width === "sm" ? "max-w-sm" : "max-w-xl",
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
