
import React, { useState, useEffect } from 'react';
import { AppSettings, PlayerStats } from '../types';
import { clearAllData } from '../services/dbService';

interface SettingsProps {
  stats?: PlayerStats[];
  onReset?: () => void;
}

const Settings: React.FC<SettingsProps> = ({ stats = [], onReset }) => {
  // Inicialización inmediata para evitar "flashes" de campos vacíos
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('lamu_settings');
    const defaultSettings: AppSettings = {
      discordWebhook: '', 
      discordRankingWebhook: '',
      supabaseUrl: '', 
      supabaseKey: '', 
      guildName: 'Locked \'N\' Loaded', 
      adminPassword: '', 
      discordClientId: ''
    };
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Fusionamos con los valores por defecto para asegurar que todas las propiedades existan
        return { ...defaultSettings, ...parsed };
      } catch (e) {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });
  
  const [saved, setSaved] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Guardar configuración de forma robusta
  const handleSave = () => {
    // Aseguramos que el objeto sea un JSON válido y lo guardamos
    const jsonString = JSON.stringify(settings);
    localStorage.setItem('lamu_settings', jsonString);
    
    setSaved(true);
    
    // Notificar al componente padre (App.tsx)
    if (onReset) {
      onReset();
    }
    
    // Feedback visual para el usuario
    setTimeout(() => setSaved(false), 2500);
    console.log("Configuración guardada correctamente:", settings);
  };

  const generateMaestroLink = () => {
    const encoded = btoa(JSON.stringify(settings));
    const url = `${window.location.origin}${window.location.pathname}?setup=${encoded}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32 animate-in fade-in duration-500">
      
      {/* LINK MAESTRO */}
      <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-[2rem] p-6 shadow-xl backdrop-blur-sm">
        <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-4 text-center">Sincronización de Dispositivos</h3>
        <button 
          onClick={generateMaestroLink} 
          className={`w-full py-4 rounded-xl font-black uppercase text-[10px] tracking-[0.3em] transition-all shadow-lg ${copiedLink ? 'bg-emerald-400 text-emerald-950 shadow-[0_0_20px_#10b981]' : 'bg-indigo-600/80 text-white hover:bg-indigo-600'}`}
        >
          {copiedLink ? '✓ ENLACE DE CONFIGURACIÓN COPIADO' : 'COPIAR LINK MAESTRO'}
        </button>
      </div>

      {/* TERMINAL PRINCIPAL */}
      <div className="bg-[#050b18]/95 border border-[#1e293b] rounded-[2.5rem] p-8 md:p-12 shadow-2xl backdrop-blur-md relative overflow-hidden">
        
        <div className="flex items-center gap-3 mb-10">
          <div className="w-2 h-2 bg-[#10b981] rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
          <h4 className="text-[10px] font-black text-[#10b981] uppercase tracking-[0.4em]">Panel de Control de Webhooks</h4>
        </div>
        
        <div className="space-y-8">
          
          {/* ACCESOS */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Discord Client ID</label>
              <input 
                type="text" 
                value={settings.discordClientId || ''} 
                onChange={e => setSettings(prev => ({...prev, discordClientId: e.target.value}))} 
                className="w-full bg-[#0a1224] border border-[#1e293b] rounded-2xl px-6 py-5 text-white font-mono text-xs focus:border-[#10b981]/50 outline-none transition-all" 
                placeholder="ID de la App de Discord"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Admin Password</label>
              <input 
                type="text" 
                value={settings.adminPassword || ''} 
                onChange={e => setSettings(prev => ({...prev, adminPassword: e.target.value}))} 
                className="w-full bg-[#0a1224] border border-[#1e293b] rounded-2xl px-6 py-5 text-white font-mono text-xs focus:border-[#10b981]/50 outline-none transition-all" 
                placeholder="Password de Administrador"
              />
            </div>
          </div>

          {/* WEBHOOKS (Persistencia corregida) */}
          <div className="space-y-6 pt-4 border-t border-slate-800/30">
            <div className="space-y-3">
              <label className="text-[9px] font-black text-[#10b981] uppercase tracking-widest ml-1">Webhook: Registros de Daño (Canal 1)</label>
              <input 
                type="text" 
                value={settings.discordWebhook || ''} 
                onChange={e => setSettings(prev => ({...prev, discordWebhook: e.target.value}))} 
                className="w-full bg-[#0a1224] border border-[#10b981]/20 rounded-2xl px-6 py-5 text-[#10b981] font-mono text-xs focus:border-[#10b981]/50 outline-none transition-all" 
                placeholder="https://discord.com/api/webhooks/..."
              />
            </div>
            <div className="space-y-3">
              <label className="text-[9px] font-black text-blue-500 uppercase tracking-widest ml-1">Webhook: Ranking Actualizado (Canal 2)</label>
              <input 
                type="text" 
                value={settings.discordRankingWebhook || ''} 
                onChange={e => setSettings(prev => ({...prev, discordRankingWebhook: e.target.value}))} 
                className="w-full bg-[#0a1224] border border-blue-500/20 rounded-2xl px-6 py-5 text-blue-400 font-mono text-xs focus:border-blue-500/50 outline-none transition-all" 
                placeholder="https://discord.com/api/webhooks/..."
              />
            </div>
          </div>

          {/* SUPABASE */}
          <div className="grid md:grid-cols-2 gap-8 pt-4 border-t border-slate-800/30">
            <div className="space-y-3">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Supabase URL</label>
              <input 
                type="text" 
                value={settings.supabaseUrl || ''} 
                onChange={e => setSettings(prev => ({...prev, supabaseUrl: e.target.value}))} 
                className="w-full bg-[#0a1224] border border-[#1e293b] rounded-2xl px-6 py-4 text-white font-mono text-[10px]" 
                placeholder="URL de Supabase"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Supabase Anon Key</label>
              <input 
                type="password" 
                value={settings.supabaseKey || ''} 
                onChange={e => setSettings(prev => ({...prev, supabaseKey: e.target.value}))} 
                className="w-full bg-[#0a1224] border border-[#1e293b] rounded-2xl px-6 py-4 text-white font-mono text-[10px]" 
                placeholder="Clave API"
              />
            </div>
          </div>

          {/* BOTÓN DE GUARDADO */}
          <button 
            onClick={handleSave} 
            className={`w-full py-6 rounded-2xl font-black uppercase text-xs tracking-[0.5em] transition-all shadow-2xl active:scale-95 mt-6 ${saved ? 'bg-emerald-400 text-emerald-950 scale-[0.98]' : 'bg-[#10b981] hover:bg-[#14b8a6] text-emerald-950'}`}
          >
            {saved ? '✓ CONFIGURACIÓN SINCRONIZADA' : 'SINCRO CON LA NUBE'}
          </button>
        </div>
      </div>

      {/* RESET DATA */}
      <div className="pt-4 text-center">
        <button 
          onClick={async () => { if(confirm("¿RESET TOTAL DE LA TEMPORADA?")) { await clearAllData(); onReset?.(); } }} 
          className="text-rose-600/40 hover:text-rose-500 text-[9px] font-black uppercase tracking-[0.4em] transition-colors"
        >
          BORRAR ARCHIVOS DE TEMPORADA
        </button>
      </div>
    </div>
  );
};

export default Settings;
