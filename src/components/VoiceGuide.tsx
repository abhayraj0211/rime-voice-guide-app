import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square, Type, Loader2, Volume2 } from "lucide-react";
import { speakWithRime, RIME_CONFIG } from "@/lib/rime.functions";
import { askVoiceGuide } from "@/lib/assistant.functions";
import { extractScreenContent } from "@/lib/screen-reader";

type Status = "idle" | "listening" | "thinking" | "speaking";

export type InterruptionResult = {
  id: number;
  spokenWords: string;
  stoppedInMs: number;
  newCommand: string;
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
};

function getRecognition(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!Ctor) return null;
  const rec: SpeechRecognitionLike = new Ctor();
  rec.lang = "en-IN";
  rec.continuous = true;
  rec.interimResults = true;
  return rec;
}

export function VoiceGuide({
  onResult,
}: {
  onResult: (result: InterruptionResult) => void;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [transcript, setTranscript] = useState("");
  const [answer, setAnswer] = useState("");
  const [typed, setTyped] = useState("");
  const [note, setNote] = useState("");
  const [provider, setProvider] = useState<"rime" | "browser fallback" | null>(null);
  const [supported, setSupported] = useState(true);

  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speakingRef = useRef(false);
  const lastAnswerRef = useRef("");
  const wasInterruptedRef = useRef(false);
  const requestIdRef = useRef(0);
  const resultIdRef = useRef(0);

  const stopSpeaking = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    speakingRef.current = false;
  }, []);

  /** Barge-in: cancel current audio + in-flight answer, measure the stop time. */
  const interrupt = useCallback(
    (heard: string) => {
      const t0 = performance.now();
      requestIdRef.current += 1;
      stopSpeaking();
      const stoppedInMs = Math.round(performance.now() - t0);
      wasInterruptedRef.current = true;
      resultIdRef.current += 1;
      onResult({
        id: resultIdRef.current,
        spokenWords: lastAnswerRef.current.slice(0, 90),
        stoppedInMs,
        newCommand: heard,
      });
    },
    [onResult, stopSpeaking],
  );

  const speak = useCallback(async (text: string, requestId: number) => {
    setStatus("speaking");
    speakingRef.current = true;
    lastAnswerRef.current = text;

    try {
      const res = await speakWithRime({ data: { text } });
      if (requestId !== requestIdRef.current) return;

      if (res.ok) {
        setProvider("rime");
        const audio = new Audio(`data:${res.mimeType};base64,${res.audioBase64}`);
        audioRef.current = audio;
        audio.onended = () => {
          speakingRef.current = false;
          setStatus((s) => (s === "speaking" ? "listening" : s));
        };
        await audio.play().catch(() => undefined);
        return;
      }
      throw new Error(res.error);
    } catch {
      if (requestId !== requestIdRef.current) return;
      setProvider("browser fallback");
      if (typeof window !== "undefined" && window.speechSynthesis) {
        const utter = new SpeechSynthesisUtterance(text);
        utter.onend = () => {
          speakingRef.current = false;
          setStatus((s) => (s === "speaking" ? "listening" : s));
        };
        window.speechSynthesis.speak(utter);
      }
    }
  }, []);

  const handleQuestion = useCallback(
    async (question: string) => {
      if (!question.trim()) return;
      requestIdRef.current += 1;
      const requestId = requestIdRef.current;
      setTranscript(question);
      setStatus("thinking");
      setAnswer("");

      const screen = extractScreenContent();
      const res = await askVoiceGuide({
        data: { question, screen, interrupted: wasInterruptedRef.current },
      });
      wasInterruptedRef.current = false;
      if (requestId !== requestIdRef.current) return;

      if (!res.ok) {
        setAnswer(res.error);
        await speak(res.error, requestId);
        return;
      }
      setAnswer(res.answer);
      await speak(res.answer, requestId);
    },
    [speak],
  );

  const startListening = useCallback(() => {
    const rec = recRef.current ?? getRecognition();
    if (!rec) {
      setSupported(false);
      setNote("Voice input is not supported in this browser. Use the text box below.");
      return;
    }
    recRef.current = rec;

    rec.onresult = (event: any) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += chunk;
        else interimText += chunk;
      }
      if (speakingRef.current && (interimText.trim() || finalText.trim())) {
        interrupt((finalText || interimText).trim());
      }
      if (interimText) setTranscript(interimText);
      if (finalText.trim()) void handleQuestion(finalText.trim());
    };
    rec.onerror = (event: any) => {
      if (event?.error === "not-allowed") {
        setNote("Microphone permission was blocked. Allow it in your browser settings.");
        setStatus("idle");
      }
    };
    rec.onend = () => {
      if (statusRef.current !== "idle") {
        try {
          rec.start();
        } catch {
          /* already started */
        }
      }
    };

    try {
      rec.start();
    } catch {
      /* already started */
    }
    setNote("");
    setStatus("listening");
  }, [handleQuestion, interrupt]);

  const statusRef = useRef<Status>("idle");
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const stopEverything = useCallback(() => {
    requestIdRef.current += 1;
    statusRef.current = "idle";
    stopSpeaking();
    recRef.current?.stop();
    setStatus("idle");
  }, [stopSpeaking]);

  const toggle = useCallback(() => {
    if (statusRef.current === "idle") startListening();
    else stopEverything();
  }, [startListening, stopEverything]);

  /* Double tap / double click anywhere on the page activates the mic. */
  useEffect(() => {
    let lastTap = 0;
    const onPointer = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, button, a")) return;
      const now = Date.now();
      if (now - lastTap < 400) {
        lastTap = 0;
        toggle();
      } else {
        lastTap = now;
      }
    };
    document.addEventListener("pointerup", onPointer);
    return () => document.removeEventListener("pointerup", onPointer);
  }, [toggle]);

  /* Keyboard shortcut: Alt + V */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey && event.key.toLowerCase() === "v") {
        event.preventDefault();
        toggle();
      }
      if (event.key === "Escape" && speakingRef.current) interrupt("stop");
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [toggle, interrupt]);

  useEffect(() => () => stopEverything(), [stopEverything]);

  const statusLabel: Record<Status, string> = {
    idle: "Tap the mic, double tap anywhere, or press Alt + V to start",
    listening: "Listening — speak your question",
    thinking: "Reading the screen and thinking",
    speaking: "Speaking — say anything to interrupt instantly",
  };

  return (
    <section
      id="try"
      aria-labelledby="try-heading"
      className="mx-auto w-full max-w-3xl card-surface p-6 sm:p-10"
    >
      <h2 id="try-heading" className="text-center text-3xl sm:text-4xl font-semibold">
        Try VoiceGuide
      </h2>
      <p className="mt-3 text-center text-muted-foreground">
        Speak or type a question about this page. Double tap anywhere on the screen to open the
        mic.
      </p>

      <div className="mt-8 flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={toggle}
          aria-label={status === "idle" ? "Start VoiceGuide microphone" : "Stop VoiceGuide"}
          aria-pressed={status !== "idle"}
          className={`flex size-28 min-h-11 min-w-11 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 ${
            status === "listening" ? "mic-live" : ""
          }`}
        >
          {status === "thinking" ? (
            <Loader2 className="size-12 animate-spin" aria-hidden="true" />
          ) : status === "idle" ? (
            <Mic className="size-12" aria-hidden="true" />
          ) : (
            <Square className="size-11" aria-hidden="true" />
          )}
        </button>

        <p aria-live="polite" className="text-center text-base text-muted-foreground">
          {statusLabel[status]}
        </p>
        {note && (
          <p role="alert" className="text-center text-base text-destructive">
            {note}
          </p>
        )}
      </div>

      <form
        className="mt-8 flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          void handleQuestion(typed);
          setTyped("");
        }}
      >
        <label htmlFor="question" className="sr-only">
          Type your question
        </label>
        <input
          id="question"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          placeholder="e.g. login button kaha hai?"
          className="min-h-12 flex-1 rounded-xl border border-border bg-input px-4 text-foreground placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          className="min-h-12 rounded-xl bg-primary px-6 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Ask VoiceGuide
        </button>
      </form>

      {(transcript || answer) && (
        <div className="mt-8 space-y-4" aria-live="polite">
          {transcript && (
            <p className="rounded-xl bg-secondary p-4 text-secondary-foreground">
              <span className="font-semibold">You said:</span> {transcript}
            </p>
          )}
          {answer && (
            <p className="rounded-xl bg-muted p-4">
              <span className="font-semibold">VoiceGuide:</span> {answer}
            </p>
          )}
        </div>
      )}

      <p className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Volume2 className="size-4" aria-hidden="true" />
        Active speech provider:{" "}
        <span className="font-semibold text-primary">
          {provider === "browser fallback"
            ? "Browser TTS (Rime fallback)"
            : `Rime ${RIME_CONFIG.model} · ${RIME_CONFIG.speaker}`}
        </span>
      </p>
      {!supported && (
        <p className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Type className="size-4" aria-hidden="true" /> Text mode is fully supported here.
        </p>
      )}
    </section>
  );
}
