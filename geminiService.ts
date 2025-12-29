
import { GoogleGenAI, Type } from "@google/genai";

const MODEL_NAME = 'gemini-3-flash-preview';

export const analyzeDamageScreenshot = async (base64Image: string): Promise<{ playerName?: string; damageValue?: number }> => {
  // Intentar obtener la API KEY de forma segura
  let apiKey = '';
  try {
    apiKey = process.env.API_KEY || '';
  } catch (e) {
    apiKey = '';
  }
  
  if (!apiKey || apiKey.length < 5) {
    console.error("Servicio Gemini: API_KEY no configurada o inválida.");
    throw new Error("API_KEY_MISSING");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const mimeMatch = base64Image.match(/^data:(image\/[a-z]+);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
  const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

  const prompt = `Analiza esta captura de pantalla de un videojuego. 
  Busca el nombre del jugador (nickname) y el daño total infligido. 
  Devuelve un JSON con 'playerName' y 'damageValue'.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Data } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            playerName: { type: Type.STRING },
            damageValue: { type: Type.NUMBER }
          }
        }
      }
    });

    if (!response.text) return {};
    return JSON.parse(response.text);
  } catch (error: any) {
    console.error("Error en Gemini API:", error);
    throw error;
  }
};
