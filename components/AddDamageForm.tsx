import React, { useState, useEffect, useRef } from 'react';
import { analyzeDamageScreenshot } from '../services/geminiService';
import { saveRecord, hasUserStartedSeason } from '../services/dbService';
import { sendDamageToDiscord } from '../services/discordService';
import { DiscordUser, RecordType } from '../types';

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
    setStatusMessage("ESCANEO EN CURSO...");
    
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
      } catch (err) {
        setStatusMessage("⚠️ FALLO EN SCAN. MANUAL REQUERIDO.");
      } finally { setIsAnalyzing(false); }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName || !ticketDamage) return alert("Faltan coordenadas de daño");

    setIsSaving(true);
    setStatusMessage("SINCRONIZANDO CON LA RED ESMERALDA...");

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

      const settings = JSON.parse(localStorage.getItem('lamu_settings') || '{}');
      if (settings.discordWebhook) {
        setStatusMessage("TRANSMITIENDO A DISCORD...");
        await sendDamageToDiscord(settings.discordWebhook, {
          playerName: record.playerName,
          guild: record.guild,
          damageValue: record.ticketDamage,
          screenshotUrl: record.screenshotUrl,
          discordUser: currentUser!
        });
      }

      onSuccess();
    } catch (err: any) {
      alert(`ERROR DE RED:\n${err.message || 'Error desconocido'}`);
      setStatusMessage("❌ TRANSMISIÓN FALLIDA");
    } finally { 
      setIsSaving(false); 
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center bg-emerald-950/30 rounded-[3rem] p-12 border-2 border-emerald-900/20 backdrop-blur-md">
        <h2 className="text-3xl font-black text-white skull-text italic mb-8 tracking-tighter">ACCESO DENEGADO</h2>
        <button onClick={onLoginRequest} className="w-full bg-emerald-600 py-6 rounded-[2rem] font-black text-emerald-950 uppercase tracking-[0.2em] hover:bg-emerald-500 transition-all shadow-2xl shadow-emerald-900/40 active:scale-95">Iniciando Sincronía Discord</button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto pb-24 animate-in fade-in duration-700">
      <div className="bg-emerald-950/30 rounded-[3rem] p-10 border-2 border-emerald-900/20 shadow-2xl backdrop-blur-md relative overflow-hidden">
        
        {isFirstEntry ? (
          <div className="mb-8 p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center">
            <p className="text-emerald-400 font-black text-[10px] uppercase tracking-[0.4em] mb-1">⚡ REGISTRO DE BASE DETECTADO</p>
            <p className="text-emerald-900 text-[9px] font-bold uppercase">Iniciando cálculo de temporada para el guerrero.</p>
          </div>
        ) : (
          <div className="mb-8 p-5 bg-teal-500/10 border border-teal-500/30 rounded-2xl text-center">
            <p className="text-teal-400 font-black text-[10px] uppercase tracking-[0.4em] mb-1">📈 INCREMENTO DE PODER</p>
            <p className="text-emerald-900 text-[9px] font-bold uppercase">Sumando ticket al registro base verificado.</p>
          </div>
        )}

        {statusMessage && (
          <div className="mb-6 text-center">
            <span className="text-[10px] font-black text-emerald-400 animate-pulse uppercase tracking-[0.3em]">{statusMessage}</span>
          </div>
        )}

        <div onClick={() => !isAnalyzing && fileInputRef.current?.click()} className="mb-10 cursor-pointer group">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          {previewUrl ? (
            <div className="relative">
              <img src={previewUrl} className="max-h-72 mx-auto rounded-[2rem] border-2 border-emerald-800/50 group-hover:border-emerald-400 transition-all shadow-2xl" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-[2rem]">
                <span className="text-emerald-400 font-black uppercase text-[10px] tracking-widest bg-emerald-950 px-6 py-3 rounded-full border border-emerald-500/30">Re-Escanear</span>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-emerald-900/40 rounded-[2.5rem] py-16 text-center group-hover:border-emerald-500/50 transition-all bg-black/20">
              <span className="text-5xl drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">📸</span>
              <p className="text-emerald-800 font-black text-[10px] uppercase mt-5 tracking-[0.3em]">Cargar Informe de Daño</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest ml-5">División de Gremio</label>
            <div className="grid grid-cols-2 gap-4 p-2 bg-black/40 rounded-[2rem] border border-emerald-900/30">
              <button
                type="button"
                onClick={() => setGuild('Principal')}
                className={`py-4 rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.2em] transition-all active:scale-95 ${
                  guild === 'Principal' 
                    ? 'bg-emerald-600 text-emerald-950 shadow-lg' 
                    : 'text-emerald-900 hover:text-emerald-400'
                }`}
              >
                Principal
              </button>
              <button
                type="button"
                onClick={() => setGuild('Secundario')}
                className={`py-4 rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.2em] transition-all active:scale-95 ${
                  guild === 'Secundario' 
                    ? 'bg-teal-700 text-white shadow-lg' 
                    : 'text-emerald-900 hover:text-emerald-400'
                }`}
              >
                Secundario
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest ml-5">Nombre del Guerrero</label>
            <input type="text" value={playerName} onChange={e => setPlayerName(e.target.value)} className="w-full bg-black/40 border border-emerald-900/30 rounded-2xl px-6 py-5 text-white font-black skull-text italic text-lg outline-none focus:border-emerald-500/50 transition-all" />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3 relative">
              <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest ml-5">Daño Base</label>
              <div className="relative overflow-hidden rounded-2xl">
                <input 
                  type="text" 
                  value={totalDamage} 
                  onChange={e => setTotalDamage(e.target.value)} 
                  disabled={!isFirstEntry}
                  placeholder={isFirstEntry ? "0" : ""}
                  className={`w-full bg-black/40 border border-emerald-900/30 rounded-2xl px-6 py-5 font-mono font-black text-xl transition-all ${isFirstEntry ? 'text-white border-emerald-500/40' : 'text-emerald-950 opacity-20 cursor-not-allowed'}`} 
                />
                {!isFirstEntry && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-emerald-950/40 backdrop-blur-[1px]">
                    <span className="text-[9px] font-black text-emerald-500 border border-emerald-500 px-3 py-1 rounded-md uppercase tracking-widest rotate-[-5deg]">BLOQUEADO</span>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest ml-5">Daño Ticket</label>
              <input 
                type="text" 
                value={ticketDamage} 
                onChange={e => setTicketDamage(e.target.value)} 
                placeholder="0"
                className="w-full bg-black/40 border-2 border-emerald-400/30 rounded-2xl px-6 py-5 text-emerald-400 font-mono font-black text-xl outline-none focus:border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.1)]" 
              />
            </div>
          </div>

          <button disabled={isAnalyzing || isSaving} className="w-full wind-gradient py-7 rounded-[2rem] text-emerald-950 font-black uppercase tracking-[0.3em] text-xs shadow-2xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-30">
            {isSaving ? 'EXTRAYENDO ENERGÍA...' : 'CONFIRMAR ASALTO'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddDamageForm;