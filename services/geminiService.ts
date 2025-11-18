import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY || '';

// Safe initialization
let ai: GoogleGenAI | null = null;
if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
}

export const getCombatAdvice = async (
  playerHp: number, 
  enemyHp: number, 
  deathCount: number,
  lastDeathReason: string
): Promise<string> => {
  if (!ai) return "The spirits are silent. (Missing API Key)";

  try {
    const model = "gemini-2.5-flash";
    const prompt = `
      You are a wise, cryptic, ancient Shinobi master giving advice to a student who just failed in battle (Sekiro style).
      
      Context:
      - Player HP remaining: ${playerHp}% (if 0, they died)
      - Enemy HP remaining: ${enemyHp}%
      - Total Deaths: ${deathCount}
      - Last Death Reason: ${lastDeathReason}

      Provide a single, short, atmospheric sentence of advice or philosophical observation about hesitation, rhythm, or defense. 
      Keep it under 20 words. Do not be overly cheerful. Be gritty.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text?.trim() || "Hesitation is defeat.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Focus your mind. Try again.";
  }
};

export const getBossTaunt = async (bossName: string): Promise<string> => {
  if (!ai) return "Come, Sekiro!";

  try {
    const model = "gemini-2.5-flash";
    const prompt = `
      Generate a short, intimidating battle cry (under 10 words) for a samurai boss named "${bossName}". 
      It should sound feudal, arrogant, and powerful.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text?.trim() || "Face me!";
  } catch (error) {
    return "Draw your blade!";
  }
};