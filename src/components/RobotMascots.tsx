"use client";

/**
 * Three distinct robot mascots for the Produkti veikalā category cards.
 * Pure inline SVG + CSS keyframes, prefers-reduced-motion respected.
 *
 *   SellingRobot       — emerald, happy, holds shopping bag, waves
 *   StaleWeekRobot     — amber, impatient, holds clock, taps foot
 *   StaleTwoWeeksRobot — red, alarmed, exclamation over head, shakes
 *
 * Each shares the same general silhouette as <RobotLogo /> so the
 * brand reads consistent, but pose + color + accessory + animation
 * speed make each instantly recognisable.
 */

interface MascotProps {
  className?: string;
  title?: string;
}

// =================================================================
// Robot 1 — Pārdošanā (selling well, fresh stock)
// =================================================================

export function SellingRobot({ className, title = "Pārdošanā" }: MascotProps) {
  return (
    <svg
      viewBox="0 0 80 80"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <defs>
        <linearGradient id="sell-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <linearGradient id="sell-head" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="sell-bag" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>

      <style>{`
        .sl-bob { animation: sl-bob 1.6s ease-in-out infinite; transform-origin: 40px 40px; }
        @keyframes sl-bob {
          0%,100% { transform: translateY(0); }
          50%     { transform: translateY(-2.5px); }
        }
        .sl-wave { transform-origin: 60px 44px; transform-box: fill-box; animation: sl-wave 1.2s ease-in-out infinite; }
        @keyframes sl-wave {
          0%,100% { transform: rotate(-8deg); }
          50%     { transform: rotate(18deg); }
        }
        .sl-eye-happy { animation: sl-eye-blink 4s infinite; transform-origin: center; transform-box: fill-box; }
        @keyframes sl-eye-blink {
          0%,92%,96%,100% { transform: scaleY(1); }
          94%             { transform: scaleY(0.1); }
        }
        .sl-sparkle { animation: sl-sparkle 2s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
        @keyframes sl-sparkle {
          0%,100% { opacity: 0.4; transform: scale(0.8); }
          50%     { opacity: 1;   transform: scale(1.3); }
        }
        @media (prefers-reduced-motion: reduce) {
          .sl-bob, .sl-wave, .sl-eye-happy, .sl-sparkle { animation: none; }
        }
      `}</style>

      {/* sparkles around the bag */}
      <g className="sl-sparkle">
        <circle cx="14" cy="50" r="1.2" fill="#fbbf24" />
        <circle cx="10" cy="58" r="0.9" fill="#fbbf24" />
        <circle cx="16" cy="64" r="0.8" fill="#fbbf24" />
      </g>

      <g className="sl-bob">
        {/* Antenna */}
        <line x1="40" y1="12" x2="40" y2="18" stroke="#059669" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="40" cy="10" r="2.4" fill="#10b981" />

        {/* Head */}
        <rect x="27" y="18" width="26" height="19" rx="5" fill="url(#sell-head)" />
        {/* Faceplate */}
        <rect x="29" y="22" width="22" height="11" rx="2.5" fill="#064e3b" opacity="0.3" />
        {/* Happy eyes (closed half-moon) */}
        <path
          className="sl-eye-happy"
          d="M 31 27.5 Q 34 25 37 27.5"
          stroke="#fef9c3"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />
        <path
          className="sl-eye-happy"
          d="M 43 27.5 Q 46 25 49 27.5"
          stroke="#fef9c3"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />
        {/* Smile */}
        <path
          d="M 34 32 Q 40 35 46 32"
          stroke="#fef9c3"
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
        />

        {/* Neck */}
        <rect x="36" y="36" width="8" height="3" fill="#065f46" />

        {/* Body */}
        <rect x="22" y="38" width="36" height="24" rx="5" fill="url(#sell-body)" />
        <circle cx="40" cy="50" r="3.5" fill="#fbbf24" />
        <text x="40" y="52.5" textAnchor="middle" fontSize="5" fontWeight="bold" fill="#064e3b">€</text>

        {/* Left arm holding bag */}
        <rect x="14" y="42" width="6" height="14" rx="2" fill="#047857" />
        <g>
          <rect x="6" y="48" width="16" height="18" rx="1.5" fill="url(#sell-bag)" />
          {/* Bag handles */}
          <path d="M 9 48 Q 9 44 11 44 L 17 44 Q 19 44 19 48" stroke="#92400e" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          {/* Bag stripes */}
          <line x1="9" y1="55" x2="19" y2="55" stroke="#92400e" strokeWidth="0.7" opacity="0.4" />
          <line x1="9" y1="58" x2="19" y2="58" stroke="#92400e" strokeWidth="0.7" opacity="0.4" />
        </g>

        {/* Right arm waving */}
        <g className="sl-wave">
          <rect x="56" y="42" width="6" height="14" rx="2" fill="#047857" />
          <circle cx="59" cy="42" r="3" fill="#059669" />
        </g>

        {/* Feet */}
        <rect x="26" y="62" width="9" height="5" rx="1.5" fill="#064e3b" />
        <rect x="45" y="62" width="9" height="5" rx="1.5" fill="#064e3b" />
      </g>
    </svg>
  );
}

