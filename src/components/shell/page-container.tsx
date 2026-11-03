import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Page body: `<main>` landmark, display heading and a consistent width. */
export function PageContainer({
  title,
  description,
  width = "wide",
  children,
}: {
  title: string;
  description?: ReactNode;
  width?: "narrow" | "wide";
  children?: ReactNode;
}) {
  return (
    <main
      className={cn(
        "mx-auto flex w-full flex-1 flex-col gap-6 px-4 py-8 md:px-6 md:py-10",
        width === "wide" ? "max-w-6xl" : "max-w-3xl",
      )}
    >
      <div className="flex flex-col gap-2">
        <h1 className="font-display-wide text-3xl text-balance text-ink">
          {title}
        </h1>
        {description ? (
          <p className="max-w-[65ch] text-base text-ink-muted">{description}</p>
        ) : null}
      </div>
      {children}
    </main>
  );
}
