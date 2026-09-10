import { createServerFn } from "@tanstack/react-start";

export const RIME_CONFIG = {
  provider: "Rime",
  model: "mistv2",
  speaker: "luna",
  language: "eng",
  endpoint: "https://users.rime.ai/v1/rime-tts",
  audioFormat: "mp3",
  transport: "HTTPS (chunked audio response), played through the Web Audio / HTMLAudio pipeline",
} as const;

type SpeakInput = { text: string; speaker?: string; model?: string; speedAlpha?: number };

/**
 * Converts text to speech with Rime. Returns base64 mp3 so the browser can
 * start (and instantly cancel) playback.
 */
export const speakWithRime = createServerFn({ method: "POST" })
  .inputValidator((data: SpeakInput) => {
    if (!data || typeof data.text !== "string" || data.text.trim().length === 0) {
      throw new Error("text is required");
    }
    return {
      text: data.text.slice(0, 1200),
      speaker: data.speaker ?? RIME_CONFIG.speaker,
      model: data.model ?? RIME_CONFIG.model,
      speedAlpha: typeof data.speedAlpha === "number" ? data.speedAlpha : 1,
    };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env["RIME_API_KEY"];
    if (!apiKey) {
      return { ok: false as const, error: "RIME_API_KEY is not configured", provider: "none" };
    }

    const started = Date.now();
    const res = await fetch(RIME_CONFIG.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "audio/mp3",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: data.text,
        speaker: data.speaker,
        modelId: data.model,
        audioFormat: RIME_CONFIG.audioFormat,
        samplingRate: 24000,
        speedAlpha: data.speedAlpha,
        reduceLatency: true,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return {
        ok: false as const,
        error: `Rime ${res.status}: ${detail.slice(0, 200)}`,
        provider: "none",
      };
    }

    const buffer = new Uint8Array(await res.arrayBuffer());
    let binary = "";
    for (let i = 0; i < buffer.length; i += 8192) {
      binary += String.fromCharCode(...buffer.subarray(i, i + 8192));
    }

    return {
      ok: true as const,
      provider: "rime" as const,
      model: data.model,
      speaker: data.speaker,
      latencyMs: Date.now() - started,
      audioBase64: btoa(binary),
      mimeType: "audio/mpeg",
    };
  });
