import { normalizeResolvedSecretInputString } from "openclaw/plugin-sdk/secret-input";
import type {
  SpeechDirectiveTokenParseContext,
  SpeechProviderConfig,
  SpeechProviderPlugin,
} from "openclaw/plugin-sdk/speech-core";
import {
  isValidSmallestaiVoice,
  normalizeSmallestaiBaseUrl,
  SMALLESTAI_MODELS,
  SMALLESTAI_VOICES,
  smallestaiTTS,
} from "./tts.js";

type SmallestaiProviderConfig = {
  apiKey?: string;
  baseUrl: string;
  voiceId: string;
  model: string;
  sampleRate: number;
  speed: number;
  language: string;
};

function trimToUndefined(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function asObject(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function normalizeSmallestaiProviderConfig(
  rawConfig: Record<string, unknown>,
): SmallestaiProviderConfig {
  const providers = asObject(rawConfig.providers);
  const raw = asObject(providers?.smallestai) ?? asObject(rawConfig.smallestai);
  return {
    apiKey: normalizeResolvedSecretInputString({
      value: raw?.apiKey,
      path: "messages.tts.providers.smallestai.apiKey",
    }),
    baseUrl: normalizeSmallestaiBaseUrl(trimToUndefined(raw?.baseUrl)),
    voiceId: trimToUndefined(raw?.voiceId) ?? "quinn",
    model: trimToUndefined(raw?.model) ?? "lightning-v3.1",
    sampleRate: asNumber(raw?.sampleRate) ?? 24_000,
    speed: asNumber(raw?.speed) ?? 1.0,
    language: trimToUndefined(raw?.language) ?? "en",
  };
}

function readSmallestaiProviderConfig(config: SpeechProviderConfig): SmallestaiProviderConfig {
  const defaults = normalizeSmallestaiProviderConfig({});
  return {
    apiKey: trimToUndefined(config.apiKey) ?? defaults.apiKey,
    baseUrl: normalizeSmallestaiBaseUrl(trimToUndefined(config.baseUrl) ?? defaults.baseUrl),
    voiceId: trimToUndefined(config.voiceId) ?? defaults.voiceId,
    model: trimToUndefined(config.model) ?? defaults.model,
    sampleRate: asNumber(config.sampleRate) ?? defaults.sampleRate,
    speed: asNumber(config.speed) ?? defaults.speed,
    language: trimToUndefined(config.language) ?? defaults.language,
  };
}

function parseDirectiveToken(ctx: SpeechDirectiveTokenParseContext): {
  handled: boolean;
  overrides?: Record<string, unknown>;
  warnings?: string[];
} {
  switch (ctx.key) {
    case "smallestai_voice":
    case "smallestaivoice":
      if (!ctx.policy.allowVoice) {
        return { handled: true };
      }
      if (!isValidSmallestaiVoice(ctx.value)) {
        return {
          handled: true,
          warnings: [`invalid Smallest AI voice "${ctx.value}"`],
        };
      }
      return {
        handled: true,
        overrides: { ...(ctx.currentOverrides ?? {}), voiceId: ctx.value.toLowerCase() },
      };
    default:
      return { handled: false };
  }
}

export function buildSmallestaiSpeechProvider(): SpeechProviderPlugin {
  return {
    id: "smallestai",
    label: "Smallest AI",
    autoSelectOrder: 30,
    models: SMALLESTAI_MODELS,
    voices: SMALLESTAI_VOICES,
    resolveConfig: ({ rawConfig }) => normalizeSmallestaiProviderConfig(rawConfig),
    parseDirectiveToken,
    listVoices: async () => SMALLESTAI_VOICES.map((voice) => ({ id: voice, name: voice })),
    isConfigured: ({ providerConfig }) =>
      Boolean(readSmallestaiProviderConfig(providerConfig).apiKey || process.env.SMALLEST_API_KEY),
    synthesize: async (req) => {
      const config = readSmallestaiProviderConfig(req.providerConfig);
      const overrides = req.providerOverrides ?? {};
      const apiKey = config.apiKey || process.env.SMALLEST_API_KEY;
      if (!apiKey) {
        throw new Error("Smallest AI API key missing");
      }
      const audioBuffer = await smallestaiTTS({
        text: req.text,
        apiKey,
        baseUrl: config.baseUrl,
        voiceId: trimToUndefined(overrides.voiceId) ?? config.voiceId,
        model: config.model,
        sampleRate: config.sampleRate,
        speed: asNumber(overrides.speed) ?? config.speed,
        language: trimToUndefined(overrides.language) ?? config.language,
        outputFormat: "mp3",
        timeoutMs: req.timeoutMs,
      });
      return {
        audioBuffer,
        outputFormat: "mp3",
        fileExtension: ".mp3",
        voiceCompatible: false,
      };
    },
    synthesizeTelephony: async (req) => {
      const config = readSmallestaiProviderConfig(req.providerConfig);
      const apiKey = config.apiKey || process.env.SMALLEST_API_KEY;
      if (!apiKey) {
        throw new Error("Smallest AI API key missing");
      }
      const outputFormat = "pcm";
      const sampleRate = 24_000;
      const audioBuffer = await smallestaiTTS({
        text: req.text,
        apiKey,
        baseUrl: config.baseUrl,
        voiceId: config.voiceId,
        model: config.model,
        sampleRate,
        speed: config.speed,
        language: config.language,
        outputFormat,
        timeoutMs: req.timeoutMs,
      });
      return { audioBuffer, outputFormat, sampleRate };
    },
  };
}