// =================================================================
// Robot 2 — Stale 1 week (concerned, impatient, holds clock)
// =================================================================

export function StaleWeekRobot({ className, title = "Stagnē nedēļu" }: MascotProps) {
  return (
    <svg
      viewBox="0 0 80 80"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <defs>
        <linearGradient id="stale1-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id="stale1-head" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>

      <style>{`
        .st1-tap { transform-origin: 30px 67px; transform-box: fill-box; animation: st1-tap 0.5s ease-in-out infinite; }
        @keyframes st1-tap {
          0%,100% { transform: translateY(0) rotate(0deg); }
          50%     { transform: translateY(-1.5px) rotate(-5deg); }
        }
        .st1-clock-hand { transform-origin: center; transform-box: fill-box; animation: st1-clock 1.5s linear infinite; }
        @keyframes st1-clock {
          to { transform: rotate(360deg); }
        }
        .st1-sweat { transform-origin: center; transform-box: fill-box; animation: st1-sweat 2s ease-in-out infinite; }
        @keyframes st1-sweat {
          0%,100% { opacity: 0; transform: translateY(0); }
          30%     { opacity: 1; }
          80%     { opacity: 0; transform: translateY(8px); }
        }
        .st1-eye { transform-origin: center; transform-box: fill-box; animation: st1-blink 3s infinite; }
        @keyframes st1-blink {
          0%,90%,94%,100% { transform: scaleY(1); }
          92%             { transform: scaleY(0.15); }
        }
        @media (prefers-reduced-motion: reduce) {
          .st1-tap, .st1-clock-hand, .st1-sweat, .st1-eye { animation: none; }
        }
      `}</style>

      {/* Sweat drop sliding down the head */}
      <ellipse className="st1-sweat" cx="52" cy="22" rx="1.2" ry="2" fill="#60a5fa" />

      <g>
        {/* Antenna */}
        <line x1="40" y1="12" x2="40" y2="18" stroke="#b45309" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="40" cy="10" r="2.4" fill="#f59e0b" />

        {/* Head */}
        <rect x="27" y="18" width="26" height="19" rx="5" fill="url(#stale1-head)" />
        <rect x="29" y="22" width="22" height="11" rx="2.5" fill="#78350f" opacity="0.3" />

        {/* Worried eyes (small dots, raised) */}
        <circle className="st1-eye" cx="34" cy="27" r="2.2" fill="#fef9c3" />
        <circle className="st1-eye" cx="46" cy="27" r="2.2" fill="#fef9c3" />
        <circle cx="34" cy="27" r="1" fill="#78350f" />
        <circle cx="46" cy="27" r="1" fill="#78350f" />
        {/* Worried mouth (flat line slightly down) */}
        <path d="M 34 33 Q 40 31.5 46 33" stroke="#fef9c3" strokeWidth="1.3" fill="none" strokeLinecap="round" />

        {/* Neck */}
        <rect x="36" y="36" width="8" height="3" fill="#92400e" />

        {/* Body */}
        <rect x="22" y="38" width="36" height="24" rx="5" fill="url(#stale1-body)" />
        {/* Hourglass indicator on chest */}
        <g transform="translate(36 44)">
          <path d="M 0 0 L 8 0 L 4 5 L 8 10 L 0 10 L 4 5 Z" fill="#fef3c7" stroke="#78350f" strokeWidth="0.6" />
          <circle cx="4" cy="2" r="0.8" fill="#92400e" />
          <circle cx="4" cy="8" r="1.2" fill="#92400e" />
        </g>

        {/* Left arm holding clock */}
        <rect x="14" y="42" width="6" height="14" rx="2" fill="#92400e" />
        <g transform="translate(8 50)">
          <circle cx="6" cy="6" r="6" fill="#fef9c3" stroke="#92400e" strokeWidth="0.8" />
          <circle cx="6" cy="6" r="0.7" fill="#92400e" />
          {/* Hour hand (static) */}
          <line x1="6" y1="6" x2="6" y2="3" stroke="#92400e" strokeWidth="1" strokeLinecap="round" />
          {/* Minute hand (rotating) */}
          <line
            className="st1-clock-hand"
            x1="6"
            y1="6"
            x2="9"
            y2="6"
            stroke="#dc2626"
            strokeWidth="0.7"
            strokeLinecap="round"
          />
          {/* Tick marks */}
          <circle cx="6" cy="1.5" r="0.4" fill="#92400e" />
          <circle cx="10.5" cy="6" r="0.4" fill="#92400e" />
          <circle cx="6" cy="10.5" r="0.4" fill="#92400e" />
          <circle cx="1.5" cy="6" r="0.4" fill="#92400e" />
        </g>

        {/* Right arm (hand on hip) */}
        <rect x="56" y="42" width="6" height="14" rx="2" fill="#92400e" />
        <circle cx="58" cy="56" r="2.5" fill="#a16207" />

        {/* Tapping foot */}
        <rect className="st1-tap" x="26" y="62" width="9" height="5" rx="1.5" fill="#78350f" />
        <rect x="45" y="62" width="9" height="5" rx="1.5" fill="#78350f" />
      </g>
    </svg>
  );
}

