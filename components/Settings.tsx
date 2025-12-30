
import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';

const Settings: React.FC<{ onReset?: () => void }> = ({ onReset }) => {
  const [settings, setSettings] = useState<AppSettings>({
    discordWebhook: '', supabaseUrl: '', supabaseKey: '', guildName: 'Lamu', adminPassword: '', discordClientId: ''
  });
  const [saved, setSaved] = useState(false);
  const currentRedirectUri = window.location.origin + window.location.pathname;

  useEffect(() => {
    const s = localStorage.getItem('lamu_settings');
    if (s) setSettings(JSON.parse(s));
  }, []);

  const handleSave = () => {
    localStorage.setItem('lamu_settings', JSON.stringify(settings));
    localStorage.setItem('lamu_discord_webhook', settings.discordWebhook); 
    setSaved(true);
    if (onReset) onReset();
    setTimeout(() => setSaved(false), 2000);
  };

  const sqlCode = `DROP TABLE IF EXISTS damage_records;
CREATE TABLE damage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name TEXT, guild TEXT, damage_value BIGINT, timestamp BIGINT,
  screenshot_url TEXT, discord_id TEXT, discord_username TEXT, discord_avatar TEXT
);
ALTER TABLE damage_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON damage_records FOR ALL USING (true) WITH CHECK (true);`;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      <div className="bg-indigo-600/10 border border-indigo-500/30 rounded-3xl p-6">
        <h4 className="text-sm font-black text-white uppercase mb-2">Discord OAuth2 Redirect URI</h4>
        <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/20 flex items-center justify-between gap-4">
          <code className="text-xs text-indigo-300 font-mono truncate">{currentRedirectUri}</code>
          <button onClick={() => { navigator.clipboard.writeText(currentRedirectUri); alert("Copiado"); }} className="bg-indigo-600 px-4 py-2 rounded-lg text-[9px] font-black text-white">COPIAR</button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6">
        <input type="text" value={settings.discordClientId} onChange={e => setSettings({...settings, discordClientId: e.target.value})} placeholder="Discord Client ID" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
        <input type="password" value={settings.discordWebhook} onChange={e => setSettings({...settings, discordWebhook: e.target.value})} placeholder="Discord Webhook URL" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
        <input type="text" value={settings.supabaseUrl} onChange={e => setSettings({...settings, supabaseUrl: e.target.value})} placeholder="Supabase URL" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
        <input type="password" value={settings.supabaseKey} onChange={e => setSettings({...settings, supabaseKey: e.target.value})} placeholder="Supabase Anon Key" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
        <button onClick={handleSave} className="w-full bg-indigo-600 py-4 rounded-2xl font-black uppercase text-xs tracking-widest text-white">{saved ? '✓ GUARDADO' : 'GUARDAR CAMBIOS'}</button>
      </div>

      <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800">
        <h4 className="text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest">SQL para Supabase</h4>
        <pre className="text-[10px] text-emerald-400 font-mono bg-black/50 p-4 rounded-xl overflow-x-auto">{sqlCode}</pre>
      </div>
    </div>
  );
};

export default Settings;
