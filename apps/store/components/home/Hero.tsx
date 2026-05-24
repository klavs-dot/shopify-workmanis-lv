"use client";

import { useRef, useState } from "react";
import { Send } from "lucide-react";

import { Container } from "@/components/ui/Container";

// Hero — full-bleed video bg with a Messenger-style Q&A that drives the
// whole hero. No marketing copy on the left; the chat IS the pitch.
//
// Sequential reveal: question 1 + button → click → answer 1 + question 2 +
// button → click → answer 2 + question 3 + button → click → answer 3. Each
// answer also fires a synthesised "pop" sound.

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

export function Hero() {
  // How many answers have been revealed. The widget shows the next pending
  // question + reveal button until all three are answered.
  const [answered, setAnswered] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

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

  const reveal = () => {
    setAnswered((n) => Math.min(n + 1, QA.length));
    playPop();
  };

  const allDone = answered >= QA.length;

  return (
    <section className="relative isolate overflow-hidden bg-neutral-900 text-white">
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
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/45 to-black/70"
      />

      <Container className="flex min-h-[600px] items-center py-14 md:min-h-[680px] md:py-20">
        <div className="mx-auto w-full max-w-2xl space-y-4 md:space-y-5">
          {QA.map((pair, i) => {
            const showQuestion = i <= answered;
            const showAnswer = i < answered;
            if (!showQuestion) return null;
            return (
              <div key={i} className="space-y-3 md:space-y-4">
                {/* Customer question — left */}
                <div className="bubble-in flex items-end gap-2.5 md:gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-neutral-700 text-sm font-bold uppercase text-white md:h-12 md:w-12">
                    ?
                  </div>
                  <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-white px-5 py-3 text-base font-medium text-neutral-900 shadow-xl md:px-6 md:py-4 md:text-lg">
                    {pair.q}
                  </div>
                </div>

                {/* Brand answer — right, with pop animation */}
                {showAnswer && (
                  <div className="bubble-in flex items-end justify-end gap-2.5 md:gap-3">
                    <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-blue-500 px-5 py-3 text-base text-white shadow-xl md:px-6 md:py-4 md:text-lg">
                      {pair.a}
                    </div>
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-600 text-xs font-bold uppercase text-white md:h-12 md:w-12 md:text-sm">
                      14D
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Reveal button — visible while there are pending answers */}
          {!allDone && (
            <div className="bubble-in flex justify-start pl-[3.25rem] md:pl-[3.75rem]">
              <button
                type="button"
                onClick={reveal}
                className="inline-flex items-center gap-2 rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-xl transition hover:bg-blue-600 active:scale-95 md:text-base"
              >
                <Send className="h-4 w-4 md:h-5 md:w-5" />
                Skatīt atbildi
              </button>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
