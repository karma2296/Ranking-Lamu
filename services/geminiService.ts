
import { GoogleGenAI, Type } from "@google/genai";

// Usamos Pro para máxima capacidad de visión en fuentes complejas
const MODEL_NAME = 'gemini-3-pro-preview';

export const analyzeDamageScreenshot = async (base64Image: string): Promise<{ playerName?: string; damageValue?: number }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const mimeMatch = base64Image.match(/^data:(image\/[a-z]+);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
  const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

  // Prompt optimizado para la pantalla de "DAÑO" de Skullgirls Mobile
  const prompt = `Analiza esta captura de pantalla de resultados de batalla del juego "Skullgirls Mobile".
  
  PASOS DE ANÁLISIS:
  1. Localiza la placa dorada en la esquina SUPERIOR IZQUIERDA. Dentro hay un nombre de usuario y un nivel (ej. NV 78). Extrae el NOMBRE DE USUARIO (ignora "NV" y el número).
  2. Localiza el texto "TOTAL PERSONAL DAMAGE" en el centro de la pantalla. Justo debajo hay un número grande con puntos decimales. Extrae ese NÚMERO completo.
  
  REGLAS CRÍTICAS:
  - El nombre del jugador suele estar en mayúsculas (ej: QUE HACKER).
  - El daño es un número entero largo (ej: 558672041). Elimina puntos o comas al devolverlo.
  - No confundas "TOTAL PERSONAL DAMAGE" con "TOTAL DAMAGE" (que aparece más abajo con un icono de calavera). Queremos el de ARRIBA, el PERSONAL.
  
  Responde estrictamente en formato JSON.`;

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
        systemInstruction: "Eres un sistema de OCR especializado en videojuegos. Tu única misión es extraer el 'playerName' y el 'damageValue' de capturas de Skullgirls Mobile. Eres extremadamente preciso con los números y nombres estilizados.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            playerName: { 
              type: Type.STRING,
              description: "El nombre del jugador detectado en la esquina superior izquierda."
            },
            damageValue: { 
              type: Type.INTEGER, 
              description: "El valor numérico del daño personal (sin puntos ni comas)."
            }
          },
          required: ["playerName", "damageValue"]
        },
        temperature: 0,
      }
    });

    const jsonStr = response.text?.trim();
    if (!jsonStr) throw new Error("Respuesta vacía de la IA");
    
    return JSON.parse(jsonStr);
  } catch (error: any) {
    console.error("Error detallado en Gemini Pro:", error);
    throw error;
  }
};
