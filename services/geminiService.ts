
import { GoogleGenAI, Type } from "@google/genai";

// Usamos el modelo Pro para máxima visión en fuentes complejas
const MODEL_NAME = 'gemini-3-pro-preview';

export const analyzeDamageScreenshot = async (base64Image: string): Promise<{ playerName?: string; damageValue?: number }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

  // Prompt con instrucciones espaciales precisas para la UI de Skullgirls
  const prompt = `Analiza detalladamente esta captura de pantalla del videojuego Skullgirls Mobile.
  
  INSTRUCCIONES DE LOCALIZACIÓN:
  1. BUSCA EL NOMBRE: Mira el cuadrante SUPERIOR IZQUIERDO. Hay una placa dorada con bordes angulares. Dentro está el nombre del jugador (ej: "AshaZeba"). Ignora el nivel que dice "NV XX".
  2. BUSCA EL DAÑO: Mira exactamente en el CENTRO de la imagen. Busca el texto "TOTAL PERSONAL DAMAGE" en letras blancas delgadas. Inmediatamente debajo, verás un número muy GRANDE y DESTACADO (ej: "349.632.248"). Ese es el daño que necesito.
  
  REGLAS DE EXTRACCIÓN:
  - Para el nombre: Extrae el texto tal cual aparece, respetando mayúsculas.
  - Para el daño: Devuelve solo los números, elimina los puntos (ej: "349632248").
  
  Responde únicamente en formato JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: base64Data } },
          { text: prompt }
        ]
      },
      config: {
        systemInstruction: "Eres un sistema de visión artificial experto en interfaces de juegos de lucha. Tu precisión para leer números en fuentes estilizadas es del 100%.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            playerName: { type: Type.STRING },
            damageValue: { type: Type.INTEGER }
          },
          required: ["playerName", "damageValue"]
        },
        temperature: 0.1, // Baja temperatura para mayor consistencia
      }
    });

    const text = response.text;
    if (!text) throw new Error("IA no respondió");
    
    const result = JSON.parse(text);
    // Validación extra: si el daño es 0 o ridículamente bajo, algo falló
    if (result.damageValue < 1000) {
        console.warn("Posible error de lectura, daño muy bajo detectado");
    }
    
    return result;
  } catch (error: any) {
    console.error("Error en Gemini OCR:", error);
    throw error;
  }
};
