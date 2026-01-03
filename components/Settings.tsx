
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

  // CARGAR DATOS AL MONTAR EL COMPONENTE
  useEffect(() => {
    const s = localStorage.getItem('lamu_settings');
    if (s) {
      try {
        const parsed = JSON.parse(s);
        // Mezclamos con el estado inicial para asegurar que no falten campos
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Error cargando configuración guardada", e);
      }
    }
  }, []);

  const handleSave = () => {
    // GUARDAR EN LOCALSTORAGE
    localStorage.setItem('lamu_settings', JSON.stringify(settings));
    setSaved(true);
    
    // Notificar al componente App para que refresque cualquier dependencia
    if (onReset) onReset();
    
    // Feedback visual breve
    setTimeout(() => setSaved(false), 2000);
  };

  const generateMaestroLink = () => {
    const encoded = btoa(JSON.stringify(settings));
    navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?setup=${encoded}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      
      {/* SECCIÓN DE LINK MAESTRO */}
      <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-[2rem] p-6 shadow-xl backdrop-blur-sm">
        <button 
          onClick={generateMaestroLink} 
          className={`w-full py-4 rounded-xl font-black uppercase text-[10px] tracking-[0.3em] transition-all shadow-lg ${copiedLink ? 'bg-emerald-500 text-emerald-950 shadow-[0_0_15px_#10b981]' : 'bg-indigo-600/80 text-white hover:bg-indigo-600'}`}
        >
          {copiedLink ? '✓ ENLACE DE CONFIGURACIÓN COPIADO' : 'GENERAR LINK MAESTRO PARA OTROS DISPOSITIVOS'}
        </button>
      </div>

      {/* TERMINAL DE CONTROL DE DATOS */}
      <div className="bg-[#050b18]/95 border border-[#1e293b] rounded-[2.5rem] p-10 shadow-2xl backdrop-blur-md relative">
        
        <div className="flex items-center gap-3 mb-8">
          <div className="w-2.5 h-2.5 bg-[#10b981] rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></div>
          <h4 className="text-[11px] font-black text-[#10b981] uppercase tracking-[0.3em]">Terminal de Control de Datos</h4>
        </div>
        
        <div className="space-y-6">
          
          {/* BLOQUE 1: ACCESO Y CREDENCIALES (NUEVOS CAMPOS) */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Discord Client ID</label>
              <input 
                type="text" 
                value={settings.discordClientId || ''} 
                onChange={e => setSettings({...settings, discordClientId: e.target.value})} 
                className="w-full bg-[#0a1224] border border-[#1e293b] rounded-2xl px-5 py-4 text-white font-mono text-xs focus:border-[#10b981]/50 outline-none transition-all" 
                placeholder="ID de tu aplicación de Discord"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Contraseña Admin</label>
              <input 
                type="text" 
                value={settings.adminPassword || ''} 
                onChange={e => setSettings({...settings, adminPassword: e.target.value})} 
                className="w-full bg-[#0a1224] border border-[#1e293b] rounded-2xl px-5 py-4 text-white font-mono text-xs focus:border-[#10b981]/50 outline-none transition-all" 
                placeholder="admin123"
              />
            </div>
          </div>

          {/* BLOQUE 2: SUPABASE CLOUD */}
          <div className="grid md:grid-cols-2 gap-6 pt-2 border-t border-slate-800/30">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Supabase Project URL</label>
              <input 
                type="text" 
                value={settings.supabaseUrl || ''} 
                onChange={e => setSettings({...settings, supabaseUrl: e.target.value})} 
                className="w-full bg-[#0a1224] border border-[#1e293b] rounded-2xl px-5 py-4 text-white font-mono text-xs focus:border-[#10b981]/50 outline-none transition-all" 
                placeholder="https://tu-proyecto.supabase.co"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Supabase API Key (Anon)</label>
              <input 
                type="password" 
                value={settings.supabaseKey || ''} 
                onChange={e => setSettings({...settings, supabaseKey: e.target.value})} 
                className="w-full bg-[#0a1224] border border-[#1e293b] rounded-2xl px-5 py-4 text-white font-mono text-xs focus:border-[#10b981]/50 outline-none transition-all" 
                placeholder="Clave anon de Supabase"
              />
            </div>
          </div>

          {/* BLOQUE 3: WEBHOOKS DE DISCORD */}
          <div className="space-y-4 pt-2 border-t border-slate-800/30">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-[#10b981] uppercase tracking-widest ml-2">Webhook: Registros de Daño (Canal 1)</label>
              <input 
                type="text" 
                value={settings.discordWebhook || ''} 
                onChange={e => setSettings({...settings, discordWebhook: e.target.value})} 
                className="w-full bg-[#0a1224] border border-[#10b981]/20 rounded-2xl px-5 py-4 text-[#10b981] font-mono text-xs focus:border-[#10b981]/50 outline-none transition-all" 
                placeholder="https://discord.com/api/webhooks/..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-blue-500 uppercase tracking-widest ml-2">Webhook: Ranking Actualizado (Canal 2)</label>
              <input 
                type="text" 
                value={settings.discordRankingWebhook || ''} 
                onChange={e => setSettings({...settings, discordRankingWebhook: e.target.value})} 
                className="w-full bg-[#0a1224] border border-blue-500/20 rounded-2xl px-5 py-4 text-blue-400 font-mono text-xs focus:border-blue-500/50 outline-none transition-all" 
                placeholder="URL para el Ranking Global"
              />
            </div>
          </div>

          {/* BOTÓN SINCRONIZAR */}
          <button 
            onClick={handleSave} 
            className={`w-full py-6 rounded-2xl font-black uppercase text-xs tracking-[0.4em] transition-all mt-4 shadow-xl active:scale-95 ${saved ? 'bg-emerald-400 text-emerald-950' : 'bg-[#10b981] hover:bg-[#059669] text-emerald-950'}`}
          >
            {saved ? '✓ DATOS SINCRONIZADOS' : 'SINCRO CON LA NUBE'}
          </button>
        </div>
      </div>

      {/* PELIGRO: RESET */}
      <div className="pt-8 text-center">
        <button 
          onClick={async () => { if(confirm("¿ELIMINAR TODOS LOS DATOS DE LA TEMPORADA?")) { await clearAllData(); onReset?.(); } }} 
          className="text-rose-600/50 hover:text-rose-500 text-[10px] font-black uppercase tracking-[0.3em] transition-colors"
        >
          ELIMINAR REGISTROS DE TEMPORADA
        </button>
      </div>
    </div>
  );
};

export default Settings;
