import { GoogleGenAI } from '@google/genai';
async function test() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3.6-flash',
      contents: [{ role: 'user', parts: [{ text: 'Hello' }] }]
    });
    for await (const chunk of responseStream) {
      console.log(chunk.text);
    }
  } catch (e) {
    console.error('ERROR:', e);
  }
}
test();
