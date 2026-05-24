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
