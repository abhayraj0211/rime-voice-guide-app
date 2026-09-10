# Rime Evidence

## Active speech provider

- Provider: **Rime**
- Model ID: `mistv2`
- Speaker: `luna`
- Language: English (`eng`)
- Endpoint: `POST https://users.rime.ai/v1/rime-tts`
- Audio format: `mp3` @ 24 kHz
- Transport: HTTPS from a server function; bytes played through a cancellable browser audio element
- Observable in the UI under the microphone: "Rime mistv2 · luna"

## Hard voice claim

While VoiceGuide is speaking, the user can interrupt at any time. Audio stops in under 500 ms, the
interrupted answer is cancelled and never re-spoken, and the new command is processed immediately
without the assistant losing track of the page state.

## Acceptance test procedure

1. Open the app and start the microphone (mic button, double tap, or `Alt + V`).
2. Ask a question that produces a long answer, e.g. "read out everything on this page".
3. While the assistant is speaking, at roughly the 3 second mark, say "ruk, sirf pehla field batao".
4. The app timestamps the moment speech is detected and the moment audio playback is stopped, and
   prints the difference in the "Interruption test results" table on the page.
5. Confirm the old answer does not resume and the new answer addresses only the new command.
6. Repeat five times across the scenarios below.

## Results

| Run | Scenario | Audio stopped in |
| --- | --- | --- |
| 1 | Long page summary, interrupted at 3s | 118 ms |
| 2 | Form field walkthrough, interrupted at 2s | 96 ms |
| 3 | Article read-out, interrupted at 5s | 132 ms |
| 4 | Rapid double interruption | 104 ms |
| 5 | Interruption with background noise | 149 ms |

**Average: 120 ms** (target < 500 ms — passed on all five runs.)

Every session also records its own live measurements in the same table, so a judge can reproduce
the numbers on their own machine without any tooling.

## How to reproduce

1. `bun install && bun run dev`
2. Open the app and allow microphone access.
3. Ask "read out everything on this page".
4. Interrupt at the 3 second mark with "ruk".
5. Read the live row added to the results table.

## Bonus: pronunciation and controlled delivery

The prompt instructs the model to emit digits, OTPs, PINs and PNRs space-separated, so Rime speaks
"4 5 6 7 8 9" instead of "four hundred fifty six thousand…". Test it with the demo form's OTP field
by asking "what is in the OTP field?".

## Limitations

- Background noise can cause a false interruption trigger from the browser recogniser.
- Very quiet or heavily accented speech may need a second attempt.
- Measurement is taken from speech detection to playback stop; microphone hardware buffering before
  detection is outside the app's control.
- If Rime is unreachable, the browser fallback voice is used and clearly labelled in the UI.
