import type { SpeechProviderPlugin } from "openclaw/plugin-sdk/core";
import {
  smallestaiTTS,
  SMALLESTAI_VOICES,
  type SpeechVoiceOption,
} from "openclaw/plugin-sdk/speech";

const SMALLESTAI_MODELS = ["lightning-v3.1"] as const;

export function buildSmallestaiSpeechProvider(): SpeechProviderPlugin {
  return {
    id: "smallestai",
    label: "Smallest AI",
    models: SMALLESTAI_MODELS,
    voices: SMALLESTAI_VOICES,
    listVoices: async () =>
      SMALLESTAI_VOICES.map((voice) => ({ id: voice, name: voice }) as SpeechVoiceOption),
    isConfigured: ({ config }) => Boolean(config.smallestai.apiKey || process.env.SMALLEST_API_KEY),
    synthesize: async (req) => {
      const apiKey = req.config.smallestai.apiKey || process.env.SMALLEST_API_KEY;
      if (!apiKey) {
        throw new Error("Smallest AI API key missing");
      }
      const audioBuffer = await smallestaiTTS({
        text: req.text,
        apiKey,
        baseUrl: req.config.smallestai.baseUrl,
        voiceId: req.overrides?.smallestai?.voiceId ?? req.config.smallestai.voiceId,
        model: req.config.smallestai.model,
        sampleRate: req.overrides?.smallestai?.sampleRate ?? req.config.smallestai.sampleRate,
        speed: req.overrides?.smallestai?.speed ?? req.config.smallestai.speed,
        language: req.overrides?.smallestai?.language ?? req.config.smallestai.language,
        outputFormat: "mp3",
        timeoutMs: req.config.timeoutMs,
      });
      return {
        audioBuffer,
        outputFormat: "mp3",
        fileExtension: ".mp3",
        voiceCompatible: false,
      };
    },
    synthesizeTelephony: async (req) => {
      const apiKey = req.config.smallestai.apiKey || process.env.SMALLEST_API_KEY;
      if (!apiKey) {
        throw new Error("Smallest AI API key missing");
      }
      const sampleRate = 24_000;
      const audioBuffer = await smallestaiTTS({
        text: req.text,
        apiKey,
        baseUrl: req.config.smallestai.baseUrl,
        voiceId: req.config.smallestai.voiceId,
        model: req.config.smallestai.model,
        sampleRate,
        speed: req.config.smallestai.speed,
        language: req.config.smallestai.language,
        outputFormat: "pcm",
        timeoutMs: req.config.timeoutMs,
      });
      return { audioBuffer, outputFormat: "pcm", sampleRate };
    },
  };
}