// =================================================================
// Dashboard mascots — 4 metric robots used on the Admin/Master dashboard.
// Each has a distinct accessory (money / cart / shop-tag / trash) and a
// unique animation so they read as a set but stay individually recognisable.
// =================================================================

export function InvestmentRobot({
  className,
  title = "Ieguldītā nauda",
}: MascotProps) {
  return (
    <svg
      viewBox="0 0 80 80"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <defs>
        <linearGradient id="inv-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#5b21b6" />
        </linearGradient>
        <linearGradient id="inv-head" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c4b5fd" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <style>{`
        .inv-coin { transform-origin: 14px 50px; transform-box: fill-box; animation: inv-coin 1.8s ease-in-out infinite; }
        @keyframes inv-coin {
          0%,100% { transform: translateY(0) rotate(0); }
          50%     { transform: translateY(-3px) rotate(180deg); }
        }
        .inv-eye { animation: inv-blink 4.5s infinite; transform-origin: center; transform-box: fill-box; }
        @keyframes inv-blink {
          0%,93%,97%,100% { transform: scaleY(1); }
          95%             { transform: scaleY(0.1); }
        }
        .inv-chest { animation: inv-pulse 1.4s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
        @keyframes inv-pulse {
          0%,100% { opacity: 1;   transform: scale(1); }
          50%     { opacity: 0.7; transform: scale(1.1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .inv-coin, .inv-eye, .inv-chest { animation: none; }
        }
      `}</style>
      <g>
        <line x1="40" y1="12" x2="40" y2="18" stroke="#5b21b6" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="40" cy="10" r="2.4" fill="#7c3aed" />
        <rect x="27" y="18" width="26" height="19" rx="5" fill="url(#inv-head)" />
        <rect x="29" y="22" width="22" height="11" rx="2.5" fill="#3b0764" opacity="0.3" />
        <circle className="inv-eye" cx="34" cy="27" r="2.2" fill="#fef9c3" />
        <circle className="inv-eye" cx="46" cy="27" r="2.2" fill="#fef9c3" />
        <circle cx="34" cy="27" r="1" fill="#3b0764" />
        <circle cx="46" cy="27" r="1" fill="#3b0764" />
        <path d="M 34 32 Q 40 34 46 32" stroke="#fef9c3" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        <rect x="36" y="36" width="8" height="3" fill="#5b21b6" />
        <rect x="22" y="38" width="36" height="24" rx="5" fill="url(#inv-body)" />
        <g className="inv-chest">
          <circle cx="40" cy="50" r="4.5" fill="#fbbf24" />
          <text x="40" y="53" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#3b0764">€</text>
        </g>
        <rect x="14" y="42" width="6" height="14" rx="2" fill="#5b21b6" />
        <g className="inv-coin">
          <circle cx="14" cy="50" r="5" fill="#fbbf24" stroke="#b45309" strokeWidth="0.6" />
          <text x="14" y="52.5" textAnchor="middle" fontSize="5" fontWeight="bold" fill="#7c2d12">€</text>
        </g>
        <rect x="56" y="42" width="6" height="14" rx="2" fill="#5b21b6" />
        <circle cx="59" cy="56" r="2.5" fill="#7c3aed" />
        <rect x="26" y="62" width="9" height="5" rx="1.5" fill="#3b0764" />
        <rect x="45" y="62" width="9" height="5" rx="1.5" fill="#3b0764" />
      </g>
    </svg>
  );
}

export function SoldRobot({ className, title = "Pārdots" }: MascotProps) {
  return (
    <svg
      viewBox="0 0 80 80"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <defs>
        <linearGradient id="sold-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#1e40af" />
        </linearGradient>
        <linearGradient id="sold-head" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#93c5fd" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <style>{`
        .so-cart { transform-origin: 14px 56px; transform-box: fill-box; animation: so-cart 2.2s ease-in-out infinite; }
        @keyframes so-cart {
          0%,100% { transform: translateX(0); }
          50%     { transform: translateX(3px); }
        }
        .so-stamp { transform-origin: 60px 26px; transform-box: fill-box; animation: so-stamp 2.5s ease-in-out infinite; }
        @keyframes so-stamp {
          0%,50% { transform: scale(0); opacity: 0; }
          60%    { transform: scale(1.3); opacity: 1; }
          70%    { transform: scale(1); opacity: 1; }
          100%   { transform: scale(1); opacity: 1; }
        }
        .so-eye-cash { animation: so-cash 3s infinite; transform-origin: center; transform-box: fill-box; }
        @keyframes so-cash {
          0%,40%,100% { transform: scale(1); }
          45%,50%     { transform: scaleY(0.6) scaleX(1.4); }
        }
        @media (prefers-reduced-motion: reduce) {
          .so-cart, .so-stamp, .so-eye-cash { animation: none; }
        }
      `}</style>

      {/* PĀRDOTS stamp diagonally over corner of head */}
      <g className="so-stamp" transform="rotate(-15 60 26)">
        <rect x="50" y="22" width="20" height="8" rx="1" fill="none" stroke="#dc2626" strokeWidth="1.2" />
        <text x="60" y="28" textAnchor="middle" fontSize="5" fontWeight="bold" fill="#dc2626">PĀRDOTS</text>
      </g>

      <g>
        <line x1="40" y1="12" x2="40" y2="18" stroke="#1e40af" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="40" cy="10" r="2.4" fill="#2563eb" />
        <rect x="27" y="18" width="26" height="19" rx="5" fill="url(#sold-head)" />
        <rect x="29" y="22" width="22" height="11" rx="2.5" fill="#1e3a8a" opacity="0.3" />
        {/* €-shaped happy eyes */}
        <g className="so-eye-cash">
          <text x="33.5" y="29.5" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#fef9c3">€</text>
          <text x="46.5" y="29.5" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#fef9c3">€</text>
        </g>
        <path d="M 34 33 Q 40 35.5 46 33" stroke="#fef9c3" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        <rect x="36" y="36" width="8" height="3" fill="#1e40af" />
        <rect x="22" y="38" width="36" height="24" rx="5" fill="url(#sold-body)" />
        {/* Receipt strip on chest */}
        <rect x="34" y="44" width="12" height="14" rx="1" fill="#fef9c3" stroke="#1e40af" strokeWidth="0.5" />
        <line x1="36" y1="47" x2="44" y2="47" stroke="#1e3a8a" strokeWidth="0.5" />
        <line x1="36" y1="50" x2="44" y2="50" stroke="#1e3a8a" strokeWidth="0.5" />
        <line x1="36" y1="53" x2="42" y2="53" stroke="#1e3a8a" strokeWidth="0.5" />
        <text x="40" y="57" textAnchor="middle" fontSize="3.5" fontWeight="bold" fill="#16a34a">PAID</text>
        {/* Left arm pushing shopping cart */}
        <rect x="14" y="42" width="6" height="14" rx="2" fill="#1e40af" />
        <g className="so-cart">
          <rect x="4" y="52" width="12" height="8" rx="0.5" fill="#fef9c3" stroke="#1e40af" strokeWidth="0.6" />
          <line x1="3" y1="52" x2="6" y2="49" stroke="#1e40af" strokeWidth="1" strokeLinecap="round" />
          <circle cx="6" cy="62" r="1.5" fill="#1e3a8a" />
          <circle cx="14" cy="62" r="1.5" fill="#1e3a8a" />
        </g>
        <rect x="56" y="42" width="6" height="14" rx="2" fill="#1e40af" />
        <circle cx="59" cy="56" r="2.5" fill="#2563eb" />
        <rect x="26" y="62" width="9" height="5" rx="1.5" fill="#1e3a8a" />
        <rect x="45" y="62" width="9" height="5" rx="1.5" fill="#1e3a8a" />
      </g>
    </svg>
  );
}

export function InStoreRobot({ className, title = "Veikalā" }: MascotProps) {
  return (
    <svg
      viewBox="0 0 80 80"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <defs>
        <linearGradient id="is-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#065f46" />
        </linearGradient>
        <linearGradient id="is-head" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>
      <style>{`
        .is-tag { transform-origin: 14px 50px; transform-box: fill-box; animation: is-tag 1.8s ease-in-out infinite; }
        @keyframes is-tag {
          0%,100% { transform: rotate(0deg); }
          50%     { transform: rotate(-8deg); }
        }
        .is-sparkle { transform-origin: center; transform-box: fill-box; animation: is-sparkle 1.4s ease-in-out infinite; }
        @keyframes is-sparkle {
          0%,100% { opacity: 0.3; transform: scale(0.7); }
          50%     { opacity: 1;   transform: scale(1.3); }
        }
        .is-eye { animation: is-blink 5s infinite; transform-origin: center; transform-box: fill-box; }
        @keyframes is-blink {
          0%,91%,95%,100% { transform: scaleY(1); }
          93%             { transform: scaleY(0.1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .is-tag, .is-sparkle, .is-eye { animation: none; }
        }
      `}</style>

      {/* Sparkles next to the tag */}
      <g className="is-sparkle">
        <circle cx="8" cy="46" r="0.8" fill="#fbbf24" />
        <circle cx="6" cy="56" r="1.0" fill="#fbbf24" />
        <circle cx="9" cy="62" r="0.7" fill="#fbbf24" />
      </g>

      <g>
        <line x1="40" y1="12" x2="40" y2="18" stroke="#065f46" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="40" cy="10" r="2.4" fill="#10b981" />
        <rect x="27" y="18" width="26" height="19" rx="5" fill="url(#is-head)" />
        <rect x="29" y="22" width="22" height="11" rx="2.5" fill="#022c22" opacity="0.3" />
        <path className="is-eye" d="M 31 28 Q 34 25.5 37 28" stroke="#fef9c3" strokeWidth="1.7" fill="none" strokeLinecap="round" />
        <path className="is-eye" d="M 43 28 Q 46 25.5 49 28" stroke="#fef9c3" strokeWidth="1.7" fill="none" strokeLinecap="round" />
        <path d="M 34 32 Q 40 35 46 32" stroke="#fef9c3" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        <rect x="36" y="36" width="8" height="3" fill="#065f46" />
        <rect x="22" y="38" width="36" height="24" rx="5" fill="url(#is-body)" />
        {/* Storefront on chest */}
        <g transform="translate(33 44)">
          <rect x="0" y="2" width="14" height="11" fill="#fef9c3" stroke="#065f46" strokeWidth="0.5" />
          <polygon points="0,2 7,-1 14,2" fill="#dc2626" />
          <rect x="2" y="7" width="3" height="6" fill="#065f46" />
          <rect x="9" y="7" width="3" height="3" fill="#60a5fa" />
        </g>
        {/* Left arm holding a sale tag */}
        <rect x="14" y="42" width="6" height="14" rx="2" fill="#065f46" />
        <g className="is-tag">
          <polygon points="6,48 22,48 22,58 14,64 6,58" fill="#dc2626" />
          <circle cx="8" cy="51" r="1.4" fill="#fef9c3" />
          <text x="14.5" y="56.5" textAnchor="middle" fontSize="5.5" fontWeight="bold" fill="#fef9c3">€</text>
        </g>
        <rect x="56" y="42" width="6" height="14" rx="2" fill="#065f46" />
        <circle cx="59" cy="56" r="2.5" fill="#047857" />
        <rect x="26" y="62" width="9" height="5" rx="1.5" fill="#022c22" />
        <rect x="45" y="62" width="9" height="5" rx="1.5" fill="#022c22" />
      </g>
    </svg>
  );
}

export function DisposedRobot({ className, title = "Utilizēts" }: MascotProps) {
  return (
    <svg
      viewBox="0 0 80 80"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <defs>
        <linearGradient id="dis-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
        <linearGradient id="dis-head" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
      </defs>
      <style>{`
        .dis-trash { transform-origin: 14px 56px; transform-box: fill-box; animation: dis-trash 2s ease-in-out infinite; }
        @keyframes dis-trash {
          0%,100% { transform: rotate(0); }
          25%     { transform: rotate(-4deg); }
          75%     { transform: rotate(4deg); }
        }
        .dis-lid { transform-origin: 14px 50px; transform-box: fill-box; animation: dis-lid 2s ease-in-out infinite; }
        @keyframes dis-lid {
          0%,40%,100% { transform: rotate(0); }
          50%,70%     { transform: rotate(-25deg); }
        }
        .dis-x { animation: dis-x 1.5s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
        @keyframes dis-x {
          0%,100% { opacity: 0.7; }
          50%     { opacity: 1; }
        }
        .dis-arm { transform-origin: 17px 42px; transform-box: fill-box; animation: dis-arm 2s ease-in-out infinite; }
        @keyframes dis-arm {
          0%,40%,100% { transform: rotate(0); }
          50%,70%     { transform: rotate(-15deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .dis-trash, .dis-lid, .dis-x, .dis-arm { animation: none; }
        }
      `}</style>
      <g>
        <line x1="40" y1="12" x2="40" y2="18" stroke="#334155" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="40" cy="10" r="2.4" fill="#64748b" />
        <rect x="27" y="18" width="26" height="19" rx="5" fill="url(#dis-head)" />
        <rect x="29" y="22" width="22" height="11" rx="2.5" fill="#0f172a" opacity="0.35" />
        {/* X eyes */}
        <g className="dis-x">
          <line x1="32" y1="25" x2="36" y2="29" stroke="#0f172a" strokeWidth="1.4" strokeLinecap="round" />
          <line x1="36" y1="25" x2="32" y2="29" stroke="#0f172a" strokeWidth="1.4" strokeLinecap="round" />
          <line x1="44" y1="25" x2="48" y2="29" stroke="#0f172a" strokeWidth="1.4" strokeLinecap="round" />
          <line x1="48" y1="25" x2="44" y2="29" stroke="#0f172a" strokeWidth="1.4" strokeLinecap="round" />
        </g>
        {/* Flat mouth */}
        <line x1="34" y1="33" x2="46" y2="33" stroke="#0f172a" strokeWidth="1.2" strokeLinecap="round" />
        <rect x="36" y="36" width="8" height="3" fill="#334155" />
        <rect x="22" y="38" width="36" height="24" rx="5" fill="url(#dis-body)" />
        {/* Recycle/X symbol on chest */}
        <g transform="translate(34 44)">
          <circle cx="6" cy="6" r="5" fill="none" stroke="#fef9c3" strokeWidth="1" />
          <line x1="3" y1="3" x2="9" y2="9" stroke="#fef9c3" strokeWidth="1.4" strokeLinecap="round" />
          <line x1="9" y1="3" x2="3" y2="9" stroke="#fef9c3" strokeWidth="1.4" strokeLinecap="round" />
        </g>
        {/* Left arm + trash can */}
        <g className="dis-arm">
          <rect x="14" y="42" width="6" height="14" rx="2" fill="#334155" />
        </g>
        <g className="dis-trash">
          {/* Lid */}
          <g className="dis-lid">
            <rect x="5" y="47" width="18" height="3" rx="1" fill="#1e293b" />
            <rect x="13" y="44" width="2" height="3" fill="#1e293b" />
          </g>
          {/* Can */}
          <path d="M 6 50 L 22 50 L 20 66 L 8 66 Z" fill="#475569" stroke="#1e293b" strokeWidth="0.6" />
          <line x1="10" y1="53" x2="10" y2="63" stroke="#1e293b" strokeWidth="0.5" />
          <line x1="14" y1="53" x2="14" y2="63" stroke="#1e293b" strokeWidth="0.5" />
          <line x1="18" y1="53" x2="18" y2="63" stroke="#1e293b" strokeWidth="0.5" />
        </g>
        <rect x="56" y="42" width="6" height="14" rx="2" fill="#334155" />
        <circle cx="59" cy="56" r="2.5" fill="#475569" />
        <rect x="26" y="62" width="9" height="5" rx="1.5" fill="#0f172a" />
        <rect x="45" y="62" width="9" height="5" rx="1.5" fill="#0f172a" />
      </g>
    </svg>
  );
}

// =================================================================
// Robot 3 — Stale 2 weeks (alarmed, urgent, exclamation overhead)
// =================================================================

export function StaleTwoWeeksRobot({
  className,
  title = "Steidzami! 2 nedēļas",
}: MascotProps) {
  return (
    <svg
      viewBox="0 0 80 80"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <defs>
        <linearGradient id="stale2-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f87171" />
          <stop offset="100%" stopColor="#991b1b" />
        </linearGradient>
        <linearGradient id="stale2-head" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fca5a5" />
          <stop offset="100%" stopColor="#b91c1c" />
        </linearGradient>
        <radialGradient id="stale2-alarm-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="1" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
      </defs>

      <style>{`
        .st2-shake { transform-origin: 40px 40px; animation: st2-shake 0.35s ease-in-out infinite; }
        @keyframes st2-shake {
          0%,100% { transform: translate(0, 0) rotate(0deg); }
          25%     { transform: translate(-1.5px, 0.5px) rotate(-1.5deg); }
          75%     { transform: translate(1.5px, 0.5px) rotate(1.5deg); }
        }
        .st2-exclaim { transform-origin: 40px 10px; transform-box: fill-box; animation: st2-exclaim 0.6s ease-in-out infinite; }
        @keyframes st2-exclaim {
          0%,100% { transform: scale(0.85) translateY(0); }
          50%     { transform: scale(1.15) translateY(-1.5px); }
        }
        .st2-glow { transform-origin: 40px 10px; transform-box: fill-box; animation: st2-glow 0.6s ease-in-out infinite; }
        @keyframes st2-glow {
          0%,100% { opacity: 0.3; transform: scale(1); }
          50%     { opacity: 0.8; transform: scale(1.5); }
        }
        .st2-eye-wide { animation: st2-wide 0.8s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
        @keyframes st2-wide {
          0%,100% { transform: scale(1); }
          50%     { transform: scale(1.15); }
        }
        .st2-arm-up-l { transform-origin: 19px 42px; transform-box: fill-box; animation: st2-arm 0.5s ease-in-out infinite; }
        .st2-arm-up-r { transform-origin: 61px 42px; transform-box: fill-box; animation: st2-arm 0.5s ease-in-out infinite reverse; }
        @keyframes st2-arm {
          0%,100% { transform: rotate(0deg); }
          50%     { transform: rotate(-8deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .st2-shake, .st2-exclaim, .st2-glow, .st2-eye-wide, .st2-arm-up-l, .st2-arm-up-r {
            animation: none;
          }
        }
      `}</style>

      {/* Alarm glow halo */}
      <circle className="st2-glow" cx="40" cy="10" r="8" fill="url(#stale2-alarm-glow)" />

      {/* Big exclamation mark above head */}
      <g className="st2-exclaim">
        <rect x="38.5" y="3" width="3" height="10" rx="0.8" fill="#dc2626" />
        <circle cx="40" cy="16" r="1.6" fill="#dc2626" />
      </g>

      <g className="st2-shake">
        {/* Head */}
        <rect x="27" y="20" width="26" height="19" rx="5" fill="url(#stale2-head)" />
        <rect x="29" y="24" width="22" height="11" rx="2.5" fill="#7f1d1d" opacity="0.35" />

        {/* Wide-open shocked eyes (X-shape pupils for "deer in headlights") */}
        <circle className="st2-eye-wide" cx="34" cy="29.5" r="2.8" fill="#fef9c3" />
        <circle className="st2-eye-wide" cx="46" cy="29.5" r="2.8" fill="#fef9c3" />
        <line x1="32.5" y1="28" x2="35.5" y2="31" stroke="#7f1d1d" strokeWidth="1.1" strokeLinecap="round" />
        <line x1="35.5" y1="28" x2="32.5" y2="31" stroke="#7f1d1d" strokeWidth="1.1" strokeLinecap="round" />
        <line x1="44.5" y1="28" x2="47.5" y2="31" stroke="#7f1d1d" strokeWidth="1.1" strokeLinecap="round" />
        <line x1="47.5" y1="28" x2="44.5" y2="31" stroke="#7f1d1d" strokeWidth="1.1" strokeLinecap="round" />
        {/* Open mouth (O of shock) */}
        <ellipse cx="40" cy="35.5" rx="2.4" ry="1.6" fill="#7f1d1d" />

        {/* Neck */}
        <rect x="36" y="38" width="8" height="3" fill="#991b1b" />

        {/* Body */}
        <rect x="22" y="40" width="36" height="24" rx="5" fill="url(#stale2-body)" />
        {/* Alarm chest light */}
        <circle cx="40" cy="51" r="3.5" fill="#fbbf24" />
        <circle cx="40" cy="51" r="1.8" fill="#dc2626" />

        {/* Both arms raised in alarm */}
        <g className="st2-arm-up-l">
          <rect x="16" y="42" width="6" height="14" rx="2" fill="#7f1d1d" />
          <circle cx="19" cy="40" r="2.8" fill="#991b1b" />
        </g>
        <g className="st2-arm-up-r">
          <rect x="58" y="42" width="6" height="14" rx="2" fill="#7f1d1d" />
          <circle cx="61" cy="40" r="2.8" fill="#991b1b" />
        </g>

        {/* Feet */}
        <rect x="26" y="64" width="9" height="5" rx="1.5" fill="#7f1d1d" />
        <rect x="45" y="64" width="9" height="5" rx="1.5" fill="#7f1d1d" />
      </g>
    </svg>
  );
}
