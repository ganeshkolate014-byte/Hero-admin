// src/utils/loadRawJsonFromEndpoint.js

export async function loadRawJsonFromEndpoint(url) {
  /**
   * WHAT THIS DOES:
   * - API endpoint ko call karta hai
   * - response ko .text() me read karta hai
   * - isse EXACT raw JSON milta hai (string)
   * - koi auto parsing / transform nahi
   */

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    },
    cache: 'no-store'
  });

  if (!res.ok) {
    throw new Error(`API failed: ${res.status}`);
  }

  const rawText = await res.text(); // <-- REAL RAW JSON STRING

  let parsed = null;
  try {
    parsed = JSON.parse(rawText);
  } catch (e) {
    console.warn('Response is not valid JSON');
  }

  return {
    raw: rawText,   // pure raw response
    json: parsed    // parsed object (if valid)
  };
}
