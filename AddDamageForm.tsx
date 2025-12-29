
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
        // El análisis corre en segundo plano. El usuario puede seguir escribiendo.
        const result = await analyzeDamageScreenshot(base64);
        
        // Autocompletar solo si el usuario no ha escrito nada para evitar molestias
        if (result.playerName && !playerName) setPlayerName(result.playerName);
        if (result.damageValue && !damageValue) setDamageValue(result.damageValue.toString());
        
        if (!result.playerName && !result.damageValue) {
          setError("La IA no pudo leer los datos automáticamente. Completa los campos manualmente.");
        }
      } catch (err: any) {
        if (err.message === "API_KEY_MISSING") {
          setError("⚠️ Modo manual: Ingresa los datos directamente (API Key no configurada).");
        } else {
          setError("No se pudo analizar la imagen. Por favor, escribe los datos tú mismo.");
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
      setError("El valor del daño debe ser un número válido.");
      return;
    }
    
    // Si se envía mientras la IA sigue, forzamos el fin visual del análisis
    setIsAnalyzing(false);

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

  // El botón NO se bloquea por el estado de la IA. Solo necesita datos en los campos.
  const isSubmitDisabled = !playerName || !damageValue;

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-24">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-white flex items-center gap-3">
            <span className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400">⚔️</span> 
            Reportar Ataque
          </h2>
          {isAnalyzing && (
            <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
              <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">IA Leyendo...</span>
            </div>
          )}
        </div>

        {/* Carga de Captura (Totalmente Opcional) */}
        <div className="mb-8">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all overflow-hidden ${
              previewUrl ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-700 hover:border-slate-600'
            }`}
          >
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            
            {previewUrl ? (
              <div className="relative">
                <img src={previewUrl} alt="Preview" className="max-h-48 mx-auto rounded-xl shadow-lg border border-slate-700" />
                <div className="absolute top-2 right-2 bg-slate-900/80 px-2 py-1 rounded text-[10px] text-white">Cambiar</div>
              </div>
            ) : (
              <div className="py-4">
                <div className="text-4xl mb-3">📸</div>
                <p className="text-slate-300 font-bold">Subir captura (Auto-llenado)</p>
                <p className="text-[10px] text-slate-500 mt-1 uppercase">O simplemente escribe los datos abajo</p>
              </div>
            )}
          </div>
        </div>

        {/* Formulario Desbloqueado */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setGuild('Principal')}
              className={`py-4 rounded-xl font-black border transition-all text-[11px] uppercase ${
                guild === 'Principal' ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              LAMU I
            </button>
            <button
              type="button"
              onClick={() => setGuild('Secundario')}
              className={`py-4 rounded-xl font-black border transition-all text-[11px] uppercase ${
                guild === 'Secundario' ? 'bg-amber-600 border-amber-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              LAMU II
            </button>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1 tracking-widest flex justify-between">
                <span>Nickname del Guerrero</span>
                <span className="text-slate-700 italic">Editable</span>
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Nombre del jugador..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-4 text-slate-100 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1 tracking-widest flex justify-between">
                <span>Daño Total</span>
                <span className="text-emerald-500/50">Escribe libremente</span>
              </label>
              <input
                type="number"
                value={damageValue}
                onChange={(e) => setDamageValue(e.target.value)}
                placeholder="Ingresa el número de daño..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-4 font-mono text-2xl text-emerald-400 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-400 text-[10px] flex items-center gap-3">
              <span>ℹ️</span>
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitDisabled}
            className={`w-full font-black py-5 rounded-2xl transition-all uppercase tracking-widest text-sm shadow-2xl ${
              isSubmitDisabled 
                ? 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:scale-[1.01] active:scale-95'
            }`}
          >
            Confirmar Registro
          </button>
          
          <div className="text-center">
             <p className="text-[9px] text-slate-600 uppercase tracking-tighter">
              Los campos están abiertos para escritura manual inmediata.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDamageForm;
