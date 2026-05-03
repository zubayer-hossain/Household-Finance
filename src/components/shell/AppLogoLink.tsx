"use client";

import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

const LOGO_SRC = "/brand/household-finance-logo.png";

/** Brand wordmark — uses the PNG as-is (light canvas); avoid extra bordered boxes around it. */
export function AppLogoLink({
  href,
  className,
  priority = false,
}: {
  href: string;
  className?: string;
  /** Set true on the main app header for LCP. */
  priority?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "-m-1 inline-flex shrink-0 items-center rounded-lg p-1 outline-none ring-offset-background transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
    >
      <Image
        src={LOGO_SRC}
        alt="Household Finance"
        width={320}
        height={96}
        sizes="(max-width:640px) 75vw, 280px"
        priority={priority}
        className="h-10 w-auto max-w-[min(280px,calc(100vw-6rem))] object-contain object-left sm:h-11 md:h-12"
      />
    </Link>
  );
}
