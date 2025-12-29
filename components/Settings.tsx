
import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import { clearAllData, getLastError, isCloudConnected } from '../services/dbService';

interface SettingsProps {
  onReset?: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onReset }) => {
  const [settings, setSettings] = useState<AppSettings>({
    discordWebhook: '',
    supabaseUrl: '',
    supabaseKey: '',
    guildName: 'Lamu',
    adminPassword: '',
    discordClientId: ''
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem('lamu_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...parsed, adminPassword: parsed.adminPassword || 'admin123' });
      } catch (e) { }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('lamu_settings', JSON.stringify(settings));
    localStorage.setItem('lamu_discord_webhook', settings.discordWebhook); 
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const sqlCode = `-- COPIA Y PEGA ESTO EN EL SQL EDITOR DE SUPABASE
-- ESTA VERSIÓN INCLUYE IDENTIFICACIÓN DE DISCORD

DROP TABLE IF EXISTS damage_records;

CREATE TABLE damage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name TEXT NOT NULL,
  guild TEXT NOT NULL,
  damage_value BIGINT NOT NULL,
  timestamp BIGINT NOT NULL,
  screenshot_url TEXT,
  discord_id TEXT,
  discord_username TEXT,
  discord_avatar TEXT
);

ALTER TABLE damage_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON damage_records FOR ALL USING (true) WITH CHECK (true);`;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20 animate-in fade-in">
      <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800">
        <h4 className="text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest">Script de Actualización SQL (V2)</h4>
        <pre className="text-[9px] text-emerald-400 font-mono bg-black/50 p-4 rounded-xl border border-slate-800 overflow-x-auto">
          {sqlCode}
        </pre>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-8">Configuración del Gremio</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="md:col-span-2 bg-slate-950/50 p-6 rounded-2xl border border-slate-800">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest">Discord Client ID (Para Login)</label>
            <input type="text" value={settings.discordClientId || ''} onChange={(e) => setSettings({...settings, discordClientId: e.target.value})} placeholder="Ej: 134123..." className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500" />
            <p className="text-[9px] text-slate-500 mt-2 italic">Obtenlo en Discord Developer Portal > Tu App > OAuth2 > Client ID</p>
          </div>
          
          <div className="space-y-4">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Discord Webhook</label>
            <input type="password" value={settings.discordWebhook} onChange={(e) => setSettings({...settings, discordWebhook: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs outline-none text-indigo-300" />
          </div>
          
          <div className="space-y-4">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Supabase URL</label>
            <input type="text" value={settings.supabaseUrl} onChange={(e) => setSettings({...settings, supabaseUrl: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs outline-none text-slate-300" />
          </div>
        </div>
        
        <button onClick={handleSave} className={`w-full font-black py-5 rounded-2xl mt-8 transition-all uppercase text-xs tracking-widest ${saved ? 'bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-500'} text-white`}>
          {saved ? 'Guardado Correctamente' : 'Guardar Todo'}
        </button>
      </div>
    </div>
  );
};

export default Settings;
