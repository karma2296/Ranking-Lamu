
import { GoogleGenAI, Type } from "@google/genai";

const MODEL_NAME = 'gemini-3-flash-preview';

export const analyzeDamageScreenshot = async (base64Image: string): Promise<{ playerName?: string; damageValue?: number }> => {
  // Acceso seguro a la variable de entorno
  let apiKey = '';
  try {
    apiKey = process.env.API_KEY || '';
  } catch (e) {
    console.warn("No se pudo acceder a process.env directamente.");
  }
  
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const mimeMatch = base64Image.match(/^data:(image\/[a-z]+);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
  const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

  const prompt = `Analiza esta captura de pantalla de un videojuego. 
  Busca el nombre del jugador y el número de daño total. 
  Responde únicamente con el JSON solicitado.`;

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

    return JSON.parse(response.text || '{}');
  } catch (error: any) {
    console.error("Error en el servicio Gemini:", error);
    throw error;
  }
};
