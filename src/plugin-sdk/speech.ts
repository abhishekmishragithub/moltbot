// Public speech helpers for bundled or third-party plugins.

export { parseTtsDirectives } from "../tts/directives.js";
export type {
  SpeechModelOverridePolicy,
  SpeechVoiceOption,
  TtsDirectiveOverrides,
  TtsDirectiveParseResult,
} from "../tts/provider-types.js";

export { buildSmallestaiSpeechProvider } from "../../extensions/smallestai/speech-provider.js";
export {
  smallestaiTTS,
  SMALLESTAI_VOICES,
  SMALLESTAI_MODELS,
} from "../../extensions/smallestai/tts.js";
