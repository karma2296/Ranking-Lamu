
import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';

const Settings: React.FC<{ onReset?: () => void }> = ({ onReset }) => {
  const [settings, setSettings] = useState<AppSettings>({
    discordWebhook: '', 
    supabaseUrl: '', 
    supabaseKey: '', 
    guildName: 'Lamu', 
    adminPassword: '', 
    discordClientId: ''
  });
  const [saved, setSaved] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
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

  const generateMaestroLink = () => {
    const configString = JSON.stringify(settings);
    const encoded = btoa(configString);
    const fullUrl = `${window.location.origin}${window.location.pathname}?setup=${encoded}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* SECCIÓN COMPARTIR */}
      <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/30 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 text-6xl group-hover:scale-110 transition-transform">🔗</div>
        <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Compartir Gremio</h3>
        <p className="text-slate-400 text-sm mb-8 max-w-md">Genera un enlace para que otros miembros se configuren automáticamente sin tocar código.</p>
        
        <button 
          onClick={generateMaestroLink}
          className={`flex items-center gap-3 px-8 py-5 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 ${
            copiedLink ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/20'
          }`}
        >
          {copiedLink ? '✓ LINK COPIADO AL PORTAPAPELES' : '🚀 GENERAR Y COPIAR LINK MAESTRO'}
        </button>
      </div>

      <div className="grid gap-6">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-4">Configuración Técnica</h4>
        <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8 space-y-6 backdrop-blur-sm">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-600 uppercase ml-2">Discord Client ID</label>
              <input type="text" value={settings.discordClientId} onChange={e => setSettings({...settings, discordClientId: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-mono text-sm outline-none focus:border-indigo-500" />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-600 uppercase ml-2">Contraseña Admin Panel</label>
              <input type="text" value={settings.adminPassword} onChange={e => setSettings({...settings, adminPassword: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-mono text-sm outline-none focus:border-indigo-500" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-600 uppercase ml-2">Discord Webhook URL</label>
            <input type="password" value={settings.discordWebhook} onChange={e => setSettings({...settings, discordWebhook: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-mono text-xs outline-none focus:border-indigo-500" />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-600 uppercase ml-2">Supabase URL</label>
              <input type="text" value={settings.supabaseUrl} onChange={e => setSettings({...settings, supabaseUrl: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-mono text-xs outline-none focus:border-indigo-500" />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-600 uppercase ml-2">Supabase Service Key</label>
              <input type="password" value={settings.supabaseKey} onChange={e => setSettings({...settings, supabaseKey: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-mono text-xs outline-none focus:border-indigo-500" />
            </div>
          </div>

          <button onClick={handleSave} className="w-full bg-slate-100 hover:bg-white text-slate-950 py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all active:scale-95 shadow-xl">
            {saved ? '✓ CAMBIOS GUARDADOS' : 'GUARDAR CONFIGURACIÓN'}
          </button>
        </div>
      </div>

      <div className="bg-slate-950/80 p-8 rounded-[2rem] border border-slate-800/50">
        <h4 className="text-[10px] font-black text-slate-600 uppercase mb-4 tracking-widest">Discord Redirect URI (Copiar en Discord Developer Portal)</h4>
        <div className="flex items-center gap-4 bg-black/40 p-4 rounded-xl border border-slate-800">
          <code className="text-[10px] text-indigo-400 font-mono truncate flex-1">{currentRedirectUri}</code>
          <button onClick={() => navigator.clipboard.writeText(currentRedirectUri)} className="text-[9px] font-black text-slate-400 hover:text-white uppercase transition-colors">Copiar</button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
