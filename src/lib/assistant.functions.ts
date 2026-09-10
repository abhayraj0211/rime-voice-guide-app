import { createServerFn } from "@tanstack/react-start";

type AskInput = {
  question: string;
  screen: string;
  interrupted?: boolean;
};

const SYSTEM_PROMPT = `You are VoiceGuide, a voice assistant for blind and low-vision users browsing the web.
Rules:
- Answer only from the screen content given to you. If it is not there, say so plainly.
- Write for the ear: short sentences, no markdown, no lists with symbols, no emojis.
- Keep answers under 45 words unless the user asks you to read something long.
- Speak digits, OTPs, PIN codes and PNRs one digit at a time, separated by spaces (e.g. "4 5 6 7 8 9").
- If the user interrupted your previous answer, do not repeat what you already said. Answer only the new question.
- You may reply in the same language the user used (English, Hindi or Hinglish).`;

export const askVoiceGuide = createServerFn({ method: "POST" })
  .inputValidator((data: AskInput) => {
    if (!data || typeof data.question !== "string" || !data.question.trim()) {
      throw new Error("question is required");
    }
    return {
      question: data.question.slice(0, 500),
      screen: (data.screen ?? "").slice(0, 6000),
      interrupted: Boolean(data.interrupted),
    };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { ok: false as const, error: "AI is not configured" };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3.8-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Screen content:\n${data.screen}\n\n${
              data.interrupted ? "The user interrupted your previous answer.\n" : ""
            }User asked: ${data.question}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      if (res.status === 429) return { ok: false as const, error: "Too many requests right now. Please try again in a moment." };
      if (res.status === 402) return { ok: false as const, error: "AI credits are exhausted for this workspace." };
      return { ok: false as const, error: `AI error ${res.status}: ${detail.slice(0, 160)}` };
    }

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const answer = json.choices?.[0]?.message?.content?.trim();
    if (!answer) return { ok: false as const, error: "I could not understand that. Please say it again." };
    return { ok: true as const, answer };
  });
