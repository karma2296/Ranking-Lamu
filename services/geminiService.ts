
import { GoogleGenAI, Type } from "@google/genai";

// Usamos el modelo Pro para máxima precisión en la lectura de fuentes estilizadas
const MODEL_NAME = 'gemini-3-pro-preview';

export const analyzeDamageScreenshot = async (base64Image: string): Promise<{ playerName?: string; damageValue?: number }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

  const prompt = `Analiza detalladamente esta captura de pantalla de "Skullgirls Mobile".
  
  TU OBJETIVO:
  1. EXTRAER EL NOMBRE DEL JUGADOR: Está en la esquina SUPERIOR IZQUIERDA, dentro de una placa dorada con diseño Art Déco. Ignora el nivel (ej: NV 78).
  2. EXTRAER EL DAÑO PERSONAL: Está en el CENTRO de la pantalla, justo debajo de la etiqueta "TOTAL PERSONAL DAMAGE" y a la IZQUIERDA del contador de tiempo "00:00" (TIME). Es un número blanco o dorado muy grande con puntos (ej: 349.632.248).
  
  REGLAS DE FORMATO:
  - Devuelve el daño como un número entero puro (sin puntos ni comas).
  - El nombre puede contener caracteres especiales o puntos.
  - Responde exclusivamente en JSON.`;

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
        systemInstruction: "Eres un experto en lectura de interfaces de usuario (UI) de Skullgirls Mobile. Tu precisión leyendo nombres de jugadores y valores de daño es absoluta.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            playerName: { type: Type.STRING },
            damageValue: { type: Type.INTEGER }
          },
          required: ["playerName", "damageValue"]
        },
        temperature: 0.1,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No se obtuvo respuesta de la IA");
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Error OCR:", error);
    throw error;
  }
};
