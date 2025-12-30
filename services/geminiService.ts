
import { GoogleGenAI, Type } from "@google/genai";

// Usamos el modelo Pro para máxima precisión en la lectura de fuentes estilizadas
const MODEL_NAME = 'gemini-3-pro-preview';

export const analyzeDamageScreenshot = async (base64Image: string): Promise<{ playerName?: string; damageValue?: number }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const mimeMatch = base64Image.match(/^data:(image\/[a-z]+);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
  const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

  // Prompt simplificado y directo enfocado en la posición de los elementos
  const prompt = `Analiza esta captura de pantalla de Skullgirls Mobile.
  
  EXTRACCIÓN REQUERIDA:
  1. NOMBRE DEL JUGADOR: Ubicado en la esquina SUPERIOR IZQUIERDA (ej: "AshaZeba", "QUE HACKER"). Ignora el nivel "NV XX".
  2. DAÑO TOTAL PERSONAL: Ubicado en el CENTRO de la pantalla, justo a la IZQUIERDA del contador de "TIME" y debajo de la etiqueta "TOTAL PERSONAL DAMAGE". Es un número largo con puntos (ej: 349.632.248).
  
  REGLAS:
  - Extrae el daño como un número entero puro (sin puntos ni comas).
  - Si el nombre tiene símbolos, inclúyelos.
  - Responde ÚNICAMENTE en formato JSON.`;

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
        systemInstruction: "Eres un sistema OCR de alta precisión para Skullgirls Mobile. Te enfocas en la esquina superior izquierda para el nombre y el centro para el daño personal total.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            playerName: { 
              type: Type.STRING,
              description: "Nombre exacto del jugador en la esquina superior izquierda."
            },
            damageValue: { 
              type: Type.INTEGER, 
              description: "Valor numérico del Total Personal Damage en el centro."
            }
          },
          required: ["playerName", "damageValue"]
        },
        temperature: 0, // Cero para evitar alucinaciones
      }
    });

    const text = response.text;
    if (!text) throw new Error("La IA no devolvió texto.");
    
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Error en el análisis de Gemini:", error);
    throw error;
  }
};
