
import { GoogleGenAI, Type } from "@google/genai";

const MODEL_NAME = 'gemini-3-flash-preview';

export const analyzeDamageScreenshot = async (base64Image: string): Promise<{ playerName?: string; damageValue?: number }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const mimeMatch = base64Image.match(/^data:(image\/[a-z]+);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
  const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

  // Prompt ultra-específico para el formato de Skullgirls Mobile
  const prompt = `Analiza esta captura de resultados de Skullgirls Mobile.
  1. NOMBRE DEL JUGADOR: Búscalo en la esquina superior izquierda de la pantalla (cerca del nivel del jugador).
  2. DAÑO A EXTRAER: Busca la sección central que dice 'TOTAL PERSONAL DAMAGE'. Extrae solo ese número.
  3. REGLAS DE EXCLUSIÓN: 
     - IGNORA el número de la izquierda ('DAMAGE DEALT').
     - IGNORA el tiempo ('TIME') de la derecha.
     - IGNORA el 'TOTAL DAMAGE' que aparece abajo en pequeño.
  Devuelve un JSON estrictamente con 'playerName' (string) y 'damageValue' (number, sin puntos ni comas).`;

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
            playerName: { type: Type.STRING, description: "Nombre en la esquina superior izquierda" },
            damageValue: { type: Type.NUMBER, description: "Valor numérico de TOTAL PERSONAL DAMAGE" }
          },
          required: ["playerName", "damageValue"]
        }
      }
    });

    const jsonStr = response.text?.trim();
    if (!jsonStr) return {};
    return JSON.parse(jsonStr);
  } catch (error: any) {
    console.error("Error en Gemini API:", error);
    throw error;
  }
};
