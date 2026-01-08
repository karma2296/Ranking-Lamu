
import React, { useState, useEffect, useRef } from 'react';
import { analyzeDamageScreenshot } from '../services/geminiService';
import { saveRecord, hasUserStartedSeason, getPlayerStats } from '../services/dbService';
import { sendDamageToDiscord, sendRankingToDiscord } from '../services/discordService';
import { DiscordUser, RecordType } from '../types';

interface AddDamageFormProps {
  onSuccess: () => void;
  currentUser: DiscordUser | null;
  onLoginRequest: () => void;
}

const AddDamageForm: React.FC<AddDamageFormProps> = ({ onSuccess, currentUser, onLoginRequest }) => {
  const [playerName, setPlayerName] = useState('');
  const [selectedGuild, setSelectedGuild] = useState<'Principal' | 'Secundario' | null>(null);
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
    if (!selectedGuild) return alert("Por favor selecciona un gremio (G1 o G2)");
    if (!playerName || !ticketDamage) return alert("Faltan datos de la performance");
    setIsSaving(true);
    setStatus("SUBIENDO A LOS CHARTS...");

    try {
      const record = {
        playerName,
        guild: selectedGuild,
        recordType: (isFirstEntry ? 'INITIAL' : 'INCREMENTAL') as RecordType,
        totalDamage: parseInt(totalDamage.replace(/\D/g, '') || '0'),
        ticketDamage: parseInt(ticketDamage.replace(/\D/g, '') || '0'),
        screenshotUrl: previewUrl || undefined,
        discordUser: currentUser || { id: `whatsapp_${Date.now()}`, username: playerName }
      };

      await saveRecord(record);

      const s = JSON.parse(localStorage.getItem('lamu_settings') || '{}');
      
      if (s.discordWebhook) {
        await sendDamageToDiscord(s.discordWebhook, {
          playerName: record.playerName,
          guild: selectedGuild === 'Principal' ? 'Lamu (G1)' : 'Lamu II (G2)',
          damageValue: record.ticketDamage,
          screenshotUrl: record.screenshotUrl,
          discordUser: record.discordUser as DiscordUser
        });
      }

      const rankHook = s.discordRankingWebhook || s.discordWebhook;
      if (rankHook) {
        const stats = await getPlayerStats();
        await sendRankingToDiscord(rankHook, stats);
      }

      onSuccess();
    } catch (err: any) { alert(err.message); }
    finally { setIsSaving(false); }
  };

  return (
    <div className="max-w-xl mx-auto pb-24 animate-in fade-in">
      <div className="bg-sky-950/30 rounded-[3rem] p-10 border-2 border-sky-900/20 backdrop-blur-xl shadow-2xl">
        <p className="text-center text-[10px] font-black text-sky-400 uppercase tracking-widest mb-6">{status || "ESTUDIO DE GRABACIÓN"}</p>
        
        {/* SELECCIÓN DE GREMIO */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button 
            type="button"
            onClick={() => setSelectedGuild('Principal')}
            className={`relative h-32 rounded-3xl overflow-hidden border-2 transition-all group ${selectedGuild === 'Principal' ? 'border-sky-400 scale-[1.02] shadow-[0_0_20px_rgba(14,165,233,0.4)]' : 'border-sky-900/30 opacity-60'}`}
          >
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" 
              style={{backgroundImage: `url('https://media.discordapp.net/attachments/1449825309011480647/1458604572011663462/image0.jpg?ex=69603edd&is=695eed5d&hm=3f69acc6217b2f7bfdb359eea1ab1734105899fbcbf2e2b3d24e047acfded048&=&format=webp&width=958&height=431')`}}
            />
            <div className={`absolute inset-0 bg-gradient-to-t ${selectedGuild === 'Principal' ? 'from-sky-950' : 'from-black'} to-transparent opacity-80`} />
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Lamu (G1)</span>
            </div>
          </button>

          <button 
            type="button"
            onClick={() => setSelectedGuild('Secundario')}
            className={`relative h-32 rounded-3xl overflow-hidden border-2 transition-all group ${selectedGuild === 'Secundario' ? 'border-blue-400 scale-[1.02] shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'border-sky-900/30 opacity-60'}`}
          >
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" 
              style={{backgroundImage: `url('https://media.discordapp.net/attachments/1449825309011480647/1458608389318901810/1000065430.jpg?ex=6960426b&is=695ef0eb&hm=e63742e1bb0251214ce4a233f42e545c69bff80762f371ad3e0de32b7619b5ae&=&format=webp&width=958&height=431')`}}
            />
            <div className={`absolute inset-0 bg-gradient-to-t ${selectedGuild === 'Secundario' ? 'from-blue-950' : 'from-black'} to-transparent opacity-80`} />
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Lamu II (G2)</span>
            </div>
          </button>
        </div>

        <div onClick={() => !isAnalyzing && fileInputRef.current?.click()} className="mb-8 cursor-pointer">
          <input type="file" min-width="0" ref={fileInputRef} onChange={handleFile} className="hidden" />
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
          <button disabled={isAnalyzing || isSaving || !selectedGuild} className="w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-30 disabled:grayscale py-6 rounded-3xl text-sky-950 font-black uppercase tracking-widest shadow-[0_0_40px_rgba(14,165,233,0.2)] transition-all active:scale-95">
            {isSaving ? 'SINCRO EN CURSO...' : 'PUBLICA TU RECORD'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddDamageForm;
