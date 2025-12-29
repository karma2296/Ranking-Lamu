
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
        const result = await analyzeDamageScreenshot(base64);
        if (result.playerName) setPlayerName(result.playerName);
        if (result.damageValue) {
          setDamageValue(result.damageValue.toString());
        } else {
          setError("No pudimos detectar el daño. Asegúrate de que los números sean legibles.");
          setDamageValue('');
        }
      } catch (err) {
        setError("Error con Lamu-AI. Inténtalo de nuevo.");
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName || !damageValue) {
      setError("Faltan datos por completar.");
      return;
    }

    const val = parseInt(damageValue);
    
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

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <header className="mb-6">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <span>⚔️</span> Subir Daño al Boss
          </h2>
          <p className="text-sm text-slate-500 mt-1">Sube tu captura y selecciona tu división del gremio.</p>
        </header>

        <div className="mb-8">
          <div 
            onClick={() => !isAnalyzing && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all group ${
              previewUrl ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-700 hover:border-indigo-500 hover:bg-indigo-500/5'
            } ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*"
              disabled={isAnalyzing}
            />
            {previewUrl ? (
              <div className="relative inline-block">
                <img src={previewUrl} alt="Preview" className="max-h-64 rounded-lg shadow-2xl border border-slate-700" />
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-slate-900/80 rounded-lg flex flex-col items-center justify-center space-y-3">
                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-bold text-indigo-400 animate-pulse">Lamu-AI validando...</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 py-4">
                <div className="text-5xl group-hover:scale-110 transition-transform duration-300">📸</div>
                <div>
                  <p className="text-slate-300 font-bold text-lg">Subir captura del Boss</p>
                  <p className="text-sm text-slate-500">La IA leerá los datos automáticamente</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">¿A qué división perteneces?</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setGuild('Principal')}
                className={`py-4 rounded-xl font-bold border transition-all ${
                  guild === 'Principal' 
                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/20' 
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                Lamu I (Principal)
              </button>
              <button
                type="button"
                onClick={() => setGuild('Secundario')}
                className={`py-4 rounded-xl font-bold border transition-all ${
                  guild === 'Secundario' 
                    ? 'bg-amber-600 border-amber-400 text-white shadow-lg shadow-amber-500/20' 
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                Lamu II (Secundario)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tu Nickname</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Nombre en el juego"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-4 text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Daño Detectado</label>
              <input
                type="text"
                value={damageValue ? parseInt(damageValue).toLocaleString() : ''}
                readOnly
                placeholder="IA Detectando..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-4 font-mono text-xl text-emerald-400 cursor-not-allowed"
              />
            </div>
          </div>

          {error && <p className="text-red-400 text-sm font-semibold">⚠️ {error}</p>}

          <button
            type="submit"
            disabled={isAnalyzing || !damageValue}
            className={`w-full font-black py-5 rounded-xl transition-all text-lg uppercase ${
              isAnalyzing || !damageValue 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20 shadow-2xl'
            }`}
          >
            Confirmar y Reportar
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddDamageForm;
