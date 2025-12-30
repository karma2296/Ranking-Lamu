
import { GoogleGenAI, Type } from "@google/genai";

// Usamos el modelo Pro para la mejor capacidad de visión disponible
const MODEL_NAME = 'gemini-3-pro-preview';

export const analyzeDamageScreenshot = async (base64Image: string): Promise<{ playerName?: string; damageValue?: number }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

  const prompt = `Analiza detalladamente esta captura de pantalla de los resultados de una batalla en Skullgirls Mobile.
  
  PASOS DE ANÁLISIS:
  1. UBICACIÓN DEL NOMBRE: Mira en la esquina SUPERIOR IZQUIERDA. Busca una placa con diseño Art Déco. El nombre del jugador está ahí (ejemplo: "AshaZeba"). No incluyas el nivel (NV. XX).
  2. UBICACIÓN DEL DAÑO: Busca en la parte CENTRAL o ligeramente hacia la izquierda. Verás un texto que dice "TOTAL PERSONAL DAMAGE" o simplemente un número muy grande con puntos (ejemplo: "349.632.248").
  
  REGLAS DE SALIDA:
  - playerName: Solo el texto del nombre.
  - damageValue: Extrae el número del daño eliminando TODOS los puntos y comas. Debe ser un número entero puro.
  
  Responde estrictamente en formato JSON.`;

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
        systemInstruction: "Eres un experto en lectura de interfaces de usuario de Skullgirls. Ignoras el ruido visual y extraes con precisión el daño personal y el nombre del jugador.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            playerName: { type: Type.STRING },
            damageValue: { type: Type.INTEGER }
          },
          required: ["playerName", "damageValue"]
        },
        temperature: 0, // Máxima precisión, sin creatividad
      }
    });

    const text = response.text;
    if (!text) throw new Error("La IA no devolvió texto.");
    
    const parsed = JSON.parse(text);
    console.log("IA detectó:", parsed);
    return parsed;
  } catch (error: any) {
    console.error("Error en análisis de imagen:", error);
    throw error;
  }
};
