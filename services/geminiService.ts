
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateWorkComment(keywords: string, company: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Erstelle einen kurzen, sachlichen Kommentar für meinen Arbeitszeit-Tracker. 
      Unternehmen: ${company}
      Stichworte: ${keywords}
      Antworte nur mit dem fertigen Kommentar, sachlich und professionell. Maximal 100 Zeichen.`,
      config: {
        temperature: 0.7,
        topP: 0.9,
      }
    });
    return response.text.trim();
  } catch (error) {
    console.error("Gemini Error:", error);
    return keywords; // Fallback to raw keywords
  }
}
