
import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini API client directly with the API key from environment variables as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getCombatAdvice = async (
  playerHp: number, 
  enemyHp: number, 
  deathCount: number,
  lastDeathReason: string
): Promise<string> => {
  try {
    // Using 'gemini-3-flash-preview' for basic text tasks as recommended.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
      You are a wise, cryptic, ancient Shinobi master giving advice to a student who just failed in battle (Sekiro style).
      
      Context:
      - Player HP remaining: ${playerHp}% (if 0, they died)
      - Enemy HP remaining: ${enemyHp}%
      - Total Deaths: ${deathCount}
      - Last Death Reason: ${lastDeathReason}

      Provide a single, short, atmospheric sentence of advice or philosophical observation about hesitation, rhythm, or defense. 
      Keep it under 20 words. Do not be overly cheerful. Be gritty.
    `,
    });

    // Access the .text property directly as it is a getter in the new SDK.
    return response.text?.trim() || "Hesitation is defeat.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Focus your mind. Try again.";
  }
};

export const getBossTaunt = async (bossName: string): Promise<string> => {
  try {
    // Using 'gemini-3-flash-preview' for generating text content.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
      Generate a short, intimidating battle cry (under 10 words) for a samurai boss named "${bossName}". 
      It should sound feudal, arrogant, and powerful.
    `,
    });

    return response.text?.trim() || "Face me!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Draw your blade!";
  }
};
