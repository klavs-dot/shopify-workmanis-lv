import Link from "next/link";

import { cn } from "@/lib/utils";

// 14D.lv brand mark — faithful to the 3D render reference:
//   • "14" in glossy neon-blue extruded type
//   • "D" in banded chrome/silver (the hard gradient stop = metal horizon)
//   • cardboard box with packing tape and ".lv", in slight perspective
//
// Implementation notes (from the design-critique pass):
//   • Glyphs are defined ONCE in <defs> and reused via <use> for every layer
//     (extrusion, glow, face, specular) — guarantees the layers stay
//     registered even when the font falls back on other platforms.
//   • Glow is recolored with feFlood so it stays saturated electric blue on
//     a white header instead of washing out to gray.
//   • paint-order stroke gives each face a crisp dark rim that separates the
//     glyphs from white backgrounds at small sizes.
//   • The box peeks out periodically via .logo-box (globals.css); the glow
//     pulses via .logo-glow-layer.

interface LogoProps {
  /** Use href=null for non-clickable (e.g. footer when wrapper handles link). */
  href?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const SIZES: Record<NonNullable<LogoProps["size"]>, number> = {
  sm: 30,
  md: 40,
  lg: 64,
};

const FONT =
  '"Arial Black", "Archivo Black", "Helvetica Neue", Arial, sans-serif';

export function Logo({ href = "/", className, size = "md" }: LogoProps) {
  const height = SIZES[size];

  const svg = (
    <svg
      viewBox="0 0 212 74"
      role="img"
      aria-label="14D.lv"
      style={{ height, width: "auto" }}
      className={cn("block overflow-visible", className)}
    >
      <defs>
        {/* Glyphs defined once, reused for every layer — no fill here so
         *  each <use> can paint its own. */}
        <text
          id="t14"
          x="2"
          y="56"
          fontFamily={FONT}
          fontWeight={900}
          fontSize="58"
          letterSpacing="-2"
        >
          14
        </text>
        <text
          id="tD"
          x="66"
          y="56"
          fontFamily={FONT}
          fontWeight={900}
          fontSize="58"
        >
          D
        </text>

        {/* Neon blue face — bright top → mid → deep bottom */}
        <linearGradient id="lg-blue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8fd4ff" />
          <stop offset="45%" stopColor="#2e88ff" />
          <stop offset="100%" stopColor="#0a3cb8" />
        </linearGradient>

        {/* Blue extrusion side-wall (darker than the face) */}
        <linearGradient id="lg-blue-ext" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a2f8c" />
          <stop offset="100%" stopColor="#051a52" />
        </linearGradient>

        {/* Banded chrome for the D — the hard 0.50→0.52 stop is the metal
         *  "horizon line" that makes it read as polished silver */}
        <linearGradient id="lg-chrome" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f6fafd" />
          <stop offset="35%" stopColor="#b4c2d0" />
          <stop offset="50%" stopColor="#6e7e91" />
          <stop offset="52%" stopColor="#e6eef5" />
          <stop offset="75%" stopColor="#97a7b8" />
          <stop offset="100%" stopColor="#596878" />
        </linearGradient>

        {/* Steel extrusion for the D */}
        <linearGradient id="lg-steel-ext" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3c4654" />
          <stop offset="100%" stopColor="#1e242c" />
        </linearGradient>

        {/* Cardboard */}
        <linearGradient id="lg-card" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#dba670" />
          <stop offset="55%" stopColor="#b67a3a" />
          <stop offset="100%" stopColor="#8c5a26" />
        </linearGradient>

        {/* Specular band gradient — hard stop so the sheen ends in a line */}
        <linearGradient id="lg-spec" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="65%" stopColor="#ffffff" stopOpacity="0.25" />
          <stop offset="70%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        {/* Electric-blue glow, recolored via feFlood so it never grays out */}
        <filter id="f-glow-blue" x="-40%" y="-60%" width="180%" height="220%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2.5" result="b1" />
          <feFlood floodColor="#2e9bff" floodOpacity="0.55" result="c1" />
          <feComposite in="c1" in2="b1" operator="in" result="g1" />
          <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="b2" />
          <feFlood floodColor="#4dabff" floodOpacity="0.9" result="c2" />
          <feComposite in="c2" in2="b2" operator="in" result="g2" />
          <feMerge>
            <feMergeNode in="g1" />
            <feMergeNode in="g2" />
          </feMerge>
        </filter>

        {/* Soft near-white glow for the chrome D */}
        <filter id="f-glow-silver" x="-40%" y="-60%" width="180%" height="220%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="b" />
          <feFlood floodColor="#cfe2ff" floodOpacity="0.5" result="c" />
          <feComposite in="c" in2="b" operator="in" />
        </filter>

        {/* Specular clip — both wordmark glyphs */}
        <clipPath id="wm-clip">
          <use href="#t14" />
          <use href="#tD" />
        </clipPath>
      </defs>

      {/* ============ Wordmark ============ */}

      {/* Glow layers (pulse via .logo-glow-layer) */}
      <g className="logo-glow-layer">
        <use href="#t14" fill="#1d77ff" filter="url(#f-glow-blue)" />
        <use href="#tD" fill="#cfe2ff" filter="url(#f-glow-silver)" />
      </g>

      {/* 3D extrusion — stacked copies stepping down-right */}
      <g fill="url(#lg-blue-ext)">
        <use href="#t14" transform="translate(2.4,2.4)" />
        <use href="#t14" transform="translate(1.6,1.6)" />
        <use href="#t14" transform="translate(0.8,0.8)" />
      </g>
      <g fill="url(#lg-steel-ext)">
        <use href="#tD" transform="translate(2.4,2.4)" />
        <use href="#tD" transform="translate(1.6,1.6)" />
        <use href="#tD" transform="translate(0.8,0.8)" />
      </g>

      {/* Faces with crisp rim (paint-order stroke under fill) */}
      <use
        href="#t14"
        fill="url(#lg-blue)"
        stroke="#063a9e"
        strokeWidth="1.2"
        style={{ paintOrder: "stroke" }}
      />
      <use
        href="#tD"
        fill="url(#lg-chrome)"
        stroke="#2e3a48"
        strokeWidth="1.2"
        style={{ paintOrder: "stroke" }}
      />

      {/* Clipped specular swoosh — discrete sheen with a hard lower edge */}
      <g clipPath="url(#wm-clip)">
        <rect x="0" y="10" width="120" height="4" fill="#ffffff" opacity="0.85" />
        <rect
          x="0"
          y="15"
          width="120"
          height="13"
          fill="url(#lg-spec)"
          transform="skewY(-3)"
        />
      </g>

      {/* ============ Cardboard box ============ */}
      <g className="logo-box">
        {/* Ground shadow */}
        <ellipse cx="152" cy="66" rx="38" ry="3.2" fill="rgba(0,0,0,0.30)" />

        {/* Top face (perspective back-right, lighter — lit from above) */}
        <polygon
          points="116,16 124,9 196,9 188,16"
          fill="#e8bb80"
        />
        {/* Right side face (darker) */}
        <polygon
          points="188,16 196,9 196,56 188,63"
          fill="#7c4e1f"
        />
        {/* Front face */}
        <rect x="116" y="16" width="72" height="47" fill="url(#lg-card)" />

        {/* Top flap seam (where the flaps meet) */}
        <line
          x1="156"
          y1="9"
          x2="152"
          y2="16"
          stroke="#8c5a26"
          strokeWidth="1.5"
        />

        {/* Packing tape — wraps over the top onto the front, with sheen */}
        <polygon points="146,12.4 162,12.4 160,16 148,16" fill="#1d1208" opacity="0.95" />
        <rect x="148" y="16" width="12" height="10" fill="#1d1208" opacity="0.95" />
        <rect x="148.8" y="16" width="2.2" height="10" fill="#ffffff" opacity="0.16" />

        {/* Horizontal tape band across the front */}
        <rect x="116" y="22" width="72" height="6" fill="#241608" opacity="0.92" />
        <rect x="116" y="22.8" width="72" height="1.6" fill="#ffffff" opacity="0.14" />

        {/* Corrugation hint along the bottom cut edge */}
        <g opacity="0.5">
          {Array.from({ length: 18 }, (_, i) => (
            <rect
              key={i}
              x={117 + i * 4}
              y={60.5}
              width="1.6"
              height="2.5"
              fill="#9a6a30"
            />
          ))}
        </g>

        {/* Top edge highlight */}
        <line x1="116" y1="16" x2="188" y2="16" stroke="#f1c891" strokeWidth="1.4" opacity="0.8" />

        {/* ".lv" printed on the front */}
        <text
          x="152"
          y="52"
          textAnchor="middle"
          fontFamily={FONT}
          fontWeight={900}
          fontSize="23"
          fill="#1a1208"
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
      className="inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 rounded-sm"
    >
      {svg}
    </Link>
  );
}
