import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Ear, ScanText, MessageSquare } from "lucide-react";
import { VoiceGuide, type InterruptionResult } from "@/components/VoiceGuide";
import { TestResults } from "@/components/TestResults";
import { FontControls } from "@/components/FontControls";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VoiceGuide — Hear your screen, not just see it" },
      {
        name: "description",
        content:
          "VoiceGuide is a voice assistant for blind and low-vision users. It reads any page aloud with Rime voice and stops the instant you speak.",
      },
      { property: "og:title", content: "VoiceGuide — Hear your screen, not just see it" },
      {
        property: "og:description",
        content:
          "A voice-native screen companion with real-time interruption, powered by Rime. Built by Team Aagaz for the Data Forge Hackathon.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const STEPS = [
  {
    icon: Ear,
    title: "Speak your question",
    body: "Tap the mic, double tap anywhere on the screen, or press Alt + V, then ask in your own words.",
  },
  {
    icon: ScanText,
    title: "It reads the screen",
    body: "VoiceGuide silently scans headings, buttons, links and form fields exactly as a screen reader would.",
  },
  {
    icon: MessageSquare,
    title: "It replies out loud",
    body: "You get a short spoken answer in Rime's voice, and you can cut in at any moment to ask something new.",
  },
];

function Index() {
  const [results, setResults] = useState<InterruptionResult[]>([]);

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <span className="text-2xl font-semibold">VoiceGuide</span>
          <div className="flex flex-wrap items-center gap-5">
            <FontControls />
            <a href="#results" className="text-base text-muted-foreground hover:text-foreground">
              Test results
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-24 px-4 py-16 sm:py-24">
        <section className="text-center">
          <h1 className="mx-auto max-w-3xl text-5xl font-semibold leading-tight sm:text-6xl">
            Hear your screen, not just see it
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            VoiceGuide listens, understands what is on your screen, and speaks back without waiting
            for you to finish. Built for people who navigate the web by ear.
          </p>
          <ul className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {["Real-time interruption", "Powered by Rime voice", "Double tap to talk"].map(
              (chip) => (
                <li
                  key={chip}
                  className="rounded-full border border-border bg-surface px-5 py-2 text-base text-surface-foreground"
                >
                  {chip}
                </li>
              ),
            )}
          </ul>
        </section>

        <section aria-labelledby="how-heading">
          <h2 id="how-heading" className="text-center text-3xl font-semibold sm:text-4xl">
            How it works
          </h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="card-surface p-6">
                <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <step.icon className="size-6" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-xl font-semibold">
                  {index + 1}. {step.title}
                </h3>
                <p className="mt-2 text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <VoiceGuide onResult={(result) => setResults((prev) => [...prev, result])} />

        <section aria-labelledby="demo-heading" className="mx-auto w-full max-w-3xl card-surface p-6 sm:p-8">
          <h2 id="demo-heading" className="text-2xl font-semibold">
            Demo login form
          </h2>
          <p className="mt-2 text-muted-foreground">
            Ask VoiceGuide things like “what fields are on this page?” or “where is the login
            button?” to test screen reading.
          </p>
          <form className="mt-6 space-y-4" onSubmit={(event) => event.preventDefault()}>
            <div>
              <label htmlFor="username" className="block text-base">
                Username
              </label>
              <input
                id="username"
                name="username"
                className="mt-2 min-h-12 w-full rounded-xl border border-border bg-input px-4"
                placeholder="Enter username"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-base">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className="mt-2 min-h-12 w-full rounded-xl border border-border bg-input px-4"
                placeholder="Enter password"
              />
            </div>
            <div>
              <label htmlFor="otp" className="block text-base">
                OTP code
              </label>
              <input
                id="otp"
                name="otp"
                inputMode="numeric"
                className="mt-2 min-h-12 w-full rounded-xl border border-border bg-input px-4"
                placeholder="456789"
              />
            </div>
            <button
              type="submit"
              className="min-h-12 rounded-xl bg-secondary px-6 font-semibold text-secondary-foreground"
            >
              Login
            </button>
          </form>
        </section>

        <TestResults live={results} />
      </main>

      <footer className="border-t border-border py-10 text-center">
        <p className="text-lg font-semibold">Team Aagaz</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Submitted for the Data Forge Hackathon · Voice by Rime
        </p>
      </footer>
    </div>
  );
}
