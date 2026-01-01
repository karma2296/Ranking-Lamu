import { GoogleGenAI, Type } from "@google/genai";

const MODEL_NAME = 'gemini-3-pro-preview';

export const analyzeDamageScreenshot = async (base64Image: string): Promise<{ 
  playerName?: string; 
  totalDamage?: number; 
  ticketDamage?: number 
}> => {
  // Inicialización directa según estándares de seguridad
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

  const prompt = `Analiza los resultados de batalla de Skullgirls Mobile.
  Busca y extrae con extrema precisión:
  
  1. NOMBRE: Esquina superior izquierda (ignora el nivel NV. XX).
  2. TOTAL DAMAGE: Busca "TOTAL PERSONAL DAMAGE" o el número más grande acumulado.
  3. TICKET DAMAGE: Busca el daño específico de esta batalla.
  
  Devuelve un JSON con:
  - playerName (string)
  - totalDamage (integer)
  - ticketDamage (integer)
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
          { text: prompt }
        ]
      },
      config: {
        systemInstruction: "Eres un analista de OCR especializado en Skullgirls. Extraes nombres de jugadores y separas el daño acumulado del daño de la batalla actual.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            playerName: { type: Type.STRING },
            totalDamage: { type: Type.INTEGER },
            ticketDamage: { type: Type.INTEGER }
          },
          required: ["playerName", "totalDamage", "ticketDamage"]
        },
        temperature: 0,
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Error OCR:", error);
    throw error;
  }
};
