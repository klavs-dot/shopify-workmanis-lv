import Link from "next/link";

import { cn } from "@/lib/utils";

// 14D.lv brand mark inspired by the 3D reference (blue "14D" + cardboard box
// with ".lv" sliding out from behind the "D"). The box periodically peeks
// out further with a small overshoot + rotation, then settles back — gives
// the logo a tiny moment of life without being distracting.

interface LogoProps {
  /** Use href=null to render as static markup (e.g. inside a wrapper link). */
  href?: string | null;
  className?: string;
  /** "sm" for footer (24 px tall), "md" for header (32 px tall). */
  size?: "sm" | "md";
}

export function Logo({ href = "/", className, size = "md" }: LogoProps) {
  const dim = size === "sm" ? "h-6 text-lg" : "h-8 text-2xl md:h-9 md:text-3xl";
  const boxDim = size === "sm" ? "h-6 px-1.5 text-[10px]" : "h-7 px-2 text-xs md:h-8 md:text-sm";

  const content = (
    <span className={cn("inline-flex items-center", className)}>
      {/* The "14D" wordmark — extra bold, slightly italic for forward motion */}
      <span
        className={cn(
          "font-extrabold tracking-tight text-blue-600",
          dim
        )}
        style={{ letterSpacing: "-0.02em" }}
      >
        14D
      </span>

      {/* The cardboard box — sits slightly behind the "D" and peeks out
       *  periodically. -ml-1 lets it overlap with the D's right edge. */}
      <span
        className={cn(
          "logo-box relative -ml-1.5 inline-flex items-center justify-center rounded-[3px] font-bold text-neutral-900",
          boxDim
        )}
        style={{
          background:
            "linear-gradient(180deg, #d4a36a 0%, #b67e3e 55%, #9a6730 100%)",
          boxShadow:
            "inset 0 -2px 0 rgba(0,0,0,0.25), 0 1px 2px rgba(0,0,0,0.25)",
        }}
      >
        {/* Packing tape across the top — the thin dark band */}
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-[18%] bg-neutral-800/85"
        />
        <span className="relative">.lv</span>
      </span>
    </span>
  );

  if (!href) return content;
  return (
    <Link
      href={href}
      aria-label="14D.lv sākumlapa"
      className="inline-flex items-center"
    >
      {content}
    </Link>
  );
}
