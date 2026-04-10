"use client";

export function PulsingOrb({ active }: { active: boolean }) {
  return (
    <div
      className="relative flex h-28 w-28 shrink-0 items-center justify-center"
      aria-hidden
    >
      <div
        className={
          active
            ? "absolute inset-2 rounded-full bg-violet-500/25 blur-xl animate-pulse duration-[1.6s]"
            : "absolute inset-2 rounded-full bg-violet-500/10 blur-md"
        }
      />
      {active ? (
        <span className="absolute inline-flex h-20 w-20 rounded-full bg-violet-400/20 animate-ping [animation-duration:2s]" />
      ) : null}
      <div
        className={`relative h-16 w-16 rounded-full bg-gradient-to-br from-violet-300/90 via-violet-500/85 to-fuchsia-700/90 shadow-[0_0_48px_rgba(124,58,237,0.35)] transition-transform duration-500 ${
          active ? "scale-100" : "scale-95 opacity-80"
        }`}
      />
    </div>
  );
}
