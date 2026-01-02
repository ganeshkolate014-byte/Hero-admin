import { GoogleGenAI, Type } from "@google/genai";
import { SlideData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const testGeminiConnection = async (): Promise<boolean> => {
  try {
    await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "ping",
    });
    return true;
  } catch (error) {
    console.error("Gemini Connection Test Failed:", error);
    return false;
  }
};

export const generateAnimeDetails = async (animeTitle: string): Promise<Partial<SlideData>> => {
  try {
    const prompt = `
      I need details for the anime "${animeTitle}" to populate a JSON object for a streaming site.
      Please analyze the title and return a JSON object.
      
      Requirements:
      - 'synopsis': A short, engaging summary (max 3 sentences).
      - 'alternativeTitle': The Japanese or other common title.
      - 'id': A URL-friendly slug based on the title (e.g., 'blue-lock').
      - 'keywords': An array of 1 keyword which is the slug (e.g., ['blue-lock']).
      - 'type': TV, MOVIE, OVA, or ONA.
      - 'duration': Average duration (e.g., "24m").
      - 'aired': Release year or season (e.g., "2023").
      - 'episodes': Estimate current counts for sub, dub, and total eps.
      - 'rank': Estimate the actual global popularity rank (integer) based on MyAnimeList or similar databases (e.g. 1 for most popular, 100+ for niche).
      
      Strictly return JSON.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            synopsis: { type: Type.STRING },
            alternativeTitle: { type: Type.STRING },
            id: { type: Type.STRING },
            type: { type: Type.STRING },
            duration: { type: Type.STRING },
            aired: { type: Type.STRING },
            rank: { type: Type.INTEGER },
            keywords: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            episodes: {
              type: Type.OBJECT,
              properties: {
                sub: { type: Type.INTEGER },
                dub: { type: Type.INTEGER },
                eps: { type: Type.INTEGER },
              }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as Partial<SlideData>;
    }
    throw new Error("No data returned from Gemini");

  } catch (error) {
    console.error("Gemini Auto-fill Error:", error);
    throw error;
  }
};