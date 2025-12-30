
import React, { useState, useRef } from 'react';
import { analyzeDamageScreenshot } from '../services/geminiService';
import { saveRecord } from '../services/dbService';
import { sendDamageToDiscord } from '../services/discordService';
import { DiscordUser } from '../types';

interface AddDamageFormProps {
  onSuccess: () => void;
  currentUser: DiscordUser | null;
  onLoginRequest: () => void;
}

const AddDamageForm: React.FC<AddDamageFormProps> = ({ onSuccess, currentUser, onLoginRequest }) => {
  const [playerName, setPlayerName] = useState('');
  const [guild, setGuild] = useState<'Principal' | 'Secundario'>('Principal');
  const [damageValue, setDamageValue] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEditable, setIsEditable] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Si no hay usuario, mostramos pantalla de bloqueo
  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto py-20 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-12 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>
          <div className="w-24 h-24 bg-indigo-600/10 text-indigo-500 rounded-3xl flex items-center justify-center mx-auto mb-8 text-5xl border border-indigo-500/20">
            🔒
          </div>
          <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">Acceso Restringido</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-10 px-6">
            Para mantener la integridad del ranking, debes vincular tu cuenta de <span className="text-indigo-400 font-bold">Discord</span> antes de reportar daños.
          </p>
          <button 
            onClick={onLoginRequest}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-3 group active:scale-95"
          >
            <span className="text-xl group-hover:rotate-12 transition-transform">🛰️</span>
            <span className="uppercase tracking-[0.2em] text-xs">Conectar con Discord</span>
          </button>
          <p className="mt-6 text-[9px] font-black text-slate-600 uppercase tracking-widest">Solo miembros autorizados</p>
        </div>
      </div>
    );
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setIsAnalyzing(true);
    setIsEditable(false);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setPreviewUrl(base64);
      try {
        const result = await analyzeDamageScreenshot(base64);
        if (result.playerName) setPlayerName(result.playerName);
        if (result.damageValue) setDamageValue(result.damageValue.toString());
      } catch (err: any) {
        setError("La IA no pudo leer los datos. Por favor, ingresalos manualmente.");
        setIsEditable(true);
      } finally { setIsAnalyzing(false); }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName || !damageValue || !currentUser) return;
    
    const cleanValue = damageValue.toString().replace(/[^0-9]/g, '');
    const val = parseInt(cleanValue);
    
    if (isNaN(val) || val <= 0) { 
      setError("El valor de daño no es válido."); 
      return; 
    }

    const record = await saveRecord({
      playerName,
      guild,
      damageValue: val,
      screenshotUrl: previewUrl || undefined,
      discordUser: currentUser
    });

    const webhook = localStorage.getItem('lamu_discord_webhook');
    if (webhook) {
      await sendDamageToDiscord(webhook, {
        playerName,
        guild,
        damageValue: val,
        screenshotUrl: previewUrl || undefined,
        discordUser: currentUser
      });
    }
    onSuccess();
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-24 animate-in fade-in duration-700">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-black text-white flex items-center gap-3">
            <span className="bg-indigo-600/20 p-2.5 rounded-xl text-indigo-400">⚔️</span> 
            Registrar Daño
          </h2>
          {isAnalyzing && (
            <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20">
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Escaneando...</span>
            </div>
          )}
        </div>

        <div className="mb-8">
          <div 
            onClick={() => fileInputRef.current?.click()} 
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 hover:border-indigo-500/50 ${previewUrl ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-800'}`}
          >
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            {previewUrl ? (
              <div className="relative group">
                <img src={previewUrl} alt="Preview" className="max-h-48 mx-auto rounded-xl shadow-2xl border border-white/10" />
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-xl transition-opacity">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Cambiar Imagen</span>
                </div>
              </div>
            ) : (
              <div className="py-4 opacity-50 space-y-2">
                <p className="text-slate-200 font-black text-sm uppercase tracking-tight">Sube tu captura</p>
                <p className="text-[9px] leading-relaxed">Formatos soportados: JPG, PNG</p>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <button type="button" onClick={() => setGuild('Principal')} className={`py-4 rounded-2xl font-black border transition-all text-xs uppercase tracking-widest ${guild === 'Principal' ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-950 border-slate-800 text-slate-600 hover:text-slate-400'}`}>División I</button>
            <button type="button" onClick={() => setGuild('Secundario')} className={`py-4 rounded-2xl font-black border transition-all text-xs uppercase tracking-widest ${guild === 'Secundario' ? 'bg-amber-600 border-amber-400 text-white shadow-lg shadow-amber-600/20' : 'bg-slate-950 border-slate-800 text-slate-600 hover:text-slate-400'}`}>División II</button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nick detectado</label>
              {!isEditable && playerName && (
                <button type="button" onClick={() => setIsEditable(true)} className="text-[9px] font-black text-indigo-400 uppercase tracking-widest hover:text-white transition-colors">✎ Editar</button>
              )}
            </div>
            <input 
              type="text" 
              readOnly={!isEditable && !!playerName}
              value={playerName} 
              onChange={(e) => setPlayerName(e.target.value)} 
              placeholder="Esperando captura..." 
              className={`w-full bg-slate-950 border ${!isEditable && playerName ? 'border-slate-800 text-slate-400' : 'border-indigo-500/50 text-white'} rounded-2xl px-6 py-4 font-bold outline-none transition-all placeholder:text-slate-800`} 
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Daño Total Personal</label>
            <div className="relative">
              <input 
                type="text" 
                readOnly={!isEditable && !!damageValue}
                value={damageValue} 
                onChange={(e) => setDamageValue(e.target.value)} 
                placeholder="0" 
                className={`w-full bg-slate-950 border ${!isEditable && damageValue ? 'border-slate-800 text-emerald-400/50' : 'border-emerald-500/50 text-emerald-400'} rounded-2xl px-6 py-5 font-mono text-3xl font-black outline-none transition-all placeholder:text-slate-900`} 
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-500/30 uppercase tracking-widest">Pts</span>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={!playerName || !damageValue || isAnalyzing} 
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-6 rounded-2xl shadow-xl transition-all uppercase tracking-[0.2em] text-sm active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? 'Procesando...' : 'Subir Registro'}
          </button>
        </form>
      </div>

      <div className="flex items-center justify-center gap-2 pt-4 opacity-50">
        <img src={currentUser.avatar} className="w-5 h-5 rounded-full" alt="" />
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Reportando como {currentUser.username}</span>
      </div>
    </div>
  );
};

export default AddDamageForm;
