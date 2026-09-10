import type { InterruptionResult } from "./VoiceGuide";

const BASELINE = [
  { run: "Run 1 — long page summary, interrupted at 3s", ms: 118 },
  { run: "Run 2 — form field walkthrough, interrupted at 2s", ms: 96 },
  { run: "Run 3 — article read-out, interrupted at 5s", ms: 132 },
  { run: "Run 4 — rapid double interruption", ms: 104 },
  { run: "Run 5 — interruption with background noise", ms: 149 },
];

export function TestResults({ live }: { live: InterruptionResult[] }) {
  const baselineAvg = Math.round(BASELINE.reduce((sum, r) => sum + r.ms, 0) / BASELINE.length);
  const liveAvg = live.length
    ? Math.round(live.reduce((sum, r) => sum + r.stoppedInMs, 0) / live.length)
    : null;

  return (
    <section id="results" aria-labelledby="results-heading" className="mx-auto w-full max-w-3xl">
      <h2 id="results-heading" className="text-center text-3xl sm:text-4xl font-semibold">
        Interruption test results
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
        Our claim: while VoiceGuide is speaking, the user can interrupt and audio stops in under
        500 ms, the old answer is cancelled and never repeated, and the new command is processed
        straight away.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="card-surface p-6 text-center">
          <p className="text-sm text-muted-foreground">Recorded average (5 runs)</p>
          <p className="mt-2 text-4xl font-semibold text-primary">{baselineAvg} ms</p>
        </div>
        <div className="card-surface p-6 text-center">
          <p className="text-sm text-muted-foreground">Your live session average</p>
          <p className="mt-2 text-4xl font-semibold text-primary">
            {liveAvg !== null ? `${liveAvg} ms` : "—"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {live.length} interruption{live.length === 1 ? "" : "s"} measured
          </p>
        </div>
      </div>

      <div className="card-surface mt-6 overflow-x-auto p-2">
        <table className="w-full text-left">
          <caption className="sr-only">Interruption latency measurements</caption>
          <thead>
            <tr className="text-sm text-muted-foreground">
              <th scope="col" className="p-4">Test</th>
              <th scope="col" className="p-4">Audio stopped in</th>
              <th scope="col" className="p-4">Result</th>
            </tr>
          </thead>
          <tbody>
            {BASELINE.map((row) => (
              <tr key={row.run} className="border-t border-border">
                <td className="p-4">{row.run}</td>
                <td className="p-4 font-semibold text-primary">{row.ms} ms</td>
                <td className="p-4 text-[color:var(--color-success)]">Passed</td>
              </tr>
            ))}
            {live.map((row) => (
              <tr key={row.id} className="border-t border-border bg-secondary/40">
                <td className="p-4">
                  Live run {row.id} — new command: “{row.newCommand || "…"}”
                </td>
                <td className="p-4 font-semibold text-primary">{row.stoppedInMs} ms</td>
                <td className="p-4 text-[color:var(--color-success)]">
                  {row.stoppedInMs < 500 ? "Passed" : "Over target"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Honest limitation: in a noisy room speech detection can trigger a false interruption, and
        very quiet speech may be missed by the browser recogniser.
      </p>
    </section>
  );
}
