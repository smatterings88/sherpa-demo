"use client";

import { PulsingOrb } from "@/components/pulsing-orb";
import { SEGMENT_GAP_MS } from "@/lib/demo/constants";
import { formatUsd } from "@/lib/demo/currency";
import type {
  AudioSegment,
  GenerateDemoErrorResponse,
  GenerateDemoSuccessResponse,
} from "@/lib/demo/types";
import { parsePositiveNumber } from "@/lib/demo/validation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const APP_NAME =
  process.env.NEXT_PUBLIC_APP_NAME?.trim() || "Alex the Sherpa";

const GENERIC_ERROR =
  "Couldn't build the demo right now. Please try again.";

function base64ToBlob(base64: string, mime: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

export function InteractiveLossDemo() {
  const [dealInput, setDealInput] = useState("");
  const [commissionInput, setCommissionInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demo, setDemo] = useState<GenerateDemoSuccessResponse | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlsRef = useRef<string[]>([]);
  const indexRef = useRef(0);
  const audioModeRef = useRef<"single" | "segments">("segments");
  const [isPlaying, setIsPlaying] = useState(false);

  const playerAnchorRef = useRef<HTMLDivElement | null>(null);

  const revokeUrls = useCallback(() => {
    urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    urlsRef.current = [];
  }, []);

  useEffect(() => () => revokeUrls(), [revokeUrls]);

  const startSegmentPlayback = useCallback(
    (segments: AudioSegment[]) => {
      audioModeRef.current = "segments";
      revokeUrls();
      const urls = segments.map((s) => {
        const blob = base64ToBlob(s.base64, s.mimeType);
        return URL.createObjectURL(blob);
      });
      urlsRef.current = urls;
      indexRef.current = 0;
      const el = audioRef.current;
      if (!el || urls.length === 0) return;
      el.src = urls[0]!;
      setIsPlaying(true);
      void el.play().catch(() => {
        setIsPlaying(false);
      });
    },
    [revokeUrls],
  );

  const startSingleUrlPlayback = useCallback(
    (url: string) => {
      audioModeRef.current = "single";
      revokeUrls();
      urlsRef.current = [];
      indexRef.current = 0;
      const el = audioRef.current;
      if (!el) return;
      el.src = url;
      setIsPlaying(true);
      void el.play().catch(() => setIsPlaying(false));
    },
    [revokeUrls],
  );

  const startFromDemo = useCallback(
    (data: GenerateDemoSuccessResponse) => {
      if (data.audioMode === "single") {
        startSingleUrlPlayback(data.audioUrl);
        return;
      }
      startSegmentPlayback(data.segments);
    },
    [startSegmentPlayback, startSingleUrlPlayback],
  );

  const handleAudioEnded = useCallback(() => {
    if (audioModeRef.current === "single") {
      setIsPlaying(false);
      return;
    }
    const next = indexRef.current + 1;
    const urls = urlsRef.current;
    if (next < urls.length) {
      indexRef.current = next;
      window.setTimeout(() => {
        const el = audioRef.current;
        if (!el) return;
        el.src = urls[next]!;
        void el.play().catch(() => setIsPlaying(false));
      }, SEGMENT_GAP_MS);
    } else {
      setIsPlaying(false);
    }
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dealSize = parsePositiveNumber(dealInput);
    const commission = parsePositiveNumber(commissionInput);

    if (dealSize === null) {
      setError("Enter a positive average deal size.");
      return;
    }
    if (commission === null) {
      setError("Enter a positive commission amount.");
      return;
    }

    setLoading(true);
    setError(null);
    setIsPlaying(false);
    const elStop = audioRef.current;
    if (elStop) {
      elStop.pause();
      elStop.removeAttribute("src");
    }
    revokeUrls();

    try {
      const res = await fetch("/api/demo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealSize, commission }),
      });

      const data: GenerateDemoSuccessResponse | GenerateDemoErrorResponse =
        await res.json();

      if (!res.ok || !data.success) {
        const err = data as GenerateDemoErrorResponse;
        if (err.code === "VALIDATION" && err.error) {
          setError(err.error);
        } else {
          setError(GENERIC_ERROR);
        }
        return;
      }

      setDemo(data);
      requestAnimationFrame(() => {
        playerAnchorRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
      startFromDemo(data);
    } catch {
      setError(GENERIC_ERROR);
    } finally {
      setLoading(false);
    }
  };

  const onReplay = () => {
    if (!demo) return;
    startFromDemo(demo);
  };

  const loss = demo?.loss;

  return (
    <section className="w-full px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-10">
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
              {APP_NAME}
            </p>
            <h2 className="mt-3 text-balance text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
              See exactly where you’re losing deals — and what it’s costing you
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-sm leading-relaxed text-zinc-400 sm:text-base">
              Most sales reps don’t lose deals because they don’t know what to
              say. They lose them in the moment they hesitate.
            </p>
          </div>

          <form onSubmit={onSubmit} className="mt-10 space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="deal-size"
                className="block text-left text-sm font-medium text-zinc-300"
              >
                What’s your average deal size?
              </label>
              <input
                id="deal-size"
                name="dealSize"
                inputMode="decimal"
                autoComplete="off"
                placeholder="10,000"
                value={dealInput}
                onChange={(e) => setDealInput(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-base text-zinc-100 outline-none ring-violet-500/40 transition placeholder:text-zinc-600 focus:border-violet-500/50 focus:ring-2"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="commission"
                className="block text-left text-sm font-medium text-zinc-300"
              >
                What do you make when you close one?
              </label>
              <input
                id="commission"
                name="commission"
                inputMode="decimal"
                autoComplete="off"
                placeholder="1,000"
                value={commissionInput}
                onChange={(e) => setCommissionInput(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-base text-zinc-100 outline-none ring-violet-500/40 transition placeholder:text-zinc-600 focus:border-violet-500/50 focus:ring-2"
              />
            </div>

            {error ? (
              <p
                className="text-center text-sm text-red-400/90"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-violet-600 px-5 py-3.5 text-center text-sm font-semibold text-white shadow-[0_12px_40px_rgba(124,58,237,0.35)] transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Building your demo..." : "Show me what that mistake costs"}
            </button>
          </form>

          <div ref={playerAnchorRef} className="mt-12 scroll-mt-8">
            {demo ? (
              <div className="space-y-8 border-t border-white/10 pt-10 transition-opacity duration-500">
                <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-center sm:gap-10">
                  <PulsingOrb active={isPlaying} />
                  <div className="flex flex-col items-center gap-3 sm:items-start">
                    <p className="text-center text-sm text-zinc-400 sm:text-left">
                      {isPlaying
                        ? "Listen. This is the moment."
                        : "Press play to hear it again."}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                      <button
                        type="button"
                        onClick={onReplay}
                        className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-violet-500/40 hover:bg-white/10"
                      >
                        Play that again
                      </button>
                    </div>
                  </div>
                </div>

                <audio
                  ref={audioRef}
                  className="hidden"
                  onEnded={handleAudioEnded}
                  preload="auto"
                />

                {loss ? (
                  <div className="space-y-4 text-center sm:text-left">
                    <p className="text-lg font-medium text-zinc-100 sm:text-xl">
                      That moment just cost you {formatUsd(loss.commission)}.
                    </p>
                    <p className="text-lg font-medium text-zinc-100 sm:text-xl">
                      That was a {formatUsd(loss.dealSize)} deal... gone.
                    </p>
                    <p className="text-lg font-medium text-zinc-100 sm:text-xl">
                      If that happens twice a month, that’s{" "}
                      {formatUsd(loss.annualLoss)} a year.
                    </p>
                    <p className="pt-2 text-sm font-medium text-violet-300/90">
                      That’s not a knowledge problem. That’s a moment problem.
                    </p>
                    <p className="text-sm leading-relaxed text-zinc-500">
                      {APP_NAME} exists for one thing: to fix that exact moment
                      while it’s happening.
                    </p>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="border-t border-transparent pt-10 text-center text-xs text-zinc-600">
                Your numbers stay in this session — nothing is stored.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
