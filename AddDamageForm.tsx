
import React, { useState, useRef } from 'react';
import { analyzeDamageScreenshot } from '../services/geminiService';
import { saveRecord } from '../services/dbService';
import { sendDamageToDiscord } from '../services/discordService';

interface AddDamageFormProps {
  onSuccess: () => void;
}

const AddDamageForm: React.FC<AddDamageFormProps> = ({ onSuccess }) => {
  const [playerName, setPlayerName] = useState('');
  const [guild, setGuild] = useState<'Principal' | 'Secundario'>('Principal');
  const [damageValue, setDamageValue] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsAnalyzing(true);
    setManualMode(false);
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setPreviewUrl(base64);
      
      try {
        // Timeout de 8 segundos para la IA por si la conexión es lenta
        const analysisPromise = analyzeDamageScreenshot(base64);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("TIMEOUT")), 8000)
        );

        const result: any = await Promise.race([analysisPromise, timeoutPromise]);
        
        if (result.playerName) setPlayerName(result.playerName);
        if (result.damageValue) setDamageValue(result.damageValue.toString());
        
        if (!result.playerName && !result.damageValue) {
          setError("La IA no encontró datos. Por favor, escríbelos tú mismo.");
          setManualMode(true);
        }
      } catch (err: any) {
        setManualMode(true);
        if (err.message === "API_KEY_MISSING") {
          setError("Configuración de IA pendiente. Ingresa los datos manualmente abajo.");
        } else if (err.message === "TIMEOUT") {
          setError("La IA tarda demasiado. Ingresa los datos manualmente.");
        } else {
          setError("Error de análisis. Puedes completar el reporte a mano.");
        }
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName || !damageValue) {
      setError("El nombre y el daño son obligatorios.");
      return;
    }

    const val = parseInt(damageValue.toString().replace(/[^0-9]/g, ''));
    if (isNaN(val)) {
      setError("El daño debe ser un número válido.");
      return;
    }
    
    await saveRecord({
      playerName,
      guild,
      damageValue: val,
      screenshotUrl: previewUrl || undefined
    });

    const webhook = localStorage.getItem('lamu_discord_webhook');
    if (webhook) {
      await sendDamageToDiscord(webhook, {
        playerName,
        guild,
        damageValue: val,
        screenshotUrl: previewUrl || undefined
      });
    }

    onSuccess();
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <span>⚔️</span> Nuevo Reporte
        </h2>

        <div className="mb-8">
          <div 
            onClick={() => !isAnalyzing && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              previewUrl ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-700 hover:border-slate-600'
            }`}
          >
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            {previewUrl ? (
              <div className="relative inline-block">
                <img src={previewUrl} alt="Preview" className="max-h-40 rounded-lg shadow-lg border border-slate-700" />
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-slate-900/70 rounded-lg flex flex-col items-center justify-center">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-1"></div>
                    <span className="text-[10px] font-bold text-indigo-400">Analizando...</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-2">
                <div className="text-3xl mb-1">📸</div>
                <p className="text-slate-300 font-bold text-sm">Tocar para subir captura</p>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setGuild('Principal')}
              className={`py-3 rounded-xl font-bold border transition-all text-xs ${
                guild === 'Principal' ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              LAMU I
            </button>
            <button
              type="button"
              onClick={() => setGuild('Secundario')}
              className={`py-3 rounded-xl font-bold border transition-all text-xs ${
                guild === 'Secundario' ? 'bg-amber-600 border-amber-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              LAMU II
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Nickname del Jugador</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Escribe el nombre..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Daño Realizado</label>
              <input
                type="number"
                value={damageValue}
                onChange={(e) => setDamageValue(e.target.value)}
                placeholder="Escribe el número de daño..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 font-mono text-xl text-emerald-400 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-[10px] leading-relaxed">
              <strong>Info:</strong> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isAnalyzing || !damageValue || !playerName}
            className={`w-full font-black py-4 rounded-xl transition-all uppercase text-sm ${
              isAnalyzing || !damageValue || !playerName ? 'bg-slate-800 text-slate-600' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg'
            }`}
          >
            {isAnalyzing ? 'Procesando...' : 'Confirmar Registro'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddDamageForm;
