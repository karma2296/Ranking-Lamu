
import { GoogleGenAI, Type } from "@google/genai";

const MODEL_NAME = 'gemini-3-flash-preview';

export const analyzeDamageScreenshot = async (base64Image: string): Promise<{ playerName?: string; damageValue?: number }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Analiza esta captura de pantalla de un videojuego. Extrae el nombre del jugador (username) y el daño total infligido al Jefe/Boss Semanal.
  Busca números asociados con "Total Damage", "Damage", "Daño Total" o "DPS". 
  Devuelve la información en formato JSON válido. Si no encuentras un dato, devuelve null para ese campo.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: base64Image.split(',')[1] || base64Image,
            },
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            playerName: { type: Type.STRING, description: "El nombre del jugador encontrado en la interfaz." },
            damageValue: { type: Type.NUMBER, description: "El número total de daño encontrado." }
          },
          required: ["damageValue"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return result;
  } catch (error) {
    console.error("Error analizando imagen con Gemini:", error);
    throw error;
  }
};
