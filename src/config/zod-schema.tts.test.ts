import { describe, expect, it } from "vitest";
import { TtsConfigSchema } from "./zod-schema.core.js";

describe("TtsConfigSchema openai speed and instructions", () => {
  it("accepts speed and instructions in openai section", () => {
    expect(() =>
      TtsConfigSchema.parse({
        openai: {
          voice: "alloy",
          speed: 1.5,
          instructions: "Speak in a cheerful tone",
        },
      }),
    ).not.toThrow();
  });

  it("rejects out-of-range openai speed", () => {
    expect(() =>
      TtsConfigSchema.parse({
        openai: {
          speed: 5.0,
        },
      }),
    ).toThrow();
  });

  it("rejects openai speed below minimum", () => {
    expect(() =>
      TtsConfigSchema.parse({
        openai: {
          speed: 0.1,
        },
      }),
    ).toThrow();
  });
});

describe("TtsConfigSchema smallestai", () => {
  it("accepts smallestai configuration", () => {
    expect(() =>
      TtsConfigSchema.parse({
        provider: "smallestai",
        smallestai: {
          voiceId: "quinn",
          speed: 1.0,
          sampleRate: 24000,
          language: "en",
        },
      }),
    ).not.toThrow();
  });

  it("accepts smallestai with all fields", () => {
    expect(() =>
      TtsConfigSchema.parse({
        smallestai: {
          apiKey: "test-key",
          baseUrl: "https://custom.api.com",
          voiceId: "robert",
          model: "lightning-v3.1",
          sampleRate: 44100,
          speed: 1.5,
          language: "hi",
        },
      }),
    ).not.toThrow();
  });

  it("rejects out-of-range smallestai speed", () => {
    expect(() =>
      TtsConfigSchema.parse({
        smallestai: { speed: 5.0 },
      }),
    ).toThrow();
  });

  it("rejects smallestai speed below minimum", () => {
    expect(() =>
      TtsConfigSchema.parse({
        smallestai: { speed: 0.1 },
      }),
    ).toThrow();
  });

  it("rejects out-of-range smallestai sampleRate", () => {
    expect(() =>
      TtsConfigSchema.parse({
        smallestai: { sampleRate: 100 },
      }),
    ).toThrow();
  });

  it("rejects sampleRate above maximum", () => {
    expect(() =>
      TtsConfigSchema.parse({
        smallestai: { sampleRate: 100000 },
      }),
    ).toThrow();
  });
});
