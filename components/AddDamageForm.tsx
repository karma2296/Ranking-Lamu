
import React, { useState, useRef } from 'react';
import { analyzeDamageScreenshot } from '../services/geminiService';
import { saveRecord } from '../services/dbService';
import { sendDamageToDiscord } from '../services/discordService';
import { DiscordUser } from '../types';

interface AddDamageFormProps {
  onSuccess: () => void;
  currentUser: DiscordUser | null;
}

const AddDamageForm: React.FC<AddDamageFormProps> = ({ onSuccess, currentUser }) => {
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
        console.log("IA no pudo leer la imagen");
      } finally { setIsAnalyzing(false); }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName || !damageValue) return;
    const cleanValue = damageValue.toString().replace(/[^0-9]/g, '');
    const val = parseInt(cleanValue);
    if (isNaN(val)) { setError("Daño inválido"); return; }

    const record = await saveRecord({
      playerName,
      guild,
      damageValue: val,
      screenshotUrl: previewUrl || undefined,
      discordUser: currentUser || undefined
    });

    const webhook = localStorage.getItem('lamu_discord_webhook');
    if (webhook) {
      await sendDamageToDiscord(webhook, {
        playerName,
        guild,
        damageValue: val,
        screenshotUrl: previewUrl || undefined,
        discordUser: currentUser || undefined
      });
    }
    onSuccess();
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-24 animate-in fade-in duration-700">
      {!currentUser && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <p className="text-amber-200 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
            No has iniciado sesión con Discord. El daño se registrará como "Invitado".
          </p>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-black text-white flex items-center gap-3">
            <span className="bg-indigo-600/20 p-2.5 rounded-xl text-indigo-400">⚔️</span> 
            Subir Reporte
          </h2>
          {isAnalyzing && (
            <span className="text-[9px] font-black text-indigo-400 animate-pulse uppercase tracking-widest">IA Analizando...</span>
          )}
        </div>

        <div className="mb-8">
          <div onClick={() => fileInputRef.current?.click()} className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${previewUrl ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-800'}`}>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="max-h-40 mx-auto rounded-xl shadow-2xl" />
            ) : (
              <div className="py-4 opacity-50">
                <p className="text-slate-200 font-black text-sm uppercase">Sube tu captura</p>
                <p className="text-[9px] mt-1">La IA completará los campos</p>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <button type="button" onClick={() => setGuild('Principal')} className={`py-4 rounded-2xl font-black border transition-all text-xs uppercase ${guild === 'Principal' ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-950 border-slate-800 text-slate-600'}`}>Lamu I</button>
            <button type="button" onClick={() => setGuild('Secundario')} className={`py-4 rounded-2xl font-black border transition-all text-xs uppercase ${guild === 'Secundario' ? 'bg-amber-600 border-amber-400 text-white' : 'bg-slate-950 border-slate-800 text-slate-600'}`}>Lamu II</button>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Nombre en el Juego</label>
            <input type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="Tu nick..." className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-indigo-500 transition-all" />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Daño Total</label>
            <input type="text" value={damageValue} onChange={(e) => setDamageValue(e.target.value)} placeholder="Ej: 5000000" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 font-mono text-3xl text-emerald-400 font-black outline-none focus:border-emerald-500 transition-all" />
          </div>

          <button type="submit" disabled={!playerName || !damageValue} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-6 rounded-2xl shadow-xl transition-all uppercase tracking-[0.2em] text-sm active:scale-95 disabled:opacity-30">
            Confirmar Reporte
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddDamageForm;
