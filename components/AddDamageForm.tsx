
import React, { useState, useEffect, useRef } from 'react';
import { analyzeDamageScreenshot } from '../services/geminiService';
import { saveRecord, getRecords } from '../services/dbService';
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
      const history = await getRecords();
      const hasRecords = history.some(r => r.discordUser?.id === currentUser.id);
      setIsFirstEntry(!hasRecords);
    };
    checkUserHistory();
  }, [currentUser]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setStatusMessage("Leyendo captura...");
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setPreviewUrl(base64);
      try {
        const result = await analyzeDamageScreenshot(base64);
        if (result.playerName) setPlayerName(result.playerName);
        if (result.totalDamage) setTotalDamage(result.totalDamage.toString());
        if (result.ticketDamage) setTicketDamage(result.ticketDamage.toString());
        setStatusMessage("✓ ¡Datos extraídos!");
      } catch (err) {
        setStatusMessage("⚠️ Error IA. Completa manualmente.");
      } finally { setIsAnalyzing(false); }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName || !ticketDamage || (isFirstEntry && !totalDamage)) return alert("Faltan datos");

    setIsSaving(true);
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
      onSuccess();
    } catch (err) {
      alert("Error al guardar");
    } finally { setIsSaving(false); }
  };

  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center bg-slate-900 rounded-[3rem] p-12 border border-slate-800">
        <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tight">Identificación Necesaria</h2>
        <button onClick={onLoginRequest} className="w-full bg-indigo-600 py-5 rounded-2xl font-black text-white uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20">Identificarse con Discord</button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto pb-20 animate-in fade-in duration-700">
      <div className="bg-slate-900 rounded-[3rem] p-10 border border-slate-800 shadow-2xl relative overflow-hidden">
        
        {isFirstEntry ? (
          <div className="mb-8 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-center">
            <p className="text-indigo-300 font-black text-[10px] uppercase tracking-[0.2em]">⚡ PRIMER REPORTE DETECTADO</p>
            <p className="text-slate-500 text-[9px] mt-1">Este reporte establecerá tu daño base en el ranking.</p>
          </div>
        ) : (
          <div className="mb-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center">
            <p className="text-emerald-400 font-black text-[10px] uppercase tracking-[0.2em]">📈 SUMANDO TICKET</p>
            <p className="text-slate-500 text-[9px] mt-1">Solo se sumará el daño de la batalla actual a tu total.</p>
          </div>
        )}

        <div onClick={() => !isAnalyzing && fileInputRef.current?.click()} className="mb-8 cursor-pointer group">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          {previewUrl ? (
            <img src={previewUrl} className="max-h-64 mx-auto rounded-3xl border-2 border-slate-800 group-hover:border-indigo-500/50 transition-all" />
          ) : (
            <div className="border-2 border-dashed border-slate-800 rounded-3xl py-12 text-center group-hover:border-indigo-500/50 transition-all">
              <span className="text-4xl">📸</span>
              <p className="text-slate-500 font-black text-[10px] uppercase mt-4 tracking-widest">Sube tu captura de batalla</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Nombre del Guerrero</label>
            <input type="text" value={playerName} onChange={e => setPlayerName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-black" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Daño Total (Base)</label>
              <input 
                type="text" 
                value={totalDamage} 
                onChange={e => setTotalDamage(e.target.value)} 
                disabled={!isFirstEntry}
                placeholder="---"
                className={`w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 font-mono font-black text-lg ${isFirstEntry ? 'text-white' : 'text-slate-700'}`} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Daño Ticket</label>
              <input 
                type="text" 
                value={ticketDamage} 
                onChange={e => setTicketDamage(e.target.value)} 
                placeholder="0"
                className="w-full bg-slate-950 border border-indigo-500/30 rounded-2xl px-6 py-4 text-cyan-400 font-mono font-black text-lg" 
              />
            </div>
          </div>

          <button disabled={isAnalyzing || isSaving} className="w-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 py-6 rounded-2xl text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
            {isSaving ? 'GUARDANDO...' : 'CONFIRMAR REPORTE'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddDamageForm;
