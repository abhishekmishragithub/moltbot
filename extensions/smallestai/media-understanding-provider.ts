import type { MediaUnderstandingProvider } from "openclaw/plugin-sdk/media-understanding";
import { transcribeSmallestaiAudio } from "./audio.js";

export const smallestaiMediaUnderstandingProvider: MediaUnderstandingProvider = {
  id: "smallestai",
  capabilities: ["audio"],
  transcribeAudio: transcribeSmallestaiAudio,
};
