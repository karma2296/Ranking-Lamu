
import { GoogleGenAI, Type } from "@google/genai";

const MODEL_NAME = 'gemini-3-flash-preview';

export const analyzeDamageScreenshot = async (base64Image: string): Promise<{ playerName?: string; damageValue?: number }> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("La API_KEY no está configurada. Revisa los secretos en Vercel.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Detectar el tipo de contenido de la imagen (mimeType)
  const mimeMatch = base64Image.match(/^data:(image\/[a-z]+);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
  
  // Extraer solo la data base64 pura
  const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

  const prompt = `Analiza esta captura de pantalla de un videojuego. 
  1. Busca el nombre del jugador (nickname/username).
  2. Busca el daño total infligido (Total Damage, Damage dealt, etc.).
  Extrae los números con cuidado, ignorando otros valores como nivel o vida si es posible.
  Devuelve un JSON con 'playerName' y 'damageValue'.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
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
            playerName: { 
              type: Type.STRING, 
              description: "Nombre del usuario visible en la captura." 
            },
            damageValue: { 
              type: Type.NUMBER, 
              description: "Valor numérico del daño total." 
            }
          }
          // Eliminamos 'required' para evitar errores 400 si la IA tiene dudas
        }
      }
    });

    if (!response.text) {
      throw new Error("La IA devolvió una respuesta vacía.");
    }

    const result = JSON.parse(response.text);
    console.log("Análisis de Lamu-AI exitoso:", result);
    return result;
  } catch (error: any) {
    console.error("Error detallado de Gemini:", error);
    
    // Errores comunes para ayudar al usuario
    if (error.message?.includes('API_KEY_INVALID')) {
      throw new Error("La clave de API de Google no es válida.");
    }
    if (error.message?.includes('429')) {
      throw new Error("Demasiadas solicitudes. Espera un minuto.");
    }
    
    throw new Error(error.message || "Error desconocido al procesar la imagen.");
  }
};
