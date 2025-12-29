
import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import { clearAllData } from '../services/dbService';

interface SettingsProps {
  onReset?: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onReset }) => {
  const [settings, setSettings] = useState<AppSettings>({
    discordWebhook: '',
    supabaseUrl: '',
    supabaseKey: '',
    guildName: 'Lamu'
  });
  const [saved, setSaved] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem('lamu_settings');
    if (savedSettings) setSettings(JSON.parse(savedSettings));
  }, []);

  const handleSave = () => {
    localStorage.setItem('lamu_settings', JSON.stringify(settings));
    localStorage.setItem('lamu_discord_webhook', settings.discordWebhook); 
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleManualReset = async () => {
    if (confirm('⚠️ ¿ESTÁS SEGURO? Esto borrará TODO el historial y el ranking actual para todos. Esta acción no se puede deshacer.')) {
      setIsResetting(true);
      await clearAllData();
      if (onReset) onReset();
      alert('Ranking reiniciado con éxito.');
      setIsResetting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <header className="mb-8 border-b border-slate-800 pb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">⚙️</span>
            Centro de Control Lamu
          </h2>
          <p className="text-slate-400 mt-2">Configura cómo interactúa tu web con Discord y la nube.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></span>
              Discord Bot
            </h3>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Webhook URL de Canal</label>
              <input
                type="password"
                value={settings.discordWebhook}
                onChange={(e) => setSettings({...settings, discordWebhook: e.target.value})}
                placeholder="https://discord.com/api/webhooks/..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-indigo-300 font-mono text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <p className="text-[10px] text-slate-500 italic">Cada registro se enviará a este canal automáticamente.</p>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              Cloud Database (Supabase)
            </h3>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Supabase Project URL</label>
              <input
                type="text"
                value={settings.supabaseUrl}
                onChange={(e) => setSettings({...settings, supabaseUrl: e.target.value})}
                placeholder="https://xyz.supabase.co"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 font-mono text-xs focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Supabase API Key</label>
              <input
                type="password"
                value={settings.supabaseKey}
                onChange={(e) => setSettings({...settings, supabaseKey: e.target.value})}
                placeholder="anon-public-key"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 font-mono text-xs focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800">
          <button
            onClick={handleSave}
            className={`w-full font-bold py-4 rounded-xl transition-all shadow-xl flex items-center justify-center gap-2 ${
              saved ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            {saved ? '✅ Configuración Aplicada' : 'Guardar Configuración'}
          </button>
        </div>
      </div>

      {/* Zona de Peligro / Administración */}
      <div className="bg-red-950/20 border border-red-900/50 rounded-2xl p-8 shadow-2xl">
        <h3 className="text-sm font-black text-red-500 uppercase tracking-widest flex items-center gap-2 mb-4">
          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
          Zona de Administración
        </h3>
        <p className="text-xs text-red-200/60 mb-6">Estas acciones son permanentes. Úsalas solo para el mantenimiento del gremio.</p>
        
        <button
          onClick={handleManualReset}
          disabled={isResetting}
          className="bg-red-600/10 hover:bg-red-600 border border-red-600/50 text-red-500 hover:text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center gap-2 text-sm"
        >
          {isResetting ? 'Borrando...' : '🗑️ Reiniciar Ranking y Limpiar Todo'}
        </button>
      </div>
    </div>
  );
};

export default Settings;
