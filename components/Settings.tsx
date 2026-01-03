
import React, { useState, useEffect } from 'react';
import { AppSettings, PlayerStats } from '../types';
import { clearAllData } from '../services/dbService';

interface SettingsProps {
  stats?: PlayerStats[];
  onReset?: () => void;
}

const Settings: React.FC<SettingsProps> = ({ stats = [], onReset }) => {
  // Estado inicial con todos los campos necesarios
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

  // CARGAR: Al montar el componente, leemos de localStorage de forma segura
  useEffect(() => {
    const savedData = localStorage.getItem('lamu_settings');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // Mezclamos para no perder campos si el objeto guardado es antiguo
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Error al cargar ajustes:", e);
      }
    }
  }, []);

  // GUARDAR: Persistencia total en localStorage
  const handleSave = () => {
    const dataToSave = JSON.stringify(settings);
    localStorage.setItem('lamu_settings', dataToSave);
    
    // Feedback visual
    setSaved(true);
    
    // Notificamos al padre para que servicios como Supabase se actualicen con las nuevas credenciales
    if (onReset) onReset();
    
    setTimeout(() => setSaved(false), 3000);
  };

  const generateMaestroLink = () => {
    const encoded = btoa(JSON.stringify(settings));
    const url = `${window.location.origin}${window.location.pathname}?setup=${encoded}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Función genérica para actualizar campos de forma segura
  const updateField = (field: keyof AppSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24 animate-in fade-in duration-500">
      
      {/* BOTÓN SUPERIOR: LINK MAESTRO */}
      <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-[2rem] p-6 shadow-xl backdrop-blur-sm">
        <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-4 text-center">Sincronización Multidispositivo</h3>
        <button 
          onClick={generateMaestroLink} 
          className={`w-full py-4 rounded-xl font-black uppercase text-[10px] tracking-[0.3em] transition-all ${copiedLink ? 'bg-emerald-400 text-emerald-950 shadow-[0_0_20px_#10b981]' : 'bg-indigo-600/80 text-white hover:bg-indigo-600'}`}
        >
          {copiedLink ? '✓ LINK DE CONFIGURACIÓN COPIADO' : 'COPIAR LINK MAESTRO'}
        </button>
      </div>

      {/* TERMINAL DE CONFIGURACIÓN (Estética de la captura) */}
      <div className="bg-[#050b18]/95 border border-[#1e293b] rounded-[2.5rem] p-8 md:p-12 shadow-2xl backdrop-blur-md relative overflow-hidden">
        
        {/* Indicador de Terminal Activa */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-2 h-2 bg-[#10b981] rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
          <h4 className="text-[10px] font-black text-[#10b981] uppercase tracking-[0.4em]">Terminal de Enlace de Datos</h4>
        </div>
        
        <div className="space-y-8">
          
          {/* SECCIÓN 1: CREDENCIALES DISCORD APLICACIÓN */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Discord Client ID</label>
              <input 
                type="text" 
                value={settings.discordClientId || ''} 
                onChange={e => updateField('discordClientId', e.target.value)} 
                className="w-full bg-[#0a1224] border border-[#1e293b] rounded-2xl px-6 py-5 text-white font-mono text-xs focus:border-[#10b981]/50 outline-none transition-all" 
                placeholder="ID de la App"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Admin Password</label>
              <input 
                type="text" 
                value={settings.adminPassword || ''} 
                onChange={e => updateField('adminPassword', e.target.value)} 
                className="w-full bg-[#0a1224] border border-[#1e293b] rounded-2xl px-6 py-5 text-white font-mono text-xs focus:border-[#10b981]/50 outline-none transition-all" 
                placeholder="Password"
              />
            </div>
          </div>

          {/* SECCIÓN 2: WEBHOOKS (EL PROBLEMA ESTABA AQUÍ) */}
          <div className="space-y-6 pt-4 border-t border-slate-800/30">
            <div className="space-y-3">
              <label className="text-[9px] font-black text-[#10b981] uppercase tracking-widest ml-1">Webhook: Registros de Daño (Canal 1)</label>
              <input 
                type="text" 
                value={settings.discordWebhook || ''} 
                onChange={e => updateField('discordWebhook', e.target.value)} 
                className="w-full bg-[#0a1224] border border-[#10b981]/20 rounded-2xl px-6 py-5 text-[#10b981] font-mono text-xs focus:border-[#10b981]/50 outline-none transition-all" 
                placeholder="URL del Webhook de Logs"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[9px] font-black text-blue-500 uppercase tracking-widest ml-1">Webhook: Ranking Actualizado (Canal 2)</label>
              <input 
                type="text" 
                value={settings.discordRankingWebhook || ''} 
                onChange={e => updateField('discordRankingWebhook', e.target.value)} 
                className="w-full bg-[#0a1224] border border-blue-500/20 rounded-2xl px-6 py-5 text-blue-400 font-mono text-xs focus:border-blue-500/50 outline-none transition-all" 
                placeholder="URL del Webhook de Ranking"
              />
            </div>
          </div>

          {/* SECCIÓN 3: NUBE SUPABASE */}
          <div className="grid md:grid-cols-2 gap-8 pt-4 border-t border-slate-800/30">
            <div className="space-y-3">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Supabase Project URL</label>
              <input 
                type="text" 
                value={settings.supabaseUrl || ''} 
                onChange={e => updateField('supabaseUrl', e.target.value)} 
                className="w-full bg-[#0a1224] border border-[#1e293b] rounded-2xl px-6 py-4 text-white font-mono text-[10px]" 
                placeholder="https://..."
              />
            </div>
            <div className="space-y-3">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Supabase Anon Key</label>
              <input 
                type="password" 
                value={settings.supabaseKey || ''} 
                onChange={e => updateField('supabaseKey', e.target.value)} 
                className="w-full bg-[#0a1224] border border-[#1e293b] rounded-2xl px-6 py-4 text-white font-mono text-[10px]" 
                placeholder="Clave API"
              />
            </div>
          </div>

          {/* BOTÓN DE ACCIÓN: SINCRO CON LA NUBE */}
          <button 
            onClick={handleSave} 
            className={`w-full py-6 rounded-2xl font-black uppercase text-xs tracking-[0.5em] transition-all shadow-2xl active:scale-95 mt-6 ${saved ? 'bg-emerald-400 text-emerald-950 scale-[0.98]' : 'bg-[#10b981] hover:bg-[#14b8a6] text-emerald-950'}`}
          >
            {saved ? '✓ DATOS SINCRONIZADOS' : 'SINCRO CON LA NUBE'}
          </button>
        </div>
      </div>

      {/* ZONA DE PELIGRO */}
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
