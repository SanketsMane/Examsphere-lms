import OpenAI from "openai";

// Configure OpenAI client for custom Qwen API
export const ai = new OpenAI({
  baseURL: "http://139.84.155.227/v1",
  apiKey: "ollama", // Required by SDK but ignored by server
});

export const AI_MODEL = "qwen2.5:14b";
