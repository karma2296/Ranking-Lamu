
import React, { useState, useEffect } from 'react';
import { AppSettings, PlayerStats } from '../types';
import { clearAllData } from '../services/dbService';

interface SettingsProps {
  stats?: PlayerStats[];
  onReset?: () => void;
}

const Settings: React.FC<SettingsProps> = ({ stats = [], onReset }) => {
  const [settings, setSettings] = useState<AppSettings>({
    discordWebhook: '', 
    discordRankingWebhook: '',
    supabaseUrl: '', 
    supabaseKey: '', 
    guildName: 'Locked \'N\' Loaded', 
    adminPassword: '', 
    discordClientId: ''
  });
  const [saved, setSaved] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem('lamu_settings');
    if (s) {
      try {
        const parsed = JSON.parse(s);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (e) {}
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('lamu_settings', JSON.stringify(settings));
    setSaved(true);
    if (onReset) onReset();
    setTimeout(() => setSaved(false), 2000);
  };

  const generateMaestroLink = () => {
    const encoded = btoa(JSON.stringify(settings));
    navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?setup=${encoded}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in">
      {/* SECCIÓN DE ENLACE MAESTRO */}
      <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-[2.5rem] p-8 shadow-xl">
        <h3 className="text-xl font-black text-white uppercase mb-4 tracking-tighter">Enlace de Configuración Rápida</h3>
        <button onClick={generateMaestroLink} className={`w-full py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${copiedLink ? 'bg-emerald-600 text-emerald-950 shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-indigo-600 text-white'}`}>
          {copiedLink ? '✓ ENLACE COPIADO AL PORTAPAPELES' : 'GENERAR LINK MAESTRO'}
        </button>
      </div>

      {/* FORMULARIO DE CONFIGURACIÓN PRINCIPAL */}
      <div className="bg-[#050b18]/80 border border-slate-800 rounded-[2.5rem] p-10 space-y-8 shadow-2xl backdrop-blur-md">
        
        {/* FILA 1: DISCORD CREDENTIALS */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Discord Client ID</label>
            <input type="text" value={settings.discordClientId} onChange={e => setSettings({...settings, discordClientId: e.target.value})} className="w-full bg-[#0a1224] border border-slate-800 rounded-2xl px-6 py-5 text-white font-mono text-sm focus:border-indigo-500/50 outline-none transition-all" placeholder="1234567890..." />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Contraseña Admin</label>
            <input type="text" value={settings.adminPassword} onChange={e => setSettings({...settings, adminPassword: e.target.value})} className="w-full bg-[#0a1224] border border-slate-800 rounded-2xl px-6 py-5 text-white font-mono text-sm focus:border-indigo-500/50 outline-none transition-all" placeholder="admin123" />
          </div>
        </div>

        {/* FILA 2: WEBHOOKS */}
        <div className="space-y-6 pt-4 border-t border-slate-800/50">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-2">Discord Webhook URL (Registros)</label>
            <input type="text" value={settings.discordWebhook} onChange={e => setSettings({...settings, discordWebhook: e.target.value})} className="w-full bg-[#0a1224] border border-slate-800 rounded-2xl px-6 py-4 text-emerald-400 font-mono text-xs focus:border-emerald-500/50 outline-none transition-all" placeholder="https://discord.com/api/webhooks/..." />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-2">Discord Webhook URL (Ranking Global)</label>
            <input type="text" value={settings.discordRankingWebhook} onChange={e => setSettings({...settings, discordRankingWebhook: e.target.value})} className="w-full bg-[#0a1224] border border-slate-800 rounded-2xl px-6 py-4 text-blue-400 font-mono text-xs focus:border-blue-500/50 outline-none transition-all" placeholder="URL para el canal de Ranking" />
          </div>
        </div>

        {/* FILA 3: SUPABASE */}
        <div className="space-y-6 pt-4 border-t border-slate-800/50">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Supabase URL</label>
            <input type="text" value={settings.supabaseUrl} onChange={e => setSettings({...settings, supabaseUrl: e.target.value})} className="w-full bg-[#0a1224] border border-slate-800 rounded-2xl px-6 py-4 text-white font-mono text-xs focus:border-emerald-500/50 outline-none transition-all" placeholder="https://xyz.supabase.co" />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Supabase Key</label>
            <input type="password" value={settings.supabaseKey} onChange={e => setSettings({...settings, supabaseKey: e.target.value})} className="w-full bg-[#0a1224] border border-slate-800 rounded-2xl px-6 py-4 text-white font-mono text-xs focus:border-emerald-500/50 outline-none transition-all" placeholder="Tu API Key de Supabase" />
          </div>
        </div>

        <button onClick={handleSave} className="w-full bg-slate-100 hover:bg-white text-slate-900 py-6 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all shadow-xl active:scale-95">
          {saved ? '✓ CONFIGURACIÓN GUARDADA' : 'GUARDAR CONFIGURACIÓN'}
        </button>
      </div>

      {/* REINICIO DE TEMPORADA */}
      <div className="pt-8 text-center">
        <button onClick={async () => { if(confirm("¿ESTÁS SEGURO DE REINICIAR LA TEMPORADA?")) { await clearAllData(); onReset?.(); } }} className="text-rose-500/50 hover:text-rose-500 text-[9px] font-black uppercase tracking-[0.4em] transition-all">
          REINICIAR TODA LA BASE DE DATOS
        </button>
      </div>
    </div>
  );
};

export default Settings;
