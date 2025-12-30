
import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';

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
        setSettings({ 
          ...parsed, 
          adminPassword: parsed.adminPassword || 'admin123',
          discordClientId: parsed.discordClientId || ''
        });
      } catch (e) { 
        console.error("Error cargando configuración local");
      }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('lamu_settings', JSON.stringify(settings));
    localStorage.setItem('lamu_discord_webhook', settings.discordWebhook || ''); 
    setSaved(true);
    
    if (onReset) onReset();
    
    setTimeout(() => setSaved(false), 3000);
  };

  const sqlCode = `-- 1. DALE AL BOTÓN "+" EN SUPABASE (NEW QUERY)
-- 2. PEGA ESTE CÓDIGO Y DA CLIC EN "RUN"

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

-- Habilitar permisos para que la web pueda escribir
ALTER TABLE damage_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON damage_records FOR ALL USING (true) WITH CHECK (true);`;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20 animate-in fade-in">
      <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800">
        <h4 className="text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest">Script SQL para Supabase (Ejecutar una vez)</h4>
        <div className="relative group">
          <pre className="text-[10px] text-emerald-400 font-mono bg-black/50 p-6 rounded-2xl border border-slate-800 overflow-x-auto leading-relaxed">
            {sqlCode}
          </pre>
          <button 
            onClick={() => { navigator.clipboard.writeText(sqlCode); alert("¡Código copiado!"); }}
            className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700 text-white text-[9px] font-bold px-3 py-2 rounded-lg transition-colors border border-slate-700"
          >
            COPIAR CÓDIGO
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-8">Configuración del Gremio</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="md:col-span-2 bg-slate-950/50 p-6 rounded-2xl border border-slate-800">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest">Discord Client ID</label>
            <input 
              type="text" 
              value={settings.discordClientId || ''} 
              onChange={(e) => setSettings({...settings, discordClientId: e.target.value})} 
              placeholder="Lo obtienes en Discord Developer Portal" 
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 transition-all" 
            />
          </div>
          
          <div className="space-y-4">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Discord Webhook</label>
            <input 
              type="password" 
              value={settings.discordWebhook} 
              onChange={(e) => setSettings({...settings, discordWebhook: e.target.value})} 
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs outline-none text-indigo-300" 
            />
          </div>
          
          <div className="space-y-4">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Contraseña Admin</label>
            <input 
              type="password" 
              value={settings.adminPassword} 
              onChange={(e) => setSettings({...settings, adminPassword: e.target.value})} 
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs outline-none text-slate-300" 
            />
          </div>

          <div className="md:col-span-2 space-y-4">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Supabase URL</label>
            <input 
              type="text" 
              value={settings.supabaseUrl} 
              onChange={(e) => setSettings({...settings, supabaseUrl: e.target.value})} 
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs outline-none text-slate-300" 
            />
          </div>
          
          <div className="md:col-span-2 space-y-4">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Supabase Service Key (Anon Key)</label>
            <input 
              type="password" 
              value={settings.supabaseKey} 
              onChange={(e) => setSettings({...settings, supabaseKey: e.target.value})} 
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs outline-none text-slate-300" 
            />
          </div>
        </div>
        
        <button 
          onClick={handleSave} 
          className={`w-full font-black py-5 rounded-2xl mt-8 transition-all uppercase text-xs tracking-widest ${saved ? 'bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-500'} text-white shadow-xl active:scale-[0.98]`}
        >
          {saved ? '✓ Configuración Guardada' : 'Guardar Cambios'}
        </button>
      </div>
    </div>
  );
};

export default Settings;
