"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, Send } from "lucide-react";

import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";

// Hero — full-bleed warehouse video with a Messenger-style Q&A that IS the
// pitch. Sequential reveal: question → typing dots → word-by-word answer
// (pure CSS stagger, no per-word React ticks) → next question. After the
// last answer, a CTA bubble points to /products and a scroll cue appears.

const QA: Array<{ q: string; a: string }> = [
  {
    q: "Kāpēc tik lēti?",
    a: "Šīs ir preces, kuras nav izņemtas pastā, nav atradies saņēmējs vai citādi atgrieztas lielākajos pasaules interneta veikalos.",
  },
  {
    q: "Kur atrodas noliktava?",
    a: "Preces jau ir Latvijas noliktavā un tiek izsūtītas tajā pašā vai nākamajā dienā.",
  },
  {
    q: "Cik bieži papildinās preces?",
    a: "Katru darba dienu, vairākas reizes dienā.",
  },
];

// Typing indicator duration before the brand starts "writing".
const TYPING_MS = 1000;
// Per-word stagger (CSS animation-delay).
const WORD_MS = 70;
// Word fade-in duration (must match .word-fade in globals.css).
const WORD_FADE_MS = 280;
// Pause after the last word before the next question slides in.
const NEXT_Q_PAUSE_MS = 280;
// Idle delay before the first answer auto-reveals (visitor hasn't clicked).
const AUTO_START_MS = 3500;

function BrandAvatar() {
  return (
    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-400 to-blue-700 text-xs font-bold uppercase text-white shadow-md ring-2 ring-white/25 md:h-12 md:w-12 md:text-sm">
      14D
    </div>
  );
}

function CustomerAvatar() {
  return (
    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-neutral-500 to-neutral-800 text-sm font-bold uppercase text-white shadow-md ring-2 ring-white/20 md:h-12 md:w-12">
      ?
    </div>
  );
}

