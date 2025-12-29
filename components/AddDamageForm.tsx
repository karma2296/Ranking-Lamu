
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
        console.log("IA omitida.");
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
      setError("Número de daño no válido.");
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

  const isSubmitDisabled = !playerName || !damageValue;

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-24">
      {/* MARCADOR VISUAL DE NUEVA VERSIÓN */}
      <div className="bg-emerald-500 text-black text-[10px] font-black py-1 px-4 rounded-full w-fit mx-auto shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-bounce">
        ✓ VERSIÓN DESBLOQUEADA (MANUAL ACTIVO)
      </div>

      <div className="bg-slate-900 border-2 border-indigo-500/50 rounded-3xl p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-white flex items-center gap-3">
            <span className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400">⚔️</span> 
            Subir Daño al Boss
          </h2>
          {isAnalyzing && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>
              <span className="text-[10px] font-bold text-indigo-400">IA PROCESANDO...</span>
            </div>
          )}
        </div>

        {/* Zona de Imagen */}
        <div className="mb-8">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all hover:bg-slate-800/50 ${
              previewUrl ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700'
            }`}
          >
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="max-h-32 mx-auto rounded-xl shadow-lg" />
            ) : (
              <div className="py-2">
                <span className="text-3xl block mb-2">📸</span>
                <p className="text-slate-300 font-bold text-sm">Subir Captura (Opcional)</p>
              </div>
            )}
          </div>
        </div>

        {/* FORMULARIO MANUAL */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setGuild('Principal')}
              className={`py-4 rounded-xl font-black border transition-all text-[11px] ${
                guild === 'Principal' ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              LAMU I
            </button>
            <button
              type="button"
              onClick={() => setGuild('Secundario')}
              className={`py-4 rounded-xl font-black border transition-all text-[11px] ${
                guild === 'Secundario' ? 'bg-amber-600 border-amber-400 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              LAMU II
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1 tracking-widest">
                Nickname (Nombre en juego)
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Escribe tu nombre..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-4 text-slate-100 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1 tracking-widest">
                Daño Infligido (Solo números)
              </label>
              <input
                type="number"
                value={damageValue}
                onChange={(e) => setDamageValue(e.target.value)}
                placeholder="Ej: 5000000"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-4 font-mono text-2xl text-emerald-400 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-800"
              />
            </div>
          </div>

          {error && <p className="text-red-400 text-[10px] text-center font-bold">⚠️ {error}</p>}

          <button
            type="submit"
            disabled={isSubmitDisabled}
            className={`w-full font-black py-5 rounded-2xl transition-all uppercase tracking-widest text-sm ${
              isSubmitDisabled 
                ? 'bg-slate-800 text-slate-600 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-500/20 active:scale-95'
            }`}
          >
            Confirmar Reporte
          </button>
          
          <p className="text-[9px] text-center text-slate-500 font-bold uppercase tracking-tighter">
            * Los campos son editables en todo momento.
          </p>
        </form>
      </div>
    </div>
  );
};

export default AddDamageForm;
