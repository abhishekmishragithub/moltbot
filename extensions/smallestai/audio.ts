import type {
  AudioTranscriptionRequest,
  AudioTranscriptionResult,
} from "openclaw/plugin-sdk/media-understanding";
import {
  assertOkOrThrowHttpError,
  normalizeBaseUrl,
  postTranscriptionRequest,
  requireTranscriptionText,
} from "openclaw/plugin-sdk/media-understanding";

export const DEFAULT_SMALLESTAI_STT_BASE_URL = "https://api.smallest.ai";
export const DEFAULT_SMALLESTAI_STT_MODEL = "pulse";

function resolveModel(model?: string): string {
  const trimmed = model?.trim();
  return trimmed || DEFAULT_SMALLESTAI_STT_MODEL;
}

type SmallestaiTranscriptResponse = {
  status?: string;
  transcription?: string;
  words?: Array<{
    word?: string;
    start?: number;
    end?: number;
    speaker?: string;
    confidence?: number;
  }>;
  utterances?: Array<{
    text?: string;
    start?: number;
    end?: number;
    speaker?: string;
  }>;
  metadata?: {
    duration?: number;
    fileSize?: number;
  };
};

export async function transcribeSmallestaiAudio(
  params: AudioTranscriptionRequest,
): Promise<AudioTranscriptionResult> {
  const fetchFn = params.fetchFn ?? fetch;
  const baseUrl = normalizeBaseUrl(params.baseUrl, DEFAULT_SMALLESTAI_STT_BASE_URL);
  const allowPrivate = Boolean(params.baseUrl?.trim());
  const model = resolveModel(params.model);

  const url = new URL(`${baseUrl}/waves/v1/${model}/get_text`);
  if (params.language?.trim()) {
    url.searchParams.set("language", params.language.trim());
  }
  if (params.query) {
    for (const [key, value] of Object.entries(params.query)) {
      if (value === undefined) {
        continue;
      }
      url.searchParams.set(key, String(value));
    }
  }

  const headers = new Headers(params.headers);
  if (!headers.has("authorization")) {
    headers.set("authorization", `Bearer ${params.apiKey}`);
  }
  if (!headers.has("content-type")) {
    headers.set("content-type", params.mime ?? "application/octet-stream");
  }

  const body = new Uint8Array(params.buffer);
  const { response: res, release } = await postTranscriptionRequest({
    url: url.toString(),
    headers,
    body,
    timeoutMs: params.timeoutMs,
    fetchFn,
    allowPrivateNetwork: allowPrivate,
  });

  try {
    await assertOkOrThrowHttpError(res, "Audio transcription failed");

    const payload = (await res.json()) as SmallestaiTranscriptResponse;
    const transcript = requireTranscriptionText(
      payload.transcription,
      "Smallest AI Pulse transcription response missing transcript",
    );
    return { text: transcript, model };
  } finally {
    await release();
  }
}
