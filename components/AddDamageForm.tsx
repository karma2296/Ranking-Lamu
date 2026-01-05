
import React, { useState, useEffect, useRef } from 'react';
import { analyzeDamageScreenshot } from '../services/geminiService';
import { saveRecord, hasUserStartedSeason, getPlayerStats } from '../services/dbService';
import { sendDamageToDiscord, sendRankingToDiscord } from '../services/discordService';
import { DiscordUser, RecordType, AppSettings } from '../types';

interface AddDamageFormProps {
  onSuccess: () => void;
  currentUser: DiscordUser | null;
  onLoginRequest: () => void;
}

const AddDamageForm: React.FC<AddDamageFormProps> = ({ onSuccess, currentUser, onLoginRequest }) => {
  const [playerName, setPlayerName] = useState('');
  const [totalDamage, setTotalDamage] = useState('');
  const [ticketDamage, setTicketDamage] = useState('');
  const [isFirstEntry, setIsFirstEntry] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser) {
      hasUserStartedSeason(currentUser.id).then(started => setIsFirstEntry(!started));
    }
  }, [currentUser]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsAnalyzing(true);
    setStatus("ESCANEANDO FRECUENCIAS...");
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setPreviewUrl(base64);
      try {
        const res = await analyzeDamageScreenshot(base64);
        if (res.playerName) setPlayerName(res.playerName);
        if (res.totalDamage) setTotalDamage(res.totalDamage.toString());
        if (res.ticketDamage) setTicketDamage(res.ticketDamage.toString());
        setStatus("✓ GRABACIÓN PROCESADA");
      } catch (err) { setStatus("⚠️ ERROR DE SINTONÍA"); }
      finally { setIsAnalyzing(false); }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName || !ticketDamage) return alert("Faltan datos de la performance");
    setIsSaving(true);
    setStatus("SUBIENDO A LOS CHARTS...");

    try {
      const record = {
        playerName,
        guild: 'Principal' as any,
        recordType: (isFirstEntry ? 'INITIAL' : 'INCREMENTAL') as RecordType,
        totalDamage: parseInt(totalDamage.replace(/\D/g, '') || '0'),
        ticketDamage: parseInt(ticketDamage.replace(/\D/g, '') || '0'),
        screenshotUrl: previewUrl || undefined,
        discordUser: currentUser!
      };

      await saveRecord(record);

      const s = JSON.parse(localStorage.getItem('lamu_settings') || '{}');
      
      // Enviar a logs
      if (s.discordWebhook) {
        await sendDamageToDiscord(s.discordWebhook, {
          playerName: record.playerName,
          guild: 'Locked \'N\' Loaded',
          damageValue: record.ticketDamage,
          screenshotUrl: record.screenshotUrl,
          discordUser: currentUser!
        });
      }

      // Enviar a Ranking
      const rankHook = s.discordRankingWebhook || s.discordWebhook;
      if (rankHook) {
        const stats = await getPlayerStats();
        await sendRankingToDiscord(rankHook, stats);
      }

      onSuccess();
    } catch (err: any) { alert(err.message); }
    finally { setIsSaving(false); }
  };

  if (!currentUser) return (
    <div className="max-w-xl mx-auto py-20 text-center">
      <button onClick={onLoginRequest} className="w-full bg-sky-600 hover:bg-sky-500 py-6 rounded-3xl font-black text-sky-950 uppercase tracking-widest shadow-2xl transition-all active:scale-95">Inicia Sesión: Backstage</button>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto pb-24 animate-in fade-in">
      <div className="bg-sky-950/30 rounded-[3rem] p-10 border-2 border-sky-900/20 backdrop-blur-xl shadow-2xl">
        <p className="text-center text-[10px] font-black text-sky-400 uppercase tracking-widest mb-6">{status || "ESTUDIO DE GRABACIÓN"}</p>
        
        <div onClick={() => !isAnalyzing && fileInputRef.current?.click()} className="mb-8 cursor-pointer">
          <input type="file" ref={fileInputRef} onChange={handleFile} className="hidden" />
          {previewUrl ? <img src={previewUrl} className="max-h-64 mx-auto rounded-3xl border-2 border-sky-400 shadow-[0_0_30px_rgba(14,165,233,0.3)]" /> : 
          <div className="border-2 border-dashed border-sky-900/30 rounded-[2.5rem] py-16 text-center bg-black/20 hover:border-sky-400 transition-colors">
            <span className="text-4xl">🎵</span>
            <p className="text-sky-800 text-[9px] font-black uppercase mt-4">Capturar Track de Daño</p>
          </div>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-sky-700 uppercase tracking-widest ml-2">Nombre del Vocalista</label>
            <input type="text" value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="NOMBRE DEL GUERRERO" className="w-full bg-black/40 border border-sky-900/30 rounded-2xl px-6 py-4 text-white font-black uppercase text-sm outline-none focus:border-sky-500/50" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-sky-700 uppercase tracking-widest ml-2">Score Base</label>
              <input type="text" value={totalDamage} onChange={e => setTotalDamage(e.target.value)} disabled={!isFirstEntry} placeholder="DAÑO BASE" className="w-full bg-black/40 border border-sky-900/30 rounded-2xl px-6 py-4 font-mono text-white text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-sky-400 uppercase tracking-widest ml-2">Score del Verso</label>
              <input type="text" value={ticketDamage} onChange={e => setTicketDamage(e.target.value)} placeholder="DAÑO TICKET" className="w-full bg-black/40 border-2 border-sky-400/30 rounded-2xl px-6 py-4 font-mono text-sky-400 text-sm outline-none focus:border-sky-400" />
            </div>
          </div>
          <button disabled={isAnalyzing || isSaving} className="w-full bg-sky-600 hover:bg-sky-500 py-6 rounded-3xl text-sky-950 font-black uppercase tracking-widest shadow-[0_0_40px_rgba(14,165,233,0.2)] transition-all active:scale-95">
            {isSaving ? 'SINCRO EN CURSO...' : 'PUBLICAR SINGLE'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddDamageForm;
