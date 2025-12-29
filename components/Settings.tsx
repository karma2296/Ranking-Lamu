
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
    adminPassword: ''
  });
  const [saved, setSaved] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [diagError, setDiagError] = useState<string | null>(null);

  useEffect(() => {
    const savedSettings = localStorage.getItem('lamu_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({
          ...parsed,
          adminPassword: parsed.adminPassword || 'admin123'
        });
      } catch (e) {
        console.error("Error loading settings");
      }
    }
    checkStatus();
  }, []);

  const checkStatus = async () => {
    const ok = await isCloudConnected();
    setDiagError(ok ? null : getLastError());
  };

  const handleSave = async () => {
    localStorage.setItem('lamu_settings', JSON.stringify(settings));
    localStorage.setItem('lamu_discord_webhook', settings.discordWebhook); 
    setSaved(true);
    await checkStatus();
    setTimeout(() => setSaved(false), 3000);
  };

  const generateInviteLink = () => {
    const configToShare = {
      discordWebhook: settings.discordWebhook,
      supabaseUrl: settings.supabaseUrl,
      supabaseKey: settings.supabaseKey,
      guildName: settings.guildName
    };
    const encoded = btoa(JSON.stringify(configToShare));
    const baseUrl = window.location.href.split('#')[0];
    const fullLink = `${baseUrl}#setup=${encoded}`;
    navigator.clipboard.writeText(fullLink);
    alert("Enlace de invitacion copiado al portapapeles.");
  };

  const sqlCode = `CREATE TABLE IF NOT EXISTS damage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name TEXT NOT NULL,
  guild TEXT NOT NULL,
  damage_value BIGINT NOT NULL,
  timestamp BIGINT NOT NULL,
  screenshot_url TEXT
);
ALTER TABLE damage_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON damage_records FOR ALL USING (true) WITH CHECK (true);`;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20 animate-in fade-in">
      
      {diagError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-6 text-red-400 shadow-xl">
          <h4 className="font-black text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
            ⚠️ Error de Conexion
          </h4>
          <p className="text-sm font-medium bg-black/30 p-4 rounded-xl mb-4 leading-relaxed">
            {diagError}
          </p>
          
          <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl text-amber-500 text-xs">
            <p className="font-bold mb-2">Instrucciones de reparacion:</p>
            <ol className="list-decimal ml-4 space-y-1">
              <li>Ve a Supabase &rarr; API Settings.</li>
              <li>Usa la clave marcada como "anon" (public).</li>
              <li>No uses la clave "service_role".</li>
            </ol>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/30 rounded-3xl p-8 shadow-2xl">
        <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Sincronizar Miembros</h3>
        <p className="text-indigo-200/70 text-sm mb-6">Comparte la configuracion con otros administradores.</p>
        <button onClick={generateInviteLink} className="bg-indigo-500 hover:bg-indigo-400 text-white font-black py-4 px-8 rounded-2xl transition-all uppercase text-xs tracking-widest">
          Copiar Link de Invitacion
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-8">Ajustes del Sistema</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="md:col-span-2 bg-slate-950/50 p-6 rounded-2xl border border-slate-800">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest">Password del Panel</label>
            <input type="text" value={settings.adminPassword} onChange={(e) => setSettings({...settings, adminPassword: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono text-sm outline-none focus:border-indigo-500" />
          </div>
          <div className="space-y-4">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Discord Webhook</label>
            <input type="password" value={settings.discordWebhook} onChange={(e) => setSettings({...settings, discordWebhook: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs outline-none text-indigo-300 focus:border-indigo-500" />
          </div>
          <div className="space-y-4">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Supabase URL</label>
            <input type="text" value={settings.supabaseUrl} onChange={(e) => setSettings({...settings, supabaseUrl: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs outline-none text-slate-300 focus:border-indigo-500" />
            
            <div className="mt-4">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Supabase API Key (anon)</label>
              <input type="password" value={settings.supabaseKey} onChange={(e) => setSettings({...settings, supabaseKey: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs outline-none text-slate-300 focus:border-indigo-500" />
            </div>
          </div>
        </div>
        <button onClick={handleSave} className={`w-full font-black py-5 rounded-2xl mt-8 transition-all uppercase text-xs tracking-widest ${saved ? 'bg-emerald-600' : 'bg-slate-800 hover:bg-slate-700'} text-white shadow-xl`}>
          {saved ? 'Cambios Guardados' : 'Guardar Configuracion'}
        </button>
      </div>

      <div className="bg-red-950/10 border border-red-900/30 rounded-3xl p-8">
        <h3 className="text-sm font-black text-red-500 uppercase mb-4 tracking-widest">Zona de Peligro</h3>
        <div className="flex flex-col gap-4">
          <button onClick={async () => { if(confirm('¿Borrar todos los datos?')) { setIsResetting(true); await clearAllData(); onReset?.(); setIsResetting(false); } }} disabled={isResetting} className="bg-red-600/10 hover:bg-red-600 border border-red-600/50 text-red-500 hover:text-white font-bold py-3 px-6 rounded-xl transition-all text-xs uppercase tracking-widest">
            {isResetting ? 'Borrando...' : 'Reiniciar Temporada'}
          </button>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <p className="text-[10px] text-slate-500 mb-2 uppercase font-bold">SQL para Supabase (Editor SQL):</p>
            <pre className="text-[9px] text-indigo-400 font-mono overflow-x-auto">{sqlCode}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