export function Hero() {
  // How many answers are FULLY revealed.
  const [answered, setAnswered] = useState(0);
  // True while showing "..." (before the first word starts fading in).
  const [typing, setTyping] = useState(false);
  // True while word-fade is in progress for the answer at index `answered`.
  const [revealing, setRevealing] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timersRef = useRef<number[]>([]);

  // Clean up any pending timers if the component unmounts mid-flight.
  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => window.clearTimeout(t));
      timersRef.current = [];
    };
  }, []);

  const playPop = () => {
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") void ctx.resume();
      const now = ctx.currentTime;

      const o1 = ctx.createOscillator();
      const g1 = ctx.createGain();
      o1.type = "sine";
      o1.frequency.setValueAtTime(1100, now);
      o1.frequency.exponentialRampToValueAtTime(600, now + 0.08);
      g1.gain.setValueAtTime(0, now);
      g1.gain.linearRampToValueAtTime(0.22, now + 0.01);
      g1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      o1.connect(g1).connect(ctx.destination);
      o1.start(now);
      o1.stop(now + 0.25);

      const o2 = ctx.createOscillator();
      const g2 = ctx.createGain();
      o2.type = "sine";
      o2.frequency.setValueAtTime(1800, now);
      g2.gain.setValueAtTime(0, now);
      g2.gain.linearRampToValueAtTime(0.08, now + 0.005);
      g2.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      o2.connect(g2).connect(ctx.destination);
      o2.start(now);
      o2.stop(now + 0.1);
    } catch {
      /* audio is optional */
    }
  };

  /** Schedule a timeout and remember its id for cleanup. */
  const schedule = (fn: () => void, delay: number) => {
    const id = window.setTimeout(fn, delay);
    timersRef.current.push(id);
    return id;
  };

  const reveal = () => {
    if (typing || revealing) return; // ignore mid-flight clicks
    setTyping(true);

    schedule(() => {
      setTyping(false);
      playPop();
      const text = QA[answered]?.a ?? "";
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      if (wordCount === 0) {
        setAnswered((n) => Math.min(n + 1, QA.length));
        return;
      }
      setRevealing(true);
      const lastWordStart = (wordCount - 1) * WORD_MS;
      const fullAnimMs = lastWordStart + WORD_FADE_MS + NEXT_Q_PAUSE_MS;
      schedule(() => {
        setRevealing(false);
        setAnswered((n) => Math.min(n + 1, QA.length));
      }, fullAnimMs);
    }, TYPING_MS);
  };

  // Auto-start the first answer after a short idle so the hero never sits
  // frozen. Fires only from the untouched initial state; any user click
  // flips `typing` and the effect cleanup cancels the timer.
  useEffect(() => {
    if (answered !== 0 || typing || revealing) return;
    const id = window.setTimeout(() => reveal(), AUTO_START_MS);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answered, typing, revealing]);

  const allDone = answered >= QA.length && !typing && !revealing;
  const isComposing = typing || revealing;

  return (
    <section className="relative isolate overflow-hidden bg-neutral-900 text-white">
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/hero-poster.jpg"
        aria-hidden
        className="absolute inset-0 -z-10 h-full w-full object-cover opacity-80"
      >
        <source src="/hero.mp4" type="video/mp4" />
      </video>
      {/* Overlay tuned so the warehouse footage stays visible — the bubbles
       *  are opaque and don't need it for legibility, only the edges do. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-black/60 via-black/25 to-black/60"
      />

      <Container className="flex min-h-[560px] items-center py-12 md:min-h-[660px] md:py-20">
        <div className="mx-auto w-full max-w-2xl space-y-4 md:space-y-5">
          {QA.map((pair, i) => {
            const showQuestion = i <= answered;
            const showFullAnswer = i < answered;
            const showTyping = typing && i === answered;
            const showRevealing = revealing && i === answered;
            if (!showQuestion) return null;

            return (
              <div key={i} className="space-y-3 md:space-y-4">
                {/* Customer question — left, glass white */}
                <div className="bubble-in flex items-end gap-2.5 md:gap-3">
                  <CustomerAvatar />
                  <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-white/90 px-5 py-3 text-base font-medium text-neutral-900 shadow-lg shadow-black/30 ring-1 ring-white/50 backdrop-blur-md md:px-6 md:py-4 md:text-lg">
                    {pair.q}
                  </div>
                </div>

                {/* Typing indicator */}
                {showTyping && (
                  <div
                    className="bubble-in flex items-end justify-end gap-2.5 md:gap-3"
                    aria-live="polite"
                    aria-label="14D raksta atbildi"
                  >
                    <div className="flex items-center gap-1.5 rounded-2xl rounded-br-sm bg-gradient-to-b from-blue-500 to-blue-600 px-5 py-3.5 text-white shadow-lg shadow-blue-900/40 ring-1 ring-white/20 md:px-6 md:py-4">
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                    </div>
                    <BrandAvatar />
                  </div>
                )}

                {/* Revealing answer — words fade in via CSS stagger */}
                {showRevealing && (
                  <div
                    className="bubble-in flex items-end justify-end gap-2.5 md:gap-3"
                    aria-live="polite"
                  >
                    <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-gradient-to-b from-blue-500 to-blue-600 px-5 py-3 text-base text-white shadow-lg shadow-blue-900/40 ring-1 ring-white/20 md:px-6 md:py-4 md:text-lg">
                      {pair.a.split(/\s+/).map((w, wi, arr) => (
                        <span
                          key={wi}
                          className="word-fade"
                          style={{ animationDelay: `${wi * WORD_MS}ms` }}
                        >
                          {w}
                          {wi < arr.length - 1 ? " " : ""}
                        </span>
                      ))}
                    </div>
                    <BrandAvatar />
                  </div>
                )}

                {/* Fully revealed answer */}
                {showFullAnswer && (
                  <div className="bubble-in flex items-end justify-end gap-2.5 md:gap-3">
                    <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-gradient-to-b from-blue-500 to-blue-600 px-5 py-3 text-base text-white shadow-lg shadow-blue-900/40 ring-1 ring-white/20 md:px-6 md:py-4 md:text-lg">
                      {pair.a}
                    </div>
                    <BrandAvatar />
                  </div>
                )}
              </div>
            );
          })}

          {/* Reveal button — glass quick-reply chip on the customer side */}
          {!allDone && !isComposing && (
            <div className="bubble-in flex justify-start pl-[3.125rem] md:pl-[3.75rem]">
              <button
                type="button"
                onClick={reveal}
                className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/15 px-5 py-2.5 text-sm font-semibold text-white shadow-lg backdrop-blur-md transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 active:scale-95 md:text-base"
              >
                <Send className="h-4 w-4 md:h-5 md:w-5" />
                Skatīt atbildi
              </button>
            </div>
          )}

          {/* CTA after the conversation completes */}
          {allDone && (
            <div className="bubble-in flex items-end justify-end gap-2.5 md:gap-3">
              <Link
                href="/products"
                className="inline-flex max-w-[85%] items-center gap-2 rounded-2xl rounded-br-sm bg-white px-5 py-3 text-base font-semibold text-neutral-900 shadow-lg shadow-black/30 transition hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 md:px-6 md:py-4 md:text-lg"
              >
                Skatīt visus piedāvājumus
                <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
              </Link>
              <BrandAvatar />
            </div>
          )}
        </div>
      </Container>

      {/* Scroll cue once the chat is done */}
      {allDone && (
        <div className="bubble-in pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2">
          <ChevronDown
            className={cn(
              "h-6 w-6 animate-bounce text-white/70",
              "motion-reduce:animate-none"
            )}
          />
        </div>
      )}
    </section>
  );
}
