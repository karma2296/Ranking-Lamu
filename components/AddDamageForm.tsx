
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
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

    setStatusMessage("Leyendo imagen...");
    setIsAnalyzing(true);
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setPreviewUrl(base64);
      
      try {
        setStatusMessage("IA analizando captura (Skullgirls OCR)...");
        const result = await analyzeDamageScreenshot(base64);
        
        if (result.playerName) {
          setPlayerName(result.playerName);
        }
        if (result.damageValue) {
          setDamageValue(result.damageValue.toString());
        }
        setStatusMessage("¡Análisis completado!");
        setTimeout(() => setStatusMessage(null), 3000);
      } catch (err) {
        console.error(err);
        setStatusMessage("No pude leer los datos automáticamente. Por favor, rellénalos tú.");
        setTimeout(() => setStatusMessage(null), 5000);
      } finally { 
        setIsAnalyzing(false); 
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName || !damageValue) return alert("Faltan datos");

    const val = parseInt(damageValue.toString().replace(/[^0-9]/g, ''));
    if (isNaN(val)) return alert("El daño debe ser un número");

    setStatusMessage("Guardando registro...");
    try {
      await saveRecord({ 
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
    } catch (e) {
      alert("Error al guardar");
      setStatusMessage(null);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-24 animate-in fade-in duration-500">
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
        
        {isAnalyzing && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm z-40 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
            <p className="text-cyan-400 font-black text-[10px] uppercase tracking-widest animate-pulse">Analizando con Gemini...</p>
          </div>
        )}

        <div 
          onClick={() => fileInputRef.current?.click()} 
          className={`border-2 border-dashed rounded-3xl p-4 text-center cursor-pointer transition-all mb-8 group overflow-hidden ${
            previewUrl ? 'border-indigo-500/30' : 'border-slate-800 hover:border-indigo-500/50 py-12'
          }`}
        >
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          {previewUrl ? (
            <div className="relative">
              <img src={previewUrl} className="max-h-64 mx-auto rounded-2xl shadow-xl" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                <span className="text-white font-black text-xs uppercase">Cambiar Imagen</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-4xl">📸</div>
              <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest">Toca para subir captura de pantalla</p>
              <p className="text-slate-700 text-[8px] uppercase">Se recomienda capturas de la pantalla de 'Daño Total'</p>
            </div>
          )}
        </div>

        {statusMessage && (
          <div className="mb-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-center">
            <p className="text-indigo-400 font-bold text-[10px] uppercase tracking-wide">{statusMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <button 
              type="button" 
              onClick={() => setGuild('Principal')} 
              className={`py-4 rounded-2xl font-black text-[10px] uppercase transition-all ${guild === 'Principal' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-950 text-slate-600 border border-slate-800'}`}
            >
              División I
            </button>
            <button 
              type="button" 
              onClick={() => setGuild('Secundario')} 
              className={`py-4 rounded-2xl font-black text-[10px] uppercase transition-all ${guild === 'Secundario' ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/30' : 'bg-slate-950 text-slate-600 border border-slate-800'}`}
            >
              División II
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-600 uppercase ml-4">Nombre del Guerrero</label>
            <input 
              type="text" 
              value={playerName} 
              onChange={(e) => setPlayerName(e.target.value)} 
              placeholder="Escribe tu nick o deja que la IA lo lea..." 
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-indigo-500 transition-colors" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-600 uppercase ml-4">Daño Total Personal</label>
            <input 
              type="text" 
              value={damageValue} 
              onChange={(e) => setDamageValue(e.target.value)} 
              placeholder="000.000.000" 
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 font-mono text-3xl font-black text-cyan-400 outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-800" 
            />
          </div>

          <button 
            type="submit" 
            disabled={isAnalyzing || !playerName || !damageValue} 
            className="w-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 text-white font-black py-6 rounded-2xl uppercase tracking-[0.2em] text-xs transition-all active:scale-95 disabled:opacity-30 disabled:grayscale"
          >
            {isAnalyzing ? 'ESPERANDO A LA IA...' : 'CONFIRMAR Y SUBIR'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddDamageForm;
