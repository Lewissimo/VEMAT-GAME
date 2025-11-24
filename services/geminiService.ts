import { GoogleGenAI } from "@google/genai";

// Initialize Gemini
// Note: In a real production app, you might want to proxy this request to hide the key,
// but for this client-side demo we use the env var directly as per instructions.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateBattleCommentary = async (winnerName: string, loserName: string): Promise<string> => {
  if (!process.env.API_KEY) {
    return "Bitwa zakończona";
  }

  try {
    const model = ai.models;
    const response = await model.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
       Wygrany ${winnerName} i przegrany: ${loserName}.
     
      `,
    });

    return response.text || "What a match!";
  } catch (error) {
    console.error("Gemini commentary failed:", error);
    return `Niesamowite zwycięstwo ${winnerName}!`;
  }
};
