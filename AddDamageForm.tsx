
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
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsAnalyzing(true);
    setIsApiKeyMissing(false);
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setPreviewUrl(base64);
      
      try {
        const result = await analyzeDamageScreenshot(base64);
        if (result.playerName) setPlayerName(result.playerName);
        if (result.damageValue) {
          setDamageValue(result.damageValue.toString());
        } else {
          setError("La IA no detectó el daño automáticamente, por favor ingrésalo manualmente.");
        }
      } catch (err: any) {
        if (err.message === "API_KEY_MISSING") {
          setIsApiKeyMissing(true);
          setError("Lamu-AI no tiene su 'Cerebro' configurado (API_KEY). Puedes llenar los datos a mano.");
        } else {
          setError("No se pudo analizar la imagen. Ingresa los datos manualmente abajo.");
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
      setError("Faltan datos obligatorios.");
      return;
    }

    const val = parseInt(damageValue.replace(/[^0-9]/g, ''));
    if (isNaN(val)) {
      setError("El valor del daño debe ser un número.");
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
    <div className="max-w-2xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      {isApiKeyMissing && (
        <div className="bg-amber-500/10 border border-amber-500/50 p-4 rounded-xl text-amber-200 text-xs text-center">
          ⚠️ <strong>Aviso:</strong> La API KEY no está activa en Vercel. Puedes seguir usando el ranking ingresando los datos manualmente tras subir la foto.
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <header className="mb-6">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <span>⚔️</span> Reportar Daño
          </h2>
        </header>

        <div className="mb-8">
          <div 
            onClick={() => !isAnalyzing && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all group ${
              previewUrl ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-700 hover:border-indigo-500'
            } ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" disabled={isAnalyzing} />
            {previewUrl ? (
              <div className="relative inline-block">
                <img src={previewUrl} alt="Preview" className="max-h-48 rounded-lg shadow-2xl border border-slate-700" />
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-slate-900/80 rounded-lg flex flex-col items-center justify-center">
                    <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <span className="text-[10px] font-bold text-indigo-400">Analizando...</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-4">
                <div className="text-4xl mb-2">📸</div>
                <p className="text-slate-300 font-bold">Subir Captura</p>
                <p className="text-[10px] text-slate-500">JPG, PNG o Captura de Pantalla</p>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setGuild('Principal')}
              className={`py-3 rounded-xl font-bold border transition-all ${
                guild === 'Principal' ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              Lamu I
            </button>
            <button
              type="button"
              onClick={() => setGuild('Secundario')}
              className={`py-3 rounded-xl font-bold border transition-all ${
                guild === 'Secundario' ? 'bg-amber-600 border-amber-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              Lamu II
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Tu Nickname</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Nombre en el juego"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Daño Total</label>
              <input
                type="number"
                value={damageValue}
                onChange={(e) => setDamageValue(e.target.value)}
                placeholder="Ej: 1500000"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 font-mono text-xl text-emerald-400 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
              <p className="text-[9px] text-slate-500 mt-1 italic">* Si la IA falló, puedes corregir el número aquí.</p>
            </div>
          </div>

          {error && <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-[10px]">⚠️ {error}</div>}

          <button
            type="submit"
            disabled={isAnalyzing || !damageValue || !playerName}
            className={`w-full font-black py-4 rounded-xl transition-all uppercase ${
              isAnalyzing || !damageValue || !playerName ? 'bg-slate-800 text-slate-600' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
            }`}
          >
            Confirmar y Enviar
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddDamageForm;
