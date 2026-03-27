const DEFAULT_SMALLESTAI_BASE_URL = "https://api.smallest.ai";

export const SMALLESTAI_VOICES = [
  "quinn",
  "magnus",
  "mia",
  "olivia",
  "daniel",
  "rachel",
  "advika",
  "vivaan",
  "robert",
  "camilla",
] as const;

export const SMALLESTAI_MODELS = ["lightning-v3.1"] as const;

export function isValidSmallestaiVoice(voice: string): boolean {
  return SMALLESTAI_VOICES.includes(voice.toLowerCase() as (typeof SMALLESTAI_VOICES)[number]);
}

export function normalizeSmallestaiBaseUrl(baseUrl?: string): string {
  const trimmed = baseUrl?.trim();
  if (!trimmed) {
    return DEFAULT_SMALLESTAI_BASE_URL;
  }
  return trimmed.replace(/\/+$/, "");
}

export async function smallestaiTTS(params: {
  text: string;
  apiKey: string;
  baseUrl: string;
  voiceId: string;
  model: string;
  sampleRate: number;
  speed: number;
  language: string;
  outputFormat?: string;
  timeoutMs: number;
}): Promise<Buffer> {
  const {
    text,
    apiKey,
    baseUrl,
    voiceId,
    model,
    sampleRate,
    speed,
    language,
    outputFormat = "mp3",
    timeoutMs,
  } = params;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const normalizedBaseUrl = baseUrl.trim().replace(/\/+$/, "") || DEFAULT_SMALLESTAI_BASE_URL;
    const url = `${normalizedBaseUrl}/waves/v1/${model}/get_speech`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        voice_id: voiceId,
        sample_rate: sampleRate,
        speed,
        language,
        output_format: outputFormat,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Smallest AI TTS API error (${response.status})`);
    }

    return Buffer.from(await response.arrayBuffer());
  } finally {
    clearTimeout(timeout);
  }
}
