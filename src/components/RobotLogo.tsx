"use client";

/**
 * shopify.workmanis.lv mascot — a violet warehouse robot holding a clipboard
 * and writing on it. Pure inline SVG + CSS keyframes; no external assets, no
 * Lottie, no JS animation loop.
 *
 * Animation layers (all auto-running, prefers-reduced-motion respected):
 *   - body  : 3s bob up/down
 *   - blip  : 1.5s antenna LED pulse
 *   - eyes  : 5s blink
 *   - pen   : 1.4s scribble (translate + rotate on the right arm)
 *
 * Color palette is intentionally violet+amber to differentiate from the
 * existing Workmanis.lv blue robot.
 */
export function RobotLogo({
  className,
  title = "shopify.workmanis.lv robot",
}: {
  className?: string;
  title?: string;
}) {
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
        <linearGradient id="rl-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#5b21b6" />
        </linearGradient>
        <linearGradient id="rl-head" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="rl-paper" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="100%" stopColor="#fde68a" />
        </linearGradient>
        <radialGradient id="rl-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="1" />
          <stop offset="60%" stopColor="#fbbf24" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
      </defs>

      <style>{`
        .rl-bob { animation: rl-bob 3s ease-in-out infinite; transform-origin: 40px 40px; }
        @keyframes rl-bob {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-1.5px); }
        }

        .rl-blip { animation: rl-blip 1.5s ease-in-out infinite; transform-origin: 40px 10px; transform-box: fill-box; }
        @keyframes rl-blip {
          0%, 100% { opacity: 0.55; transform: scale(0.9); }
          50%      { opacity: 1;    transform: scale(1.3); }
        }

        .rl-glow { animation: rl-glow 1.5s ease-in-out infinite; transform-origin: 40px 10px; transform-box: fill-box; }
        @keyframes rl-glow {
          0%, 100% { opacity: 0;    transform: scale(0.8); }
          50%      { opacity: 0.55; transform: scale(1.6); }
        }

        .rl-eye {
          transform-origin: center;
          transform-box: fill-box;
          animation: rl-blink 5s infinite;
        }
        @keyframes rl-blink {
          0%, 93%, 97%, 100% { transform: scaleY(1); }
          95%                { transform: scaleY(0.1); }
        }

        .rl-pen-arm {
          transform-origin: 56px 44px;
          transform-box: fill-box;
          animation: rl-write 1.4s ease-in-out infinite;
        }
        @keyframes rl-write {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25%      { transform: translate(1.5px, 0) rotate(10deg); }
          50%      { transform: translate(0, 1px)   rotate(2deg); }
          75%      { transform: translate(-1.5px, 0) rotate(-10deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .rl-bob, .rl-blip, .rl-glow, .rl-eye, .rl-pen-arm {
            animation: none;
          }
        }
      `}</style>

      {/* Antenna blip glow halo (sits behind everything) */}
      <circle className="rl-glow" cx="40" cy="10" r="6" fill="url(#rl-glow)" />

      <g className="rl-bob">
        {/* Antenna */}
        <line
          x1="40"
          y1="12"
          x2="40"
          y2="18"
          stroke="#7c3aed"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <circle className="rl-blip" cx="40" cy="10" r="2.4" fill="#f59e0b" />

        {/* Head */}
        <rect
          x="27"
          y="18"
          width="26"
          height="19"
          rx="5"
          fill="url(#rl-head)"
        />
        {/* Faceplate inset */}
        <rect
          x="29"
          y="22"
          width="22"
          height="11"
          rx="2.5"
          fill="#312e81"
          opacity="0.35"
        />

        {/* Eyes (whites + pupils) */}
        <circle className="rl-eye" cx="34" cy="27.5" r="2.4" fill="#fef3c7" />
        <circle className="rl-eye" cx="46" cy="27.5" r="2.4" fill="#fef3c7" />
        <circle cx="34.5" cy="27.5" r="1" fill="#1e1b4b" />
        <circle cx="46.5" cy="27.5" r="1" fill="#1e1b4b" />

        {/* Neck */}
        <rect x="36" y="36" width="8" height="3" rx="0.5" fill="#5b21b6" />

        {/* Body */}
        <rect
          x="22"
          y="38"
          width="36"
          height="24"
          rx="5"
          fill="url(#rl-body)"
        />

        {/* Chest panel */}
        <rect
          x="33"
          y="44"
          width="14"
          height="10"
          rx="1.5"
          fill="#312e81"
          opacity="0.45"
        />
        <circle cx="40" cy="49" r="2" fill="#fbbf24" />

        {/* Left arm (the one holding the clipboard) */}
        <rect x="16" y="42" width="6" height="16" rx="2" fill="#4c1d95" />

        {/* Clipboard, held in front of body */}
        <g>
          <rect
            x="8"
            y="44"
            width="22"
            height="24"
            rx="1.8"
            fill="url(#rl-paper)"
            stroke="#a16207"
            strokeWidth="0.7"
          />
          {/* Clip */}
          <rect x="15" y="42" width="8" height="4" rx="0.8" fill="#1f2937" />
          <rect x="17.5" y="40.5" width="3" height="2.5" rx="0.4" fill="#4b5563" />
          {/* Lines on paper */}
          <line x1="11" y1="51" x2="27" y2="51" stroke="#a16207" strokeWidth="0.55" strokeLinecap="round" opacity="0.55" />
          <line x1="11" y1="54" x2="25" y2="54" stroke="#a16207" strokeWidth="0.55" strokeLinecap="round" opacity="0.55" />
          <line x1="11" y1="57" x2="27" y2="57" stroke="#a16207" strokeWidth="0.55" strokeLinecap="round" opacity="0.55" />
          <line x1="11" y1="60" x2="24" y2="60" stroke="#a16207" strokeWidth="0.55" strokeLinecap="round" opacity="0.55" />
          <line x1="11" y1="63" x2="26" y2="63" stroke="#a16207" strokeWidth="0.55" strokeLinecap="round" opacity="0.55" />
        </g>

        {/* Right arm with pen — animated scribble */}
        <g className="rl-pen-arm">
          <rect x="56" y="42" width="6" height="14" rx="2" fill="#4c1d95" />
          {/* Hand */}
          <circle cx="59" cy="56" r="2.6" fill="#6d28d9" />
          {/* Pen body */}
          <line
            x1="58.5"
            y1="56.5"
            x2="36"
            y2="60"
            stroke="#1f2937"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          {/* Pen barrel highlight */}
          <line
            x1="58"
            y1="56.2"
            x2="48"
            y2="58"
            stroke="#7c3aed"
            strokeWidth="0.9"
            strokeLinecap="round"
          />
          {/* Pen tip */}
          <circle cx="35.8" cy="60.1" r="0.9" fill="#f59e0b" />
        </g>

        {/* Feet */}
        <rect x="26" y="62" width="9" height="5" rx="1.5" fill="#1e1b4b" />
        <rect x="45" y="62" width="9" height="5" rx="1.5" fill="#1e1b4b" />
      </g>
    </svg>
  );
}
