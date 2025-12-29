
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
        // El análisis corre en segundo plano sin bloquear al usuario
        const result = await analyzeDamageScreenshot(base64);
        
        // Solo autocompletamos si el usuario no ha escrito nada aún para no molestar
        if (result.playerName && !playerName) setPlayerName(result.playerName);
        if (result.damageValue && !damageValue) setDamageValue(result.damageValue.toString());
        
        if (!result.playerName && !result.damageValue) {
          setError("La IA no detectó datos automáticos. Puedes ingresarlos manualmente.");
        }
      } catch (err: any) {
        if (err.message === "API_KEY_MISSING") {
          setError("⚠️ API_KEY no configurada. Ingresa los datos manualmente.");
        } else {
          setError("Análisis fallido. Por favor, completa los campos a mano.");
        }
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validamos que tengamos los datos mínimos antes de proceder
    if (!playerName || !damageValue) return;

    const val = parseInt(damageValue.toString().replace(/[^0-9]/g, ''));
    if (isNaN(val)) {
      setError("Por favor, ingresa un número de daño válido.");
      return;
    }
    
    // Si el usuario envía mientras la IA sigue analizando, simplemente cancelamos visualmente
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

  // EL CAMBIO CLAVE: El botón NO se deshabilita por 'isAnalyzing'
  const isSubmitDisabled = !playerName || !damageValue;

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-24">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3">
          <span className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400">⚔️</span> 
          Nuevo Reporte de Daño
        </h2>

        {/* Zona de Carga de Imagen: Ahora opcional y no bloqueante */}
        <div className="mb-8">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all overflow-hidden ${
              previewUrl ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-700 hover:border-slate-600'
            }`}
          >
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            
            {previewUrl ? (
              <div className="space-y-4">
                <img src={previewUrl} alt="Preview" className="max-h-48 mx-auto rounded-xl shadow-lg border border-slate-700" />
                {isAnalyzing && (
                  <div className="flex items-center justify-center gap-3 text-indigo-400">
                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[10px] font-bold uppercase tracking-widest animate-pulse">IA Extrayendo datos...</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-4">
                <div className="text-4xl mb-3">📸</div>
                <p className="text-slate-300 font-bold">Subir captura para auto-llenado</p>
                <p className="text-[10px] text-slate-500 mt-1 uppercase">O simplemente escribe los datos abajo</p>
              </div>
            )}
          </div>
        </div>

        {/* Formulario: Siempre activo */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setGuild('Principal')}
              className={`py-4 rounded-xl font-black border transition-all text-[11px] tracking-tighter uppercase ${
                guild === 'Principal' ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              LAMU I (Principal)
            </button>
            <button
              type="button"
              onClick={() => setGuild('Secundario')}
              className={`py-4 rounded-xl font-black border transition-all text-[11px] tracking-tighter uppercase ${
                guild === 'Secundario' ? 'bg-amber-600 border-amber-400 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              LAMU II (Cantera)
            </button>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1 tracking-widest">
                Nickname del Jugador
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Escribe el nombre del jugador..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-4 text-slate-100 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1 tracking-widest">
                Daño Infligido
              </label>
              <input
                type="number"
                value={damageValue}
                onChange={(e) => setDamageValue(e.target.value)}
                placeholder="Ej: 5000000"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-4 font-mono text-2xl text-emerald-400 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-[11px] flex items-center gap-3">
              <span>💡</span>
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitDisabled}
            className={`w-full font-black py-5 rounded-2xl transition-all uppercase tracking-widest text-sm shadow-2xl ${
              isSubmitDisabled 
                ? 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:scale-[1.01] active:scale-95'
            }`}
          >
            {isAnalyzing && !playerName && !damageValue ? 'IA Trabajando...' : 'Confirmar y Guardar'}
          </button>
          
          <div className="text-center space-y-2">
             <p className="text-[9px] text-slate-600 uppercase tracking-tighter">
              El registro aparecerá en el ranking y se enviará a Discord inmediatamente.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDamageForm;
