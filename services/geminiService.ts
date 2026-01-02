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
  // 1. Get primary data from Jikan API
  const jikanRes = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(animeTitle)}&limit=1`);
  if (!jikanRes.ok) {
    throw new Error("Could not connect to anime database (Jikan API).");
  }
  const jikanJson = await jikanRes.json();
  const anime = jikanJson.data?.[0];

  if (!anime) {
    throw new Error(`Anime "${animeTitle}" not found in the database.`);
  }

  // Extract base details from Jikan for accuracy
  const jikanData: Partial<SlideData> = {
    title: anime.title,
    alternativeTitle: anime.title_japanese || (anime.titles?.find(t => t.type === 'Synonym')?.title || ''),
    synopsis: anime.synopsis || "No synopsis available.",
    type: anime.type || 'TV',
    quality: 'HD', // Default quality
    duration: anime.duration?.replace(' per ep', '') || '24m',
    aired: anime.year ? String(anime.year) : (anime.aired?.string || ''),
    rank: anime.rank || 1,
    episodes: {
      sub: anime.episodes || 0,
      dub: 0, // Jikan doesn't track dub count well, default to 0
      eps: anime.episodes || 0
    }
  };

  // 2. Use Gemini for creative/formatting tasks (summarization, slug)
  try {
    const prompt = `
      Based on the anime title "${jikanData.title}", perform the following tasks and return ONLY the JSON object:
      1. Create a URL-friendly 'id' (slug) from the title. For example, "Jujutsu Kaisen" becomes "jujutsu-kaisen".
      2. Create a 'keywords' array containing only the generated 'id' as a string.
      3. Summarize the following synopsis into an engaging, short paragraph (2-3 sentences max).
      Synopsis to process: "${jikanData.synopsis}"
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, description: "URL-friendly slug." },
            keywords: { 
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array containing just the slug."
            },
            synopsis: { type: Type.STRING, description: "Short, engaging summary." },
          }
        }
      }
    });

    if (response.text) {
      const geminiData = JSON.parse(response.text);
      // Merge accurate Jikan data with Gemini's creative enhancements
      return {
        ...jikanData,
        id: geminiData.id,
        keywords: geminiData.keywords,
        synopsis: geminiData.synopsis,
      };
    }
    throw new Error("Gemini did not return valid data.");

  } catch (error) {
    console.error("Gemini enhancement failed, using Jikan data with basic slug:", error);
    // Fallback if Gemini fails: still return the solid Jikan data with a basic slug.
    const fallbackId = jikanData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
     return {
        ...jikanData,
        id: fallbackId,
        keywords: [fallbackId]
    };
  }
};