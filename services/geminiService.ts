
import { GoogleGenAI, Type } from "@google/genai";

// Usamos Pro para mayor capacidad de razonamiento visual en fuentes estilizadas
const MODEL_NAME = 'gemini-3-pro-preview';

export const analyzeDamageScreenshot = async (base64Image: string): Promise<{ playerName?: string; damageValue?: number }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const mimeMatch = base64Image.match(/^data:(image\/[a-z]+);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
  const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

  const prompt = `Analiza detalladamente esta captura de pantalla de "Skullgirls Mobile" (Pantalla de DAÑO).
  
  CONTEXTO VISUAL:
  - El encabezado superior dice "DAÑO" en letras grandes.
  - El NOMBRE DEL JUGADOR está en la esquina SUPERIOR IZQUIERDA, dentro de una placa dorada/amarilla, justo encima de la barra de nivel (ej: "NV 78").
  - El DAÑO está en el CENTRO, debajo de la etiqueta "TOTAL PERSONAL DAMAGE". Es un número largo con puntos (ej: 558.672.041).
  
  TAREAS:
  1. Identifica el texto en la placa dorada de arriba a la izquierda. Ese es el 'playerName'. Ignora el nivel (NV XX).
  2. Identifica el número grande blanco/dorado debajo de "TOTAL PERSONAL DAMAGE". Ese es el 'damageValue'.
  
  REGLAS DE SALIDA:
  - Devuelve el daño como un número entero, sin puntos ni comas.
  - Si el nombre tiene caracteres especiales como "*" o "_" inclúyelos.
  - Responde solo con JSON.`;

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
        systemInstruction: "Eres un experto en lectura de interfaces de usuario (UI) de Skullgirls Mobile. Tu precisión es del 100% leyendo nombres de jugadores y valores de daño en capturas de pantalla.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            playerName: { 
              type: Type.STRING,
              description: "El nombre exacto del jugador en la esquina superior izquierda."
            },
            damageValue: { 
              type: Type.INTEGER, 
              description: "El valor numérico del Total Personal Damage."
            }
          }
        },
        temperature: 0, // Máxima precisión, mínima creatividad
      }
    });

    const jsonStr = response.text?.trim();
    if (!jsonStr) return {};
    
    return JSON.parse(jsonStr);
  } catch (error: any) {
    console.error("Error en Gemini Pro:", error);
    throw error;
  }
};
