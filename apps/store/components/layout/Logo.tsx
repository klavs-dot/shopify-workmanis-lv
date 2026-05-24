import Link from "next/link";

import { cn } from "@/lib/utils";

// 14D.lv brand mark — SVG inline so we can layer a neon glow filter, a
// vertical blue gradient, and inner highlights to mimic the 3D reference.
// The cardboard box on the right peeks out periodically via .logo-box.

interface LogoProps {
  /** Use href=null for non-clickable (e.g. footer when wrapper handles link). */
  href?: string | null;
  className?: string;
  /** Pixel height of the SVG. Defaults to 36 (md). 28 = sm. */
  size?: "sm" | "md" | "lg";
}

const SIZES: Record<NonNullable<LogoProps["size"]>, number> = {
  sm: 28,
  md: 36,
  lg: 56,
};

export function Logo({ href = "/", className, size = "md" }: LogoProps) {
  const height = SIZES[size];

  // Width:height ratio matches the viewBox 220×72.
  const svg = (
    <svg
      viewBox="0 0 220 72"
      role="img"
      aria-label="14D.lv"
      style={{ height, width: "auto" }}
      className={cn("block", className)}
    >
      <defs>
        {/* Neon blue 3D gradient — bright top → mid → dark bottom */}
        <linearGradient id="logo-blue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7ccaff" />
          <stop offset="40%" stopColor="#2e88ff" />
          <stop offset="100%" stopColor="#0a3cb8" />
        </linearGradient>

        {/* Sharp highlight stripe along the top of each glyph */}
        <linearGradient id="logo-highlight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="25%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        {/* Cardboard gradient */}
        <linearGradient id="logo-cardboard" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#dba670" />
          <stop offset="55%" stopColor="#b67a3a" />
          <stop offset="100%" stopColor="#8c5a26" />
        </linearGradient>

        {/* Outer neon glow — bright blue halo behind the wordmark */}
        <filter id="logo-glow" x="-30%" y="-50%" width="160%" height="200%">
          <feGaussianBlur stdDeviation="3" in="SourceGraphic" result="b1" />
          <feGaussianBlur stdDeviation="7" in="SourceGraphic" result="b2" />
          <feMerge>
            <feMergeNode in="b2" />
            <feMergeNode in="b1" />
          </feMerge>
        </filter>

        {/* Drop shadow under the box (and the bottom of the text) */}
        <filter id="logo-shadow" x="-10%" y="-10%" width="120%" height="140%">
          <feGaussianBlur stdDeviation="1.2" in="SourceAlpha" result="ds" />
          <feOffset in="ds" dx="0" dy="1.5" result="dso" />
          <feComponentTransfer in="dso" result="dsa">
            <feFuncA type="linear" slope="0.55" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="dsa" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ---------- 14D wordmark (glow underneath, sharp glyphs on top) ---------- */}
      <g>
        {/* Glow layer — copy of the text under a heavy blur. */}
        <text
          x="2"
          y="55"
          fontFamily='"Arial Black", "Helvetica Neue", Arial, sans-serif'
          fontWeight={900}
          fontSize="56"
          fill="#1d77ff"
          filter="url(#logo-glow)"
          opacity="0.85"
          style={{ letterSpacing: "-0.04em" }}
        >
          14D
        </text>

        {/* Main glyphs with vertical blue gradient */}
        <text
          x="2"
          y="55"
          fontFamily='"Arial Black", "Helvetica Neue", Arial, sans-serif'
          fontWeight={900}
          fontSize="56"
          fill="url(#logo-blue)"
          filter="url(#logo-shadow)"
          style={{ letterSpacing: "-0.04em" }}
        >
          14D
        </text>

        {/* Top highlight stripe — uses the same glyphs as a mask via paint order */}
        <text
          x="2"
          y="55"
          fontFamily='"Arial Black", "Helvetica Neue", Arial, sans-serif'
          fontWeight={900}
          fontSize="56"
          fill="url(#logo-highlight)"
          style={{ letterSpacing: "-0.04em" }}
        >
          14D
        </text>
      </g>

      {/* ---------- Cardboard box with ".lv" ---------- */}
      <g className="logo-box" style={{ transformOrigin: "150px 40px" }}>
        {/* Soft shadow under the box */}
        <ellipse cx="172" cy="66" rx="36" ry="3" fill="rgba(0,0,0,0.35)" />

        {/* Box body */}
        <rect
          x="138"
          y="14"
          width="72"
          height="50"
          rx="2"
          fill="url(#logo-cardboard)"
          filter="url(#logo-shadow)"
        />

        {/* Top edge highlight */}
        <rect
          x="138"
          y="14"
          width="72"
          height="3"
          fill="#f1c891"
          opacity="0.7"
        />

        {/* Packing tape — two parallel dark bands */}
        <rect x="138" y="20" width="72" height="6" fill="#2a1a0a" opacity="0.95" />
        <line
          x1="138"
          y1="20"
          x2="210"
          y2="20"
          stroke="#000"
          strokeWidth="0.5"
          opacity="0.6"
        />
        <line
          x1="138"
          y1="26"
          x2="210"
          y2="26"
          stroke="#000"
          strokeWidth="0.5"
          opacity="0.6"
        />

        {/* ".lv" label */}
        <text
          x="174"
          y="55"
          textAnchor="middle"
          fontFamily='"Arial Black", "Helvetica Neue", Arial, sans-serif'
          fontWeight={900}
          fontSize="24"
          fill="#1a1a1a"
          style={{ letterSpacing: "-0.02em" }}
        >
          .lv
        </text>
      </g>
    </svg>
  );

  if (!href) return svg;
  return (
    <Link
      href={href}
      aria-label="14D.lv sākumlapa"
      className="inline-flex items-center"
    >
      {svg}
    </Link>
  );
}
