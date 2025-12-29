
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
    guildName: 'Lamu',
    adminPassword: ''
  });
  const [saved, setSaved] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  useEffect(() => {
    const savedSettings = localStorage.getItem('lamu_settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings({
        ...parsed,
        adminPassword: parsed.adminPassword || 'admin123'
      });
    } else {
      setSettings(prev => ({ ...prev, adminPassword: 'admin123' }));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('lamu_settings', JSON.stringify(settings));
    localStorage.setItem('lamu_discord_webhook', settings.discordWebhook); 
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const generateInviteLink = () => {
    // Codificamos la configuración (excepto la clave de admin por seguridad si quieres, o inclúyela si quieres que todos sean admins)
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
    alert("¡Enlace de invitación copiado! Pásalo por el grupo de Discord de tu gremio.");
  };

  const handleManualReset = async () => {
    if (confirm('⚠️ ¿ESTÁS SEGURO? Esto borrará TODO el historial global para TODOS los miembros. Acción irreversible.')) {
      setIsResetting(true);
      await clearAllData();
      if (onReset) onReset();
      alert('Ranking global reiniciado.');
      setIsResetting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4">
      
      {/* SECCIÓN DE INVITACIÓN (LA CLAVE PARA TU PROBLEMA) */}
      <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 text-8xl">🔗</div>
        <div className="relative z-10">
          <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Sincronizar Gremio</h3>
          <p className="text-indigo-200/70 text-sm mb-6 max-w-md">
            Genera un link para que tus miembros no tengan que configurar nada. Al abrirlo, se conectarán automáticamente a tu base de datos y webhook.
          </p>
          <button
            onClick={generateInviteLink}
            className="bg-indigo-500 hover:bg-indigo-400 text-white font-black py-4 px-8 rounded-2xl transition-all shadow-xl shadow-indigo-500/20 flex items-center gap-3 uppercase text-xs tracking-[0.2em]"
          >
            <span>🔗</span> Copiar Link de Invitación
          </button>
          {inviteLink && (
            <p className="mt-4 text-[10px] font-mono text-indigo-400 truncate bg-slate-950 p-2 rounded-lg border border-indigo-500/20">
              {inviteLink}
            </p>
          )}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <header className="mb-8 border-b border-slate-800 pb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="p-2 bg-slate-800 rounded-lg text-indigo-400">⚙️</span>
            Configuración Maestra
          </h2>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4 md:col-span-2 bg-slate-950/50 p-6 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
              Seguridad Admin
            </h3>
            <div className="max-w-sm">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Clave de Acceso a Ajustes</label>
              <input
                type="text"
                value={settings.adminPassword}
                onChange={(e) => setSettings({...settings, adminPassword: e.target.value})}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono text-sm focus:ring-1 focus:ring-amber-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-400 rounded-full"></span>
              Discord Bot
            </h3>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Webhook URL</label>
              <input
                type="password"
                value={settings.discordWebhook}
                onChange={(e) => setSettings({...settings, discordWebhook: e.target.value})}
                placeholder="https://discord.com/api/webhooks/..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-indigo-300 font-mono text-xs outline-none"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
              Base de Datos
            </h3>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Supabase URL</label>
              <input
                type="text"
                value={settings.supabaseUrl}
                onChange={(e) => setSettings({...settings, supabaseUrl: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 font-mono text-xs outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">API Key</label>
              <input
                type="password"
                value={settings.supabaseKey}
                onChange={(e) => setSettings({...settings, supabaseKey: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 font-mono text-xs outline-none"
              />
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800">
          <button
            onClick={handleSave}
            className={`w-full font-black py-5 rounded-2xl transition-all shadow-xl uppercase text-xs tracking-widest ${
              saved ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'
            }`}
          >
            {saved ? '✅ Guardado Correctamente' : 'Guardar Datos en este PC'}
          </button>
        </div>
      </div>

      <div className="bg-red-950/10 border border-red-900/30 rounded-3xl p-8">
        <h3 className="text-sm font-black text-red-500 uppercase tracking-widest mb-4">Borrado Global</h3>
        <button
          onClick={handleManualReset}
          disabled={isResetting}
          className="bg-red-600/10 hover:bg-red-600 border border-red-600/50 text-red-500 hover:text-white font-bold py-3 px-6 rounded-xl transition-all text-xs uppercase tracking-widest"
        >
          {isResetting ? 'Procesando...' : '🗑️ Reiniciar Temporada (Borrar Todo)'}
        </button>
      </div>
    </div>
  );
};

export default Settings;
