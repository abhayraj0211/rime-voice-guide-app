# VoiceGuide

A voice-native web companion for blind and low-vision users. VoiceGuide listens to a spoken
question, reads what is actually on the page (headings, buttons, links, form fields), answers in a
short spoken sentence, and **stops instantly** the moment the user speaks again.

Built by **Team Aagaz** and submitted for the **Data Forge Hackathon** (Rime track).

---

## Why voice is not optional here

The user cannot see the screen. Remove the voice layer and there is no product left — text output
is useless to the person this is built for. Voice is the entire interface.

## Hard voice problem: interruption and recovery

While VoiceGuide is speaking, the microphone stays open. When speech is detected mid-answer:

1. Rime audio playback is cancelled immediately (measured in the UI, target < 500 ms).
2. The in-flight request is invalidated with a request-id guard, so the cancelled answer never
   arrives late and speaks over the new one.
3. The new command is processed right away.
4. The next prompt is told the previous answer was interrupted, so it does not repeat it.

Live measurements appear in the **Interruption test results** section of the page, alongside five
recorded baseline runs. See `RIME_EVIDENCE.md`.

---

## Rime integration details

| Setting | Value |
| --- | --- |
| Provider | **Rime** (https://rime.ai) — the hackathon's speech provider |
| Model / `modelId` | `mistv2` (Rime Mist v2, chosen for lowest latency; `arcana` also available) |
| Speaker / voice | `luna` — clear, natural, neutral English delivery |
| Language | English (`eng`), also handles Hinglish phrasing |
| Endpoint | `POST https://users.rime.ai/v1/rime-tts` |
| Audio format | `mp3`, 24 kHz sampling rate |
| Transport | HTTPS request from a TanStack server function; audio returned as bytes and played through the browser audio element so it can be cancelled in a single frame |
| Extra flags | `reduceLatency: true`, `speedAlpha: 1` |
| Auth | `Authorization: Bearer $RIME_API_KEY` (server side only — never exposed to the browser) |

**Whose voice is Rime?** Rime Labs is an independent speech-AI company that builds text-to-speech
models (Mist v2 and Arcana) recorded from real, everyday human speakers rather than voice actors —
which is why the delivery sounds conversational instead of "announcer-like". `luna` is one of the
speakers from Rime's public voice catalogue. Check Rime's live catalogue at submission time; new
models and speakers are added regularly.

**Fallback disclosure.** If the Rime API call fails (network error, quota, outage), the app falls
back to the browser's built-in speech synthesis so a blind user is never left in silence. This is a
safety net only — the judged flow is always Rime, and the active provider is displayed in the UI
under the mic ("Rime mistv2 · luna" vs "Browser TTS (Rime fallback)").

---

## Architecture

```text
  Microphone
      |
      v
  Browser speech recognition  --(speech while speaking?)--> INTERRUPT: cancel audio + request
      |  final transcript
      v
  Screen extractor (DOM / accessibility attributes: role, aria-label, alt, labels)
      |  question + screen summary
      v
  Server function  -->  Lovable AI Gateway (google/gemini-3.8-flash)  -->  short spoken answer
      |
      v
  Server function  -->  Rime TTS (mistv2 / luna, mp3)  -->  audio bytes
      |
      v
  Browser audio playback (cancellable in one frame)
```

## Third-party services

- **Rime** — text to speech (primary, required).
- **AI Gateway** — reasoning model (`google/gemini-3.8-flash`) that turns the screen
  summary plus the question into a short spoken answer.
- **Browser Web Speech API** — speech recognition and the fallback TTS.

## Setup

1. Add `RIME_API_KEY` as a project secret (it is read server-side only, never committed).
2. Install and run:

```bash
bun install
bun run dev
```

Open the app, allow microphone access, and tap the mic (or double tap anywhere, or press `Alt + V`).

## Accessibility features

- Dynamic type: a text-size control scales the entire page from 80% to 180%.
- Double tap anywhere on the page toggles the microphone; `Alt + V` does the same from the keyboard;
  `Escape` interrupts speech.
- High-contrast dark palette, visible focus rings, 44px minimum tap targets.
- Live regions announce status, transcript and answers to screen readers.
- Digits, OTPs and codes are spoken one digit at a time.

## Known limitations and failure behaviour

- Browser speech recognition is best in Chrome/Edge; other browsers fall back to the text box.
- In a noisy room, speech detection can trigger a false interruption.
- If the model cannot find the answer on the page, it says so out loud instead of guessing.
- If Rime fails, the browser voice takes over and the UI clearly says the fallback is active.
- This build is a web overlay demo; a Chrome extension packaging would apply the same pipeline to
  any third-party website.

## Configuration hygiene

No API keys live in this repository. `RIME_API_KEY` are read from the server
environment inside request handlers only.
