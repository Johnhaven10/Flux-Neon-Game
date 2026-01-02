import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Theme } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateTheme = async (userPrompt: string): Promise<Theme | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Theme: ${userPrompt}`,
      config: {
        systemInstruction: `You are a design system for a neon game. Return a JSON object with 3 hex color codes based on the user's theme. 
        - color1 and color2 should be high contrast and neon/bright.
        - bg should be very dark, almost black.
        Example for "Volcano": { "cyan": "#FF4500", "magenta": "#FFD700", "bg": "#1a0500" }`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cyan: { type: Type.STRING },
            magenta: { type: Type.STRING },
            bg: { type: Type.STRING }
          },
          required: ["cyan", "magenta", "bg"]
        }
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text) as Theme;
    }
    return null;
  } catch (error) {
    console.error("Theme generation failed:", error);
    return null;
  }
};

export const generateCommentary = async (score: number, maxCombo: number): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `The player just finished a game of NEON FLUX. 
            Score: ${score}. Max Combo: ${maxCombo}.
            You are the Game Core. Speak in a robotic, slightly condescending or begrudgingly impressed tone.
            Keep it under 15 words.`,
    });
    return response.text || "SYSTEM ERROR. REBOOTING.";
  } catch (error) {
    console.error("Commentary generation failed:", error);
    return "CONNECTION LOST.";
  }
};

export const generateSpeech = async (text: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Fenrir' }, // Deep robotic voice
            },
        },
      },
    });
    
    // Extract base64 audio
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error) {
    console.error("TTS generation failed:", error);
    return null;
  }
};
