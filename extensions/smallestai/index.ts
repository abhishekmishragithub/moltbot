import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { smallestaiMediaUnderstandingProvider } from "./media-understanding-provider.js";
import { buildSmallestaiSpeechProvider } from "./speech-provider.js";

export default definePluginEntry({
  id: "smallestai",
  name: "Smallest AI Provider",
  description: "Bundled Smallest AI speech and audio transcription provider",
  register(api) {
    api.registerSpeechProvider(buildSmallestaiSpeechProvider());
    api.registerMediaUnderstandingProvider(smallestaiMediaUnderstandingProvider);
  },
});
