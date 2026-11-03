import Image from "next/image";
import logo from "../../../public/mhk logo.png";
import { cn } from "@/lib/utils";

/** The MHK logo. It ships on a black ground, so only place it on black. */
export function BrandLogo({
  className,
  priority = false,
  sizes,
}: {
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <Image
      src={logo}
      alt="MHK Moto Repuestos S.A.S"
      priority={priority}
      sizes={sizes}
      placeholder="empty"
      className={cn("h-auto w-full", className)}
    />
  );
}
