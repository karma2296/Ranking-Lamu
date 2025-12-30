
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

  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center bg-slate-900 border border-slate-800 rounded-[2.5rem] p-12">
        <h2 className="text-2xl font-black text-white mb-4 uppercase">Acceso Restringido</h2>
        <p className="text-slate-400 mb-10">Conecta tu cuenta de Discord para reportar daños.</p>
        <button onClick={onLoginRequest} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-2xl uppercase tracking-widest text-xs transition-all">🛰️ Conectar con Discord</button>
      </div>
    );
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
      } catch (err) {
        setIsEditable(true);
      } finally { setIsAnalyzing(false); }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(damageValue.toString().replace(/[^0-9]/g, ''));
    await saveRecord({ playerName, guild, damageValue: val, screenshotUrl: previewUrl || undefined, discordUser: currentUser });
    const webhook = localStorage.getItem('lamu_discord_webhook');
    if (webhook) await sendDamageToDiscord(webhook, { playerName, guild, damageValue: val, screenshotUrl: previewUrl || undefined, discordUser: currentUser });
    onSuccess();
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-24">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <div 
          onClick={() => fileInputRef.current?.click()} 
          className="border-2 border-dashed border-slate-800 rounded-2xl p-8 text-center cursor-pointer hover:border-indigo-500/50 transition-all mb-8"
        >
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          {previewUrl ? <img src={previewUrl} className="max-h-48 mx-auto rounded-xl" /> : <p className="text-slate-500 font-black uppercase text-xs">Sube tu captura</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <button type="button" onClick={() => setGuild('Principal')} className={`py-4 rounded-2xl font-black text-xs uppercase ${guild === 'Principal' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-600'}`}>División I</button>
            <button type="button" onClick={() => setGuild('Secundario')} className={`py-4 rounded-2xl font-black text-xs uppercase ${guild === 'Secundario' ? 'bg-amber-600 text-white' : 'bg-slate-950 text-slate-600'}`}>División II</button>
          </div>
          <input type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="Nick detectado..." className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold outline-none" />
          <input type="text" value={damageValue} onChange={(e) => setDamageValue(e.target.value)} placeholder="Daño Total..." className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 font-mono text-3xl font-black text-emerald-400 outline-none" />
          <button type="submit" disabled={isAnalyzing || !playerName} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-6 rounded-2xl uppercase tracking-widest text-sm transition-all active:scale-95 disabled:opacity-20">{isAnalyzing ? 'PROCESANDO...' : 'SUBIR REGISTRO'}</button>
        </form>
      </div>
    </div>
  );
};

export default AddDamageForm;
