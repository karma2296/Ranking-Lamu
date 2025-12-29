
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
        const result = await analyzeDamageScreenshot(base64);
        if (result.playerName && !playerName) setPlayerName(result.playerName);
        if (result.damageValue && !damageValue) setDamageValue(result.damageValue.toString());
      } catch (err: any) {
        console.log("IA no pudo leer la imagen, usa el modo manual.");
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName || !damageValue) return;

    // Limpiamos el valor para que solo queden números
    const cleanValue = damageValue.toString().replace(/[^0-9]/g, '');
    const val = parseInt(cleanValue);
    
    if (isNaN(val)) {
      setError("Por favor, ingresa un número de daño válido.");
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

  // El botón se activa si hay nombre y hay daño (aunque la IA no haya terminado)
  const isSubmitDisabled = !playerName || !damageValue;

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-24 animate-in fade-in duration-700">
      
      {/* INDICADOR DE VERSIÓN NUEVA (Si ves esto en verde, la página ya se actualizó) */}
      <div className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 text-[10px] font-black py-2 px-6 rounded-full w-fit mx-auto shadow-lg shadow-emerald-500/10">
        ✅ SISTEMA MANUAL DESBLOQUEADO
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        {/* Luces decorativas */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/10 blur-[100px] pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-600/10 blur-[100px] pointer-events-none"></div>

        <div className="flex justify-between items-center mb-8 relative z-10">
          <h2 className="text-xl font-black text-white flex items-center gap-3">
            <span className="bg-indigo-600/20 p-2.5 rounded-xl text-indigo-400 shadow-inner">⚔️</span> 
            Subir Daño al Boss
          </h2>
          {isAnalyzing && (
            <div className="flex items-center gap-2 bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/30">
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping"></div>
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-tighter">Leyendo imagen...</span>
            </div>
          )}
        </div>

        {/* Subida de Imagen */}
        <div className="mb-8 relative z-10">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`group relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all hover:bg-slate-800/40 ${
              previewUrl ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-800'
            }`}
          >
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            
            {previewUrl ? (
              <div className="relative inline-block">
                <img src={previewUrl} alt="Preview" className="max-h-40 mx-auto rounded-xl shadow-2xl border border-slate-700" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                  <span className="text-white font-bold text-xs uppercase">Cambiar</span>
                </div>
              </div>
            ) : (
              <div className="py-4">
                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-3xl">📷</span>
                </div>
                <p className="text-slate-200 font-black text-sm uppercase tracking-tight">Sube tu captura</p>
                <p className="text-[10px] text-slate-500 font-medium mt-1">Opcional: La IA completará los datos por ti</p>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
          {/* Selector de Gremio */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setGuild('Principal')}
              className={`py-4 rounded-2xl font-black border transition-all text-xs uppercase tracking-widest ${
                guild === 'Principal' 
                  ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl shadow-indigo-600/20' 
                  : 'bg-slate-950 border-slate-800 text-slate-600 hover:text-slate-400'
              }`}
            >
              Lamu I
            </button>
            <button
              type="button"
              onClick={() => setGuild('Secundario')}
              className={`py-4 rounded-2xl font-black border transition-all text-xs uppercase tracking-widest ${
                guild === 'Secundario' 
                  ? 'bg-amber-600 border-amber-400 text-white shadow-xl shadow-amber-600/20' 
                  : 'bg-slate-950 border-slate-800 text-slate-600 hover:text-slate-400'
              }`}
            >
              Lamu II
            </button>
          </div>

          <div className="space-y-6">
            {/* Nickname */}
            <div className="group">
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1 tracking-[0.2em] group-focus-within:text-indigo-400 transition-colors">
                Nickname del Jugador
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Escribe tu nombre en el juego..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-800"
              />
            </div>

            {/* Daño */}
            <div className="group">
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1 tracking-[0.2em] group-focus-within:text-emerald-400 transition-colors">
                Daño Infligido
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={damageValue}
                  onChange={(e) => setDamageValue(e.target.value)}
                  placeholder="Ej: 4500000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 font-mono text-3xl text-emerald-400 font-black focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-800"
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                  <span className="text-emerald-400 font-black text-xl">DMG</span>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl">
              <p className="text-red-400 text-[10px] text-center font-black uppercase tracking-wider">
                ⚠️ {error}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitDisabled}
            className={`group relative w-full font-black py-6 rounded-2xl transition-all uppercase tracking-[0.3em] text-sm overflow-hidden ${
              isSubmitDisabled 
                ? 'bg-slate-800 text-slate-600 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xl shadow-indigo-600/40 active:scale-95'
            }`}
          >
            <span className="relative z-10">Confirmar Reporte</span>
            {!isSubmitDisabled && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
            )}
          </button>
          
          <p className="text-[9px] text-center text-slate-600 font-black uppercase tracking-widest">
            * Los campos son editables manualmente en todo momento
          </p>
        </form>
      </div>
    </div>
  );
};

export default AddDamageForm;
