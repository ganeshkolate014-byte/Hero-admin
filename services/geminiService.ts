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
  let jikanData: any = {};
  
  // 1. Try Jikan API for Metadata (Backup for ranking/episodes)
  try {
    const jikanRes = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(animeTitle)}&limit=1`);
    if (jikanRes.ok) {
      const data = await jikanRes.json();
      const anime = data.data?.[0];
      if (anime) {
        jikanData = {
           rank: anime.rank || 0,
           episodes: {
             eps: anime.episodes || 0,
             sub: anime.episodes || 0,
             dub: 0 
           },
           aired: anime.year ? String(anime.year) : (anime.aired?.string || ''),
           duration: anime.duration || ''
        };
      }
    }
  } catch (e) {
    console.warn("Jikan API failed:", e);
  }

  // 2. Use Gemini with Search to find Logo and specific details
  try {
    const prompt = `
      I need details for the anime "${animeTitle}".
      
      Task:
      1. Use Google Search to find a URL for a "transparent text logo png" or "clear logo" for "${animeTitle}".
         - Look for images that are primarily the title text with a transparent background.
         - Common sources might be fanart databases or wikis.
         - If found, put the direct image URL in the 'logo' field.
      2. Generate the following metadata JSON.

      Requirements:
      - 'synopsis': A short, engaging summary (max 3 sentences).
      - 'alternativeTitle': The Japanese or other common title.
      - 'id': A URL-friendly slug based on the title (e.g., 'blue-lock').
      - 'keywords': An array of 1 keyword which is the slug.
      - 'type': TV, MOVIE, OVA, or ONA.
      - 'duration': Average duration (e.g., "24m").
      - 'aired': Release year or season (e.g., "2023").
      - 'episodes': Estimate current counts for sub, dub, and total eps.
      - 'rank': Estimate global popularity rank (1-1000).
      
      Strictly return JSON.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
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
            logo: { type: Type.STRING },
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
      const geminiData = JSON.parse(response.text) as Partial<SlideData>;
      
      // Merge Jikan data (priority to Gemini for text, Jikan for numbers if available)
      return {
        ...geminiData,
        rank: jikanData.rank || geminiData.rank,
        aired: jikanData.aired || geminiData.aired,
        // Keep Gemini logo if found, otherwise empty
        logo: geminiData.logo || ''
      };
    }
    throw new Error("No data returned from Gemini");

  } catch (error) {
    console.error("Gemini Auto-fill Error:", error);
    throw error;
  }
};
