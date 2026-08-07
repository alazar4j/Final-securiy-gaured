import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "dummy",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});
