
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
      } catch (e) {
        console.error("Error cargando settings locales", e);
      }
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
    <div className="max-w-4xl mx-auto space-y-10 pb-20 animate-in fade-in duration-500">
      
      {/* SECCIÓN DE ENLACE MAESTRO */}
      <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-sm">
        <h3 className="text-xl font-black text-white uppercase mb-2 tracking-tighter">Sincronización Maestra</h3>
        <p className="text-emerald-500/60 text-[10px] font-bold uppercase tracking-widest mb-6 italic">Genera un enlace para configurar otros dispositivos instantáneamente.</p>
        <button onClick={generateMaestroLink} className={`w-full py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] transition-all shadow-lg ${copiedLink ? 'bg-emerald-500 text-emerald-950' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}>
          {copiedLink ? '✓ ENLACE COPIADO AL PORTAPAPELES' : 'COPIAR LINK MAESTRO'}
        </button>
      </div>

      {/* TERMINAL DE CONTROL DE DATOS (ESTILO CAPTURA) */}
      <div className="bg-[#050b18]/90 border border-[#1e293b] rounded-[2.5rem] p-10 shadow-2xl backdrop-blur-md relative overflow-hidden">
        
        {/* Encabezado Terminal */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-2.5 h-2.5 bg-[#10b981] rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
          <h4 className="text-[11px] font-black text-[#10b981] uppercase tracking-[0.3em]">Terminal de Control de Datos</h4>
        </div>
        
        <div className="space-y-8">
          
          {/* BLOQUE 1: CREDENCIALES DE ACCESO */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Discord Client ID</label>
              <input 
                type="text" 
                value={settings.discordClientId} 
                onChange={e => setSettings({...settings, discordClientId: e.target.value})} 
                className="w-full bg-[#0a1224] border border-[#1e293b] rounded-2xl px-6 py-5 text-white font-mono text-sm focus:border-[#10b981]/50 outline-none transition-all" 
                placeholder="14553956..."
              />
            </div>
            <div className="space-y-3">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Contraseña Admin</label>
              <input 
                type="text" 
                value={settings.adminPassword} 
                onChange={e => setSettings({...settings, adminPassword: e.target.value})} 
                className="w-full bg-[#0a1224] border border-[#1e293b] rounded-2xl px-6 py-5 text-white font-mono text-sm focus:border-[#10b981]/50 outline-none transition-all" 
                placeholder="admin123"
              />
            </div>
          </div>

          {/* BLOQUE 2: WEBHOOKS DE DISCORD */}
          <div className="space-y-6 pt-2 border-t border-slate-800/30">
            <div className="space-y-3">
              <label className="text-[9px] font-black text-[#10b981] uppercase tracking-[0.2em] ml-2">Webhook: Registros de Daño (Canal 1)</label>
              <input 
                type="text" 
                value={settings.discordWebhook} 
                onChange={e => setSettings({...settings, discordWebhook: e.target.value})} 
                className="w-full bg-[#0a1224] border border-[#1e293b] rounded-2xl px-6 py-4 text-[#10b981] font-mono text-xs focus:border-[#10b981]/50 outline-none transition-all" 
                placeholder="https://discord.com/api/webhooks/..."
              />
            </div>
            <div className="space-y-3">
              <label className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] ml-2">Webhook: Ranking Actualizado (Canal 2)</label>
              <input 
                type="text" 
                value={settings.discordRankingWebhook} 
                onChange={e => setSettings({...settings, discordRankingWebhook: e.target.value})} 
                className="w-full bg-[#0a1224] border border-[#1e293b] rounded-2xl px-6 py-4 text-blue-400 font-mono text-xs focus:border-blue-400/50 outline-none transition-all" 
                placeholder="URL para el canal de Ranking"
              />
            </div>
          </div>

          {/* BLOQUE 3: SUPABASE NUBE */}
          <div className="space-y-6 pt-2 border-t border-slate-800/30">
            <div className="space-y-3">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Supabase Project URL</label>
              <input 
                type="text" 
                value={settings.supabaseUrl} 
                onChange={e => setSettings({...settings, supabaseUrl: e.target.value})} 
                className="w-full bg-[#0a1224] border border-[#1e293b] rounded-2xl px-6 py-4 text-white font-mono text-xs focus:border-[#10b981]/50 outline-none transition-all" 
                placeholder="https://xwpxlsldxokxtdcbnpox.supabase.co"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Supabase API Key (Anon)</label>
              <input 
                type="password" 
                value={settings.supabaseKey} 
                onChange={e => setSettings({...settings, supabaseKey: e.target.value})} 
                className="w-full bg-[#0a1224] border border-[#1e293b] rounded-2xl px-6 py-4 text-white font-mono text-xs focus:border-[#10b981]/50 outline-none transition-all" 
                placeholder="Tu clave secreta de Supabase"
              />
            </div>
          </div>

          {/* BOTÓN DE GUARDADO PRINCIPAL */}
          <button 
            onClick={handleSave} 
            className="w-full bg-[#065f46] hover:bg-[#047857] text-[#ecfdf5] py-6 rounded-2xl font-black uppercase text-xs tracking-[0.4em] transition-all shadow-xl active:scale-95 mt-6"
          >
            {saved ? '✓ CONFIGURACIÓN SINCRONIZADA' : 'SINCRO CON LA NUBE'}
          </button>
        </div>
      </div>

      {/* REINICIO DE TEMPORADA */}
      <div className="pt-8 text-center">
        <button 
          onClick={async () => { if(confirm("¿ELIMINAR TODOS LOS DATOS DE LA TEMPORADA?")) { await clearAllData(); onReset?.(); } }} 
          className="text-rose-600/40 hover:text-rose-500 text-[10px] font-black uppercase tracking-[0.3em] transition-colors border-b border-transparent hover:border-rose-500"
        >
          REINICIAR TODA LA BASE DE DATOS (PELIGRO)
        </button>
      </div>
    </div>
  );
};

export default Settings;
