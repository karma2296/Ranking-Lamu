
import { GoogleGenAI, Type } from "@google/genai";

const MODEL_NAME = 'gemini-3-flash-preview';

export const analyzeDamageScreenshot = async (base64Image: string): Promise<{ playerName?: string; damageValue?: number }> => {
  // Intentar obtener la API KEY de varias fuentes posibles en navegadores
  const apiKey = process.env.API_KEY || (window as any).process?.env?.API_KEY;
  
  if (!apiKey) {
    console.error("DEBUG: API_KEY no encontrada en process.env");
    throw new Error("API_KEY_MISSING");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const mimeMatch = base64Image.match(/^data:(image\/[a-z]+);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
  const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

  const prompt = `Analiza esta captura de pantalla de un videojuego. 
  Busca el nombre del jugador (nickname) y el daño total infligido. 
  Devuelve un JSON con 'playerName' (string) y 'damageValue' (number).`;

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

    if (!response.text) throw new Error("Respuesta vacía de la IA.");
    return JSON.parse(response.text);
  } catch (error: any) {
    console.error("Error en Gemini:", error);
    throw error;
  }
};
