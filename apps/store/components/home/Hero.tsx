"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Send } from "lucide-react";

import { Container } from "@/components/ui/Container";

// Hero with autoplay video background + Messenger-style chat bubble:
// - Question bubble pre-rendered ("Kāpēc tik lēti?")
// - User clicks "Skatīt atbildi" → answer bubble pops in (with sound + slide-up)
//
// The answer is the brand's elevator pitch — these are returned / undelivered
// packages from major online retailers, hence the prices.

export function Hero() {
  const [showAnswer, setShowAnswer] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  /** Tiny synthesised "messenger pop" — two stacked sines with a fast decay.
   *  Avoids shipping an mp3 and stays under 2 KB of code. */
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

      // Punchy body — sine sweeps from 1100 → 600 Hz over ~80 ms
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

      // High shimmer on top — 1800 Hz sine for the "click" attack
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
      // Audio is a nice-to-have — never let it block the visual reveal.
    }
  };

  const reveal = () => {
    setShowAnswer(true);
    playPop();
  };

  return (
    <section className="relative isolate overflow-hidden bg-neutral-900 text-white">
      {/* Background video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden
        className="absolute inset-0 -z-10 h-full w-full object-cover opacity-65"
      >
        <source src="/hero.mp4" type="video/mp4" />
      </video>
      {/* Dark gradient overlay — keeps text/bubble readable over any frame */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-r from-black/75 via-black/45 to-black/25"
      />

      <Container className="grid min-h-[440px] gap-8 py-14 md:min-h-[520px] md:grid-cols-[1.1fr_1fr] md:items-center md:py-20">
        {/* Left — pitch + CTAs */}
        <div>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
            Outlet, atvērtas preces un palešu atradumi
          </h1>
          <p className="mt-3 max-w-xl text-sm text-neutral-200 md:text-base">
            Atlaides līdz{" "}
            <span className="font-bold text-white">90%</span> no oriģinālās
            cenas. Ierobežots daudzums — paspēj pirms pazūd.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/products"
              className="rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100"
            >
              Skatīt produktus
            </Link>
            <Link
              href="/categories"
              className="rounded-md border border-white/30 px-5 py-2.5 text-sm font-medium text-white transition hover:border-white/60 hover:bg-white/10"
            >
              Kategorijas
            </Link>
          </div>
        </div>

        {/* Right — messenger-style chat */}
        <div className="flex w-full justify-center md:justify-end">
          <div className="w-full max-w-sm space-y-3">
            {/* Customer (incoming) bubble — left side, white */}
            <div className="flex items-end gap-2">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-neutral-700 text-[10px] font-bold uppercase text-white">
                ?
              </div>
              <div className="relative max-w-[80%] rounded-2xl rounded-bl-sm bg-white px-4 py-2.5 text-sm text-neutral-900 shadow-lg">
                Kāpēc tik lēti?
              </div>
            </div>

            {!showAnswer ? (
              /* Reveal button — looks like a messenger "send" input */
              <button
                type="button"
                onClick={reveal}
                className="ml-10 inline-flex items-center gap-2 rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-600 active:scale-95"
              >
                <Send className="h-4 w-4" />
                Skatīt atbildi
              </button>
            ) : (
              /* Answer (outgoing) bubble — right side, brand colour, animated in */
              <div className="bubble-in flex items-end justify-end gap-2">
                <div className="relative max-w-[85%] rounded-2xl rounded-br-sm bg-blue-500 px-4 py-2.5 text-sm text-white shadow-lg">
                  Šīs ir preces, kuras nav izņemtas pastā, nav atradies
                  saņēmējs vai citādi atgrieztas lielākajos pasaules interneta
                  veikalos.
                </div>
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-600 text-[10px] font-bold uppercase text-white">
                  14D
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
