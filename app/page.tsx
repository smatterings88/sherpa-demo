import { InteractiveLossDemo } from "@/components/interactive-loss-demo";

export default function Home() {
  return (
    <div className="min-h-full bg-gradient-to-b from-zinc-950 via-zinc-950 to-black text-zinc-100">
      <header className="border-b border-white/5 bg-black/30 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
          <span className="text-sm font-semibold tracking-tight text-zinc-200">
            {process.env.NEXT_PUBLIC_APP_NAME ?? "Alex the Sherpa"}
          </span>
          <span className="text-xs text-zinc-500">Lost deal demo</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl pb-24">
        <div className="px-4 pt-12 text-center sm:pt-16">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-violet-400/80">
            Voice-guided moment
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            The hesitation you don’t notice — until the deal is gone.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-zinc-400 sm:text-base">
            Below is a short, personalized audio moment built from your numbers.
            Nothing is stored. Headphones recommended.
          </p>
        </div>

        <InteractiveLossDemo />
      </main>

      <footer className="border-t border-white/5 py-8 text-center text-xs text-zinc-600">
        Demo experience · Not the product
      </footer>
    </div>
  );
}
