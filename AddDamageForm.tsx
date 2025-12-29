
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsAnalyzing(true);
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setPreviewUrl(base64);
      
      try {
        // Ejecutamos el análisis pero no bloqueamos la UI de escritura
        const result = await analyzeDamageScreenshot(base64);
        
        if (result.playerName) setPlayerName(result.playerName);
        if (result.damageValue) setDamageValue(result.damageValue.toString());
        
        if (!result.playerName && !result.damageValue) {
          setError("La IA no pudo leer los datos automáticamente. Por favor, llénalos a mano.");
        }
      } catch (err: any) {
        if (err.message === "API_KEY_MISSING") {
          setError("⚠️ API KEY no detectada en Vercel. Por favor, ingresa los datos manualmente.");
        } else {
          setError("No se pudo analizar la imagen automáticamente. Ingresa los datos manualmente.");
        }
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName || !damageValue) return;

    const val = parseInt(damageValue.toString().replace(/[^0-9]/g, ''));
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

  const isSubmitDisabled = !playerName || !damageValue || isAnalyzing;

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-24">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3">
          <span className="bg-indigo-500/20 p-2 rounded-lg">⚔️</span> 
          Reportar Daño
        </h2>

        {/* Zona de Carga de Imagen */}
        <div className="mb-8">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all overflow-hidden ${
              previewUrl ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-700 hover:border-slate-600'
            }`}
          >
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            
            {previewUrl ? (
              <div className="space-y-4">
                <img src={previewUrl} alt="Preview" className="max-h-48 mx-auto rounded-xl shadow-lg border border-slate-700" />
                {isAnalyzing && (
                  <div className="flex items-center justify-center gap-3 text-indigo-400">
                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-bold uppercase tracking-widest">IA Analizando...</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setIsAnalyzing(false); }}
                      className="ml-4 text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400 hover:text-white"
                    >
                      Omitir
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-4">
                <div className="text-4xl mb-3">🖼️</div>
                <p className="text-slate-300 font-bold">Subir captura para auto-llenado</p>
                <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-tighter">O llena los datos directamente abajo</p>
              </div>
            )}
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setGuild('Principal')}
              className={`py-3 rounded-xl font-bold border transition-all text-xs ${
                guild === 'Principal' ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              LAMU I
            </button>
            <button
              type="button"
              onClick={() => setGuild('Secundario')}
              className={`py-3 rounded-xl font-bold border transition-all text-xs ${
                guild === 'Secundario' ? 'bg-amber-600 border-amber-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              LAMU II
            </button>
          </div>

          <div className="space-y-5">
            <div className="relative group">
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1 tracking-widest">
                Nickname del Guerrero
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Escribe tu nombre..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-4 text-slate-100 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-700"
              />
            </div>

            <div className="relative">
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1 tracking-widest">
                Daño Total Infligido
              </label>
              <input
                type="number"
                value={damageValue}
                onChange={(e) => setDamageValue(e.target.value)}
                placeholder="Ej: 2500000"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-4 font-mono text-2xl text-emerald-400 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-700"
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-200 text-[11px] flex items-start gap-3">
              <span>⚠️</span>
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitDisabled}
            className={`w-full font-black py-5 rounded-2xl transition-all uppercase tracking-widest text-sm shadow-2xl ${
              isSubmitDisabled 
                ? 'bg-slate-800 text-slate-600 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:scale-[1.02] active:scale-95 shadow-indigo-500/20'
            }`}
          >
            {isAnalyzing ? 'Esperando a la IA...' : 'Confirmar Registro'}
          </button>
          
          <p className="text-[9px] text-center text-slate-600 uppercase tracking-tighter">
            Todos los registros son guardados en la base de datos del gremio
          </p>
        </form>
      </div>
    </div>
  );
};

export default AddDamageForm;
