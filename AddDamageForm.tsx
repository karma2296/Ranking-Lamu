
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
        // Ejecutamos análisis en segundo plano. NO bloqueamos nada.
        const result = await analyzeDamageScreenshot(base64);
        
        // Solo rellenamos si el usuario no ha empezado a escribir
        if (result.playerName && !playerName) setPlayerName(result.playerName);
        if (result.damageValue && !damageValue) setDamageValue(result.damageValue.toString());
        
      } catch (err: any) {
        console.log("IA omitida o fallida, procediendo modo manual.");
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
      setError("Ingresa un número de daño válido.");
      return;
    }
    
    setIsAnalyzing(false);

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

  // El botón está disponible en cuanto hay texto, sin esperar a la IA
  const isSubmitDisabled = !playerName || !damageValue;

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-24">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-white flex items-center gap-3">
            <span className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400">⚔️</span> 
            Registrar Daño
          </h2>
          {isAnalyzing && (
            <span className="text-[10px] font-bold text-indigo-400 animate-pulse bg-indigo-500/5 px-3 py-1 rounded-full border border-indigo-500/20">
              🤖 BUSCANDO DATOS...
            </span>
          )}
        </div>

        {/* Carga de Imagen: Ahora es solo un "extra", no detiene el flujo */}
        <div className="mb-8">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all hover:bg-slate-800/30 ${
              previewUrl ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-700'
            }`}
          >
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            
            {previewUrl ? (
              <div className="relative">
                <img src={previewUrl} alt="Preview" className="max-h-32 mx-auto rounded-xl shadow-lg border border-slate-700" />
                <p className="text-[9px] text-slate-500 mt-2 uppercase font-bold">Clic para cambiar imagen</p>
              </div>
            ) : (
              <div className="py-2">
                <span className="text-2xl block mb-1">📷</span>
                <p className="text-slate-400 font-bold text-sm">Opcional: Subir Captura</p>
                <p className="text-[10px] text-slate-600">Para auto-completar datos</p>
              </div>
            )}
          </div>
        </div>

        {/* Formulario 100% Libre */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setGuild('Principal')}
              className={`py-4 rounded-xl font-black border transition-all text-[11px] uppercase ${
                guild === 'Principal' ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              LAMU I
            </button>
            <button
              type="button"
              onClick={() => setGuild('Secundario')}
              className={`py-4 rounded-xl font-black border transition-all text-[11px] uppercase ${
                guild === 'Secundario' ? 'bg-amber-600 border-amber-400 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              LAMU II
            </button>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1 tracking-widest">
                Escribe tu Nickname
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Ej: GuerreroLamu"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-4 text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1 tracking-widest">
                Escribe el Daño (Número)
              </label>
              <input
                type="number"
                value={damageValue}
                onChange={(e) => setDamageValue(e.target.value)}
                placeholder="Ej: 4500000"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-4 font-mono text-2xl text-emerald-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-800"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-[10px] bg-red-400/5 p-3 rounded-lg border border-red-400/20 text-center uppercase font-bold">
              ⚠️ {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitDisabled}
            className={`w-full font-black py-5 rounded-2xl transition-all uppercase tracking-widest text-sm shadow-2xl ${
              isSubmitDisabled 
                ? 'bg-slate-800 text-slate-600 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:scale-[1.01] active:scale-95'
            }`}
          >
            Confirmar Registro
          </button>
          
          <p className="text-[9px] text-center text-slate-600 uppercase font-bold tracking-tighter">
            Escritura manual desbloqueada. No es necesario esperar a la IA.
          </p>
        </form>
      </div>
    </div>
  );
};

export default AddDamageForm;
