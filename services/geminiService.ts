
import { GoogleGenAI, Type } from "@google/genai";

const MODEL_NAME = 'gemini-3-flash-preview';

export const analyzeDamageScreenshot = async (base64Image: string): Promise<{ playerName?: string; damageValue?: number }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const mimeMatch = base64Image.match(/^data:(image\/[a-z]+);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
  const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

  // Prompt ultra-específico para la interfaz de Skullgirls Mobile
  const prompt = `Analiza esta captura de pantalla de resultados del juego Skullgirls Mobile.
  
  TU OBJETIVO:
  1. Extraer el NOMBRE DEL JUGADOR: Se encuentra en la parte superior izquierda, generalmente junto a un icono de nivel o avatar. Es el nombre del usuario que está jugando.
  2. Extraer el DAÑO TOTAL: Busca el campo numérico asociado a "TOTAL PERSONAL DAMAGE", "DAÑO TOTAL PERSONAL" o "TOTAL DAMAGE". Es un número grande (millones habitualmente).
  
  REGLAS:
  - Ignora el nivel numérico (ej: si dice "Lvl 70 Username", extrae solo "Username").
  - Para el daño, extrae solo los dígitos (ignora puntos o comas de miles).
  - Si no encuentras el nombre arriba a la izquierda, búscalo en el resumen de la batalla.
  - Responde ÚNICAMENTE con el JSON solicitado.`;

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
        systemInstruction: "Eres un asistente experto en OCR para videojuegos. Tu especialidad es leer interfaces de Skullgirls Mobile. Eres preciso, rápido y solo devuelves JSON puro sin texto adicional.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            playerName: { 
              type: Type.STRING,
              description: "El nombre de usuario detectado en la captura."
            },
            damageValue: { 
              type: Type.NUMBER, 
              description: "El valor numérico del daño total personal sin símbolos."
            }
          },
          required: ["playerName", "damageValue"]
        },
        temperature: 0.1, // Baja temperatura para mayor precisión en OCR
      }
    });

    const jsonStr = response.text?.trim();
    if (!jsonStr) return {};
    
    const result = JSON.parse(jsonStr);
    // Limpieza adicional por si acaso
    if (result.damageValue) result.damageValue = Math.floor(Number(result.damageValue));
    
    return result;
  } catch (error: any) {
    console.error("Error en Gemini API:", error);
    throw error;
  }
};
