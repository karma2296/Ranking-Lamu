
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
  const [guild, setGuild] = useState<'Principal' | 'Secundario'>('Principal');
  const [totalDamage, setTotalDamage] = useState('');
  const [ticketDamage, setTicketDamage] = useState('');
  const [isFirstEntry, setIsFirstEntry] = useState(true);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkUserHistory = async () => {
      if (!currentUser) return;
      const started = await hasUserStartedSeason(currentUser.id);
      setIsFirstEntry(!started);
    };
    checkUserHistory();
  }, [currentUser]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsAnalyzing(true);
    setStatusMessage("ESCANEO TÁCTICO EN CURSO...");
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setPreviewUrl(base64);
      try {
        const result = await analyzeDamageScreenshot(base64);
        if (result.playerName) setPlayerName(result.playerName);
        if (result.totalDamage) setTotalDamage(result.totalDamage.toString());
        if (result.ticketDamage) setTicketDamage(result.ticketDamage.toString());
        setStatusMessage("✓ CRISTALIZACIÓN COMPLETADA");
      } catch (err) { setStatusMessage("⚠️ FALLO EN SCAN IA"); } 
      finally { setIsAnalyzing(false); }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName || !ticketDamage) return alert("Faltan coordenadas de daño.");
    setIsSaving(true);
    setStatusMessage("CONECTANDO CON SUPABASE...");

    try {
      const record = {
        playerName,
        guild,
        recordType: (isFirstEntry ? 'INITIAL' : 'INCREMENTAL') as RecordType,
        totalDamage: parseInt(totalDamage.toString().replace(/\D/g, '') || '0'),
        ticketDamage: parseInt(ticketDamage.toString().replace(/\D/g, '') || '0'),
        screenshotUrl: previewUrl || undefined,
        discordUser: currentUser!
      };

      await saveRecord(record);

      const sStr = localStorage.getItem('lamu_settings');
      if (sStr) {
        const settings: AppSettings = JSON.parse(sStr);
        
        // 1. Canal de Registros (Logs individuales)
        if (settings.discordWebhook) {
          setStatusMessage("ENVIANDO TICKET A DISCORD...");
          await sendDamageToDiscord(settings.discordWebhook, {
            playerName: record.playerName,
            guild: record.guild,
            damageValue: record.ticketDamage,
            screenshotUrl: record.screenshotUrl,
            discordUser: currentUser!
          });
        }

        // 2. Canal de Ranking (Tabla actualizada)
        const rankWebhook = settings.discordRankingWebhook || settings.discordWebhook;
        if (rankWebhook) {
          setStatusMessage("TRANSMITIENDO RANKING GLOBAL...");
          const updatedStats = await getPlayerStats();
          await sendRankingToDiscord(rankWebhook, updatedStats);
        }
      }
      onSuccess();
    } catch (err: any) {
      alert(`ERROR DE RED: ${err.message}`);
    } finally { setIsSaving(false); }
  };

  if (!currentUser) return (
    <div className="max-w-xl mx-auto py-24 text-center bg-emerald-950/30 rounded-[3rem] p-12 border-2 border-emerald-900/20">
      <h2 className="text-3xl font-black text-white skull-text italic mb-8">BLOQUEO DE SISTEMA</h2>
      <button onClick={onLoginRequest} className="w-full bg-emerald-600 py-6 rounded-[2rem] font-black text-emerald-950 uppercase tracking-widest shadow-2xl">Sincronizar Discord</button>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto pb-24 animate-in fade-in">
      <div className="bg-emerald-950/30 rounded-[3rem] p-10 border-2 border-emerald-900/20 shadow-2xl backdrop-blur-md">
        <div className="mb-6 text-center">
          <span className="text-[10px] font-black text-emerald-400 animate-pulse uppercase tracking-widest">{statusMessage || (isFirstEntry ? "MODO: REPORTE INICIAL" : "MODO: TICKET DE ASALTO")}</span>
        </div>
        
        <div onClick={() => !isAnalyzing && fileInputRef.current?.click()} className="mb-10 cursor-pointer group">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          {previewUrl ? <img src={previewUrl} className="max-h-72 mx-auto rounded-[2rem] border-2 border-emerald-400 shadow-2xl group-hover:brightness-110 transition-all" /> : 
          <div className="border-2 border-dashed border-emerald-900/40 rounded-[2.5rem] py-16 text-center bg-black/20 group-hover:border-emerald-500/50 transition-all">
            <span className="text-5xl drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">📸</span>
            <p className="text-emerald-800 font-black text-[10px] uppercase mt-5 tracking-[0.3em]">Cargar Captura de Skullgirls</p>
          </div>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest ml-5">Guerrero de Locked 'N' Loaded</label>
            <input type="text" value={playerName} onChange={e => setPlayerName(e.target.value)} className="w-full bg-black/40 border border-emerald-900/30 rounded-2xl px-6 py-5 text-white font-black skull-text italic outline-none focus:border-emerald-400/50 transition-all" />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-emerald-800 uppercase ml-5">Daño Base (Total)</label>
              <input type="text" value={totalDamage} onChange={e => setTotalDamage(e.target.value)} disabled={!isFirstEntry} className={`w-full bg-black/40 border border-emerald-900/30 rounded-2xl px-6 py-5 font-mono font-black ${isFirstEntry ? 'text-white' : 'text-emerald-950 opacity-20 cursor-not-allowed'}`} />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-emerald-800 uppercase ml-5">Daño del Ticket</label>
              <input type="text" value={ticketDamage} onChange={e => setTicketDamage(e.target.value)} className="w-full bg-black/40 border-2 border-emerald-400/30 rounded-2xl px-6 py-5 text-emerald-400 font-mono font-black outline-none focus:border-emerald-400" />
            </div>
          </div>

          <button disabled={isAnalyzing || isSaving} className="w-full wind-gradient py-7 rounded-[2rem] text-emerald-950 font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95 disabled:opacity-30">
            {isSaving ? 'REGISTRANDO EN NUBE...' : 'CONFIRMAR ASALTO'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddDamageForm;
