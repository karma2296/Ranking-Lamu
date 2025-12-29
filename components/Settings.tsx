
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
  const [inviteLink, setInviteLink] = useState('');
  const [diagError, setDiagError] = useState<string | null>(null);

  useEffect(() => {
    const savedSettings = localStorage.getItem('lamu_settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings({
        ...parsed,
        adminPassword: parsed.adminPassword || 'admin123'
      });
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
    setInviteLink(fullLink);
    navigator.clipboard.writeText(fullLink);
    alert("¡Link copiado! Pásalo a tus miembros.");
  };

  const sqlCode = `
CREATE TABLE IF NOT EXISTS damage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name TEXT NOT NULL,
  guild TEXT NOT NULL,
  damage_value BIGINT NOT NULL,
  timestamp BIGINT NOT NULL,
  screenshot_url TEXT
);

-- Habilitar acceso público
ALTER TABLE damage_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON damage_records FOR ALL USING (true) WITH CHECK (true);
  `.trim();

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20 animate-in fade-in">
      
      {/* DIAGNÓSTICO DE ERROR */}
      {diagError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-6 text-red-400 shadow-xl">
          <h4 className="font-black text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
            <span>❌</span> Fallo de Sincronización
          </h4>
          <p className="text-sm font-medium bg-black/30 p-4 rounded-xl mb-4 leading-relaxed">
            {diagError}
          </p>
          
          {diagError?.includes("secret API key") ? (
            <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl text-amber-500 text-xs">
              <p className="font-bold mb-2">💡 Cómo solucionarlo:</p>
              <ol className="list-decimal ml-4 space-y-1">
                <li>Ve a tu proyecto en <b>Supabase</b>.</li>
                <li>Haz clic en el icono de <b>Settings</b> (engranaje) -> <b>API</b>.</li>
                <li>Busca <b>Project API keys</b>.</li>
                <li>Copia la que dice <b>"anon"</b> (public). <b>NO</b> uses la de "service_role".</li>
                <li>Pégala abajo en el campo "Supabase API Key" y dale a Guardar.</li>
              </ol>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-red-400/70">Si el error dice "relation does not exist", ejecuta esto en el SQL Editor de Supabase:</p>
              <div className="relative group">
                <pre className="text-[10px] bg-slate-950 p-4 rounded-xl border border-red-500/20 overflow-x-auto text-slate-400 font-mono">
                  {sqlCode}
                </pre>
                <button 
                  onClick={() => { navigator.clipboard.writeText(sqlCode); alert("SQL Copiado"); }}
                  className="absolute top-2 right-2 bg-red-500 text-white text-[9px] px-2 py-1 rounded font-bold hover:bg-red-400"
                >
                  Copiar SQL
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* INVITACIÓN */}
      <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/30 rounded-3xl p-8 shadow-2xl">
        <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Sincronizar Gremio</h3>
        <p className="text-indigo-200/70 text-sm mb-6">Genera un link para que tus miembros se conecten automáticamente.</p>
        <button onClick={generateInviteLink} className="bg-indigo-500 hover:bg-indigo-400 text-white font-black py-4 px-8 rounded-2xl transition-all uppercase text-xs tracking-widest">
          🔗 Copiar Link de Invitación
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-8">Configuración Maestra</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="md:col-span-2 bg-slate-950/50 p-6 rounded-2xl border border-slate-800">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest">Clave Maestra Panel</label>
            <input type="text" value={settings.adminPassword} onChange={(e) => setSettings({...settings, adminPassword: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono text-sm outline-none focus:border-indigo-500" />
          </div>
          <div className="space-y-4">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Discord Webhook</label>
            <input type="password" value={settings.discordWebhook} onChange={(e) => setSettings({...settings, discordWebhook: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs outline-none text-indigo-300 focus:border-indigo-500" />
          </div>
          <div className="space-y-4">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Supabase URL</label>
            <input type="text" placeholder="https://xyz.supabase.co" value={settings.supabaseUrl} onChange={(e) => setSettings({...settings, supabaseUrl: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs outline-none text-slate-300 focus:border-indigo-500" />
            
            <div className="mt-4">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Supabase API Key (Usar "anon")</label>
              <p className="text-[9px] text-amber-500/70 mb-2 font-bold uppercase tracking-tighter italic">⚠️ ¡No uses service_role!</p>
              <input type="password" placeholder="Tu clave anon..." value={settings.supabaseKey} onChange={(e) => setSettings({...settings, supabaseKey: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs outline-none text-slate-300 focus:border-indigo-500" />
            </div>
          </div>
        </div>
        <button onClick={handleSave} className={`w-full font-black py-5 rounded-2xl mt-8 transition-all uppercase text-xs tracking-widest ${saved ? 'bg-emerald-600' : 'bg-slate-800 hover:bg-slate-700'} text-white shadow-xl`}>
          {saved ? '✅ Guardado y Verificado' : 'Guardar y Conectar'}
        </button>
      </div>

      <div className="bg-red-950/10 border border-red-900/30 rounded-3xl p-8">
        <h3 className="text-sm font-black text-red-500 uppercase mb-4 tracking-widest">Zona Peligrosa</h3>
        <button onClick={async () => { if(confirm('¿Borrar TODOS los datos de la base de datos? Esto no se puede deshacer.')) { setIsResetting(true); await clearAllData(); onReset?.(); alert('Base de datos limpiada.'); setIsResetting(false); } }} disabled={isResetting} className="bg-red-600/10 hover:bg-red-600 border border-red-600/50 text-red-500 hover:text-white font-bold py-3 px-6 rounded-xl transition-all text-xs uppercase tracking-widest">
          {isResetting ? 'Borrando...' : 'Reiniciar Temporada (Borrar Todo)'}
        </button>
      </div>
    </div>
  );
};

export default Settings;
