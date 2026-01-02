// src/utils/getHeroSlide.js
import { loadRawJsonFromEndpoint } from './loadRawJsonFromEndpoint';

export async function getHeroSlide(slug) {
  /**
   * slug example:
   * 'blue-lock'
   */

  const url = `https://hero-admin-omega.vercel.app/heroslide/${slug}`;

  const { raw, json } = await loadRawJsonFromEndpoint(url);

  console.log('RAW RESPONSE:', raw);
  console.log('PARSED RESPONSE:', json);

  return { raw, json };
}
