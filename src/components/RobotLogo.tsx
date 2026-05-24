"use client";

/**
 * WORKMANIS mascot — a violet warehouse robot holding a clipboard
 * and writing on it. Pure inline SVG + CSS keyframes; no external assets,
 * no Lottie, no JS animation loop.
 *
 * The base look is the same as the original, but the motion vocabulary is
 * now layered: 12 independent animations with intentionally **coprime cycle
 * lengths** (mostly primes — 1.3 / 1.7 / 2.1 / 3.7 / 4.5 / 5.9 / 7.3 / 8.1 /
 * 9.7 / 11.3 / 13.1 / 17.9 s). Because the cycles almost never line up, the
 * combined motion never repeats the same exact frame inside any reasonable
 * watching window — you keep seeing fresh combinations.
 *
 * Motion layers:
 *   1.  body bob               4.5 s
 *   2.  body side sway          8.1 s
 *   3.  occasional big jump    17.9 s
 *   4.  antenna LED pulse       1.7 s
 *   5.  antenna sway            5.9 s
 *   6.  eye blink               4.3 s   (95 % open, 5 % closed)
 *   7.  eyes look left          11.3 s  (subtle pupil shift)
 *   8.  eyes look right         13.1 s  (different period, hence asymmetric)
 *   9.  wink (left eye only)   19.0 s  (rare, ~5 % of the cycle)
 *  10.  smile flash             7.3 s   (mouth curves up briefly)
 *  11.  writing-arm scribble    1.3 s   (primary action)
 *  12.  pen tap pause           5.2 s   (interrupts the scribble briefly)
 *  13.  left-arm hold sway      9.7 s   (clipboard tilts gently)
 *  14.  paper sparkle           3.7 s   (✨ near the pen tip)
 *  15.  foot tap                2.1 s   (right foot)
 *
 * All animations respect `prefers-reduced-motion: reduce` — pauses cleanly
 * without removing the SVG itself.
 */
export function RobotLogo({
  className,
  title = "WORKMANIS robot",
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
        /* === 1. Body bob (gentle vertical) === */
        .rl-bob   { animation: rl-bob 4.5s ease-in-out infinite; transform-origin: 40px 40px; }
        @keyframes rl-bob {
          0%,100% { transform: translateY(0); }
          50%     { transform: translateY(-1.5px); }
        }

        /* === 2. Subtle side sway (overlaid on bob) === */
        .rl-sway  { animation: rl-sway 8.1s ease-in-out infinite; transform-origin: 40px 60px; }
        @keyframes rl-sway {
          0%,100% { transform: rotate(0deg); }
          25%     { transform: rotate(-1.5deg); }
          75%     { transform: rotate(1.5deg); }
        }

        /* === 3. Rare big jump (a tiny "yay" every ~18s) === */
        .rl-jump  { animation: rl-jump 17.9s ease-in-out infinite; transform-origin: 40px 60px; }
        @keyframes rl-jump {
          0%, 88%, 100% { transform: translateY(0); }
          92%           { transform: translateY(-5px); }
          96%           { transform: translateY(-1px); }
        }

        /* === 4. Antenna LED pulse === */
        .rl-blip { animation: rl-blip 1.7s ease-in-out infinite; transform-origin: 40px 10px; transform-box: fill-box; }
        @keyframes rl-blip {
          0%,100% { opacity: 0.55; transform: scale(0.9); }
          50%     { opacity: 1;    transform: scale(1.3); }
        }

        /* === 5. Antenna sway (independent from blip) === */
        .rl-ant-sway { animation: rl-ant-sway 5.9s ease-in-out infinite; transform-origin: 40px 18px; transform-box: fill-box; }
        @keyframes rl-ant-sway {
          0%,100% { transform: rotate(0deg); }
          50%     { transform: rotate(8deg); }
        }

        /* === 6. Antenna glow halo === */
        .rl-glow { animation: rl-glow 1.7s ease-in-out infinite; transform-origin: 40px 10px; transform-box: fill-box; }
        @keyframes rl-glow {
          0%,100% { opacity: 0;    transform: scale(0.8); }
          50%     { opacity: 0.55; transform: scale(1.6); }
        }

        /* === 7. Eye blink (both eyes, fast) === */
        .rl-eye {
          transform-origin: center;
          transform-box: fill-box;
          animation: rl-blink 4.3s infinite;
        }
        @keyframes rl-blink {
          0%, 93%, 97%, 100% { transform: scaleY(1); }
          95%                { transform: scaleY(0.1); }
        }

        /* === 8. Pupil look (groups of two — coprime cycles → asymmetric drift) === */
        .rl-pupil-l { animation: rl-look-l 11.3s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
        .rl-pupil-r { animation: rl-look-r 13.1s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
        @keyframes rl-look-l {
          0%, 60%, 100% { transform: translateX(0); }
          30%           { transform: translateX(-0.6px); }
          80%           { transform: translateX(0.6px); }
        }
        @keyframes rl-look-r {
          0%, 50%, 100% { transform: translateX(0); }
          25%           { transform: translateX(0.6px); }
          75%           { transform: translateX(-0.6px); }
        }

        /* === 9. Wink (left eye only, very rare) === */
        .rl-wink { animation: rl-wink 19s infinite; transform-origin: center; transform-box: fill-box; }
        @keyframes rl-wink {
          0%, 89%, 95%, 100% { transform: scaleY(1); }
          92%                { transform: scaleY(0.1); }
        }

        /* === 10. Smile flash (mouth curves up briefly) === */
        .rl-mouth { animation: rl-smile 7.3s ease-in-out infinite; transform-origin: 40px 32px; transform-box: fill-box; }
        @keyframes rl-smile {
          0%, 75%, 100% { transform: scaleY(1) translateY(0); }
          85%           { transform: scaleY(1.6) translateY(-0.5px); }
        }

        /* === 11. Writing arm scribble (primary) === */
        .rl-pen-arm {
          transform-origin: 56px 44px;
          transform-box: fill-box;
          animation: rl-write 1.3s ease-in-out infinite;
        }
        @keyframes rl-write {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25%      { transform: translate(1.5px, 0) rotate(10deg); }
          50%      { transform: translate(0, 1px)   rotate(2deg); }
          75%      { transform: translate(-1.5px, 0) rotate(-10deg); }
        }

        /* === 12. Pen tap pause (interrupts scribble) === */
        .rl-tap   { animation: rl-tap 5.2s infinite; transform-origin: 56px 44px; transform-box: fill-box; }
        @keyframes rl-tap {
          0%, 80%, 100% { transform: translateY(0); }
          85%           { transform: translateY(-1.5px); }
          90%           { transform: translateY(0.5px); }
        }

        /* === 13. Left arm holding clipboard — gentle sway === */
        .rl-clip-arm { animation: rl-clip-sway 9.7s ease-in-out infinite; transform-origin: 17px 44px; transform-box: fill-box; }
        @keyframes rl-clip-sway {
          0%,100% { transform: rotate(0deg); }
          50%     { transform: rotate(-2.5deg); }
        }

        /* === 14. Paper sparkle near pen tip === */
        .rl-sparkle { animation: rl-sparkle 3.7s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
        @keyframes rl-sparkle {
          0%, 60%, 100% { opacity: 0; transform: scale(0.5); }
          75%           { opacity: 1; transform: scale(1.4); }
          85%           { opacity: 0; transform: scale(0.8); }
        }

        /* === 15. Foot tap (right foot) === */
        .rl-foot-r { animation: rl-foot-tap 2.1s ease-in-out infinite; transform-origin: 50px 67px; transform-box: fill-box; }
        @keyframes rl-foot-tap {
          0%, 70%, 100% { transform: translateY(0) rotate(0deg); }
          85%           { transform: translateY(-1px) rotate(-3deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .rl-bob, .rl-sway, .rl-jump,
          .rl-blip, .rl-ant-sway, .rl-glow,
          .rl-eye, .rl-pupil-l, .rl-pupil-r, .rl-wink,
          .rl-mouth, .rl-pen-arm, .rl-tap, .rl-clip-arm,
          .rl-sparkle, .rl-foot-r {
            animation: none;
          }
        }
      `}</style>

      {/* Antenna blip glow halo (sits behind everything) */}
      <circle className="rl-glow" cx="40" cy="10" r="6" fill="url(#rl-glow)" />

      {/* outer wrappers stack the macro motion: jump → sway → bob → contents */}
      <g className="rl-jump">
      <g className="rl-sway">
      <g className="rl-bob">
        {/* Antenna (with its own sway) */}
        <g className="rl-ant-sway">
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
        </g>

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

        {/* Eyes (whites + pupils). Left eye wears the wink class so it
            sometimes closes alone; right eye only does the regular blink. */}
        <g className="rl-wink">
          <circle className="rl-eye" cx="34" cy="27.5" r="2.4" fill="#fef3c7" />
        </g>
        <circle className="rl-eye" cx="46" cy="27.5" r="2.4" fill="#fef3c7" />
        <circle className="rl-pupil-l" cx="34.5" cy="27.5" r="1" fill="#1e1b4b" />
        <circle className="rl-pupil-r" cx="46.5" cy="27.5" r="1" fill="#1e1b4b" />

        {/* Mouth (smile flash) */}
        <g className="rl-mouth">
          <path
            d="M 35 33 Q 40 34.5 45 33"
            stroke="#fef3c7"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
          />
        </g>

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

        {/* Left arm (the one holding the clipboard) — gentle sway */}
        <g className="rl-clip-arm">
          <rect x="16" y="42" width="6" height="16" rx="2" fill="#4c1d95" />

          {/* Clipboard, held in front of body */}
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

          {/* Sparkle near where the pen tip is "writing" */}
          <g className="rl-sparkle" transform="translate(36 60)">
            <path d="M 0 -2 L 0.6 -0.6 L 2 0 L 0.6 0.6 L 0 2 L -0.6 0.6 L -2 0 L -0.6 -0.6 Z" fill="#fbbf24" />
          </g>
        </g>

        {/* Right arm with pen — animated scribble + occasional tap */}
        <g className="rl-tap">
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
        </g>

        {/* Feet — right foot taps */}
        <rect x="26" y="62" width="9" height="5" rx="1.5" fill="#1e1b4b" />
        <rect className="rl-foot-r" x="45" y="62" width="9" height="5" rx="1.5" fill="#1e1b4b" />
      </g>
      </g>
      </g>
    </svg>
  );
}
