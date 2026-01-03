
import React, { useState, useEffect } from 'react';
import { AppSettings, PlayerStats } from '../types';
import { clearAllData, updateInitialDamage } from '../services/dbService';

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
    guildName: 'Lamu', 
    adminPassword: '', 
    discordClientId: ''
  });
  const [saved, setSaved] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem('lamu_settings');
    if (s) {
      try {
        const parsed = JSON.parse(s);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Error cargando settings", e);
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
    <div className="max-w-3xl mx-auto space-y-10 pb-20 animate-in fade-in duration-500">
      
      {/* SECCIÓN DE ENLACE MAESTRO */}
      <div className="bg-slate-900 border border-indigo-500/30 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
        <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Configuración Maestra</h3>
        <p className="text-slate-400 text-xs mb-6">Genera un link para configurar otros dispositivos al instante.</p>
        <button onClick={generateMaestroLink} className={`px-8 py-5 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 ${copiedLink ? 'bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-500'}`}>
          {copiedLink ? '✓ ENLACE COPIADO' : 'COPIAR LINK MAESTRO'}
        </button>
      </div>

      {/* CONFIGURACIÓN DE DATOS (SUPABASE Y DISCORD) */}
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 space-y-8 shadow-xl">
        <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          Terminal de Control de Datos
        </h4>
        
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Supabase Project URL</label>
              <input type="text" value={settings.supabaseUrl} onChange={e => setSettings({...settings, supabaseUrl: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-mono text-xs focus:border-emerald-500/50 outline-none" placeholder="https://xyz.supabase.co" />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Supabase API Key (Anon)</label>
              <input type="password" value={settings.supabaseKey} onChange={e => setSettings({...settings, supabaseKey: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-mono text-xs focus:border-emerald-500/50 outline-none" placeholder="eyJhbGci..." />
            </div>
          </div>

          <div className="space-y-4 border-t border-slate-800 pt-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-emerald-600 uppercase ml-2">Webhook: Registros de Daño (Canal 1)</label>
              <input type="text" value={settings.discordWebhook} onChange={e => setSettings({...settings, discordWebhook: e.target.value})} className="w-full bg-emerald-950/20 border border-emerald-900/30 rounded-2xl px-6 py-4 text-emerald-400 font-mono text-xs focus:border-emerald-400/50 outline-none" placeholder="URL para tickets individuales" />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-blue-500 uppercase ml-2">Webhook: Ranking Actualizado (Canal 2)</label>
              <input type="text" value={settings.discordRankingWebhook} onChange={e => setSettings({...settings, discordRankingWebhook: e.target.value})} className="w-full bg-blue-950/20 border border-blue-900/30 rounded-2xl px-6 py-4 text-blue-400 font-mono text-xs focus:border-blue-400/50 outline-none" placeholder="URL para el Ranking Global" />
            </div>
          </div>
        </div>

        <button onClick={handleSave} className="w-full wind-gradient text-emerald-950 py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all hover:brightness-110 active:scale-95 shadow-xl">
          {saved ? '✓ CONFIGURACIÓN SINCRONIZADA' : 'SINCRO CON LA NUBE'}
        </button>
      </div>

      {/* BOTÓN DE REINICIO PELIGROSO */}
      <div className="bg-rose-950/10 border border-rose-500/20 rounded-[2.5rem] p-10 text-center">
        <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest mb-4">¡CUIDADO! Esta acción no se puede deshacer.</p>
        <button onClick={async () => {
          if(confirm("¿Deseas BORRAR TODO el ranking de la temporada?")) { 
            setIsDeleting(true);
            await clearAllData(); 
            onReset?.(); 
            setIsDeleting(false);
          }
        }} className="bg-rose-600 hover:bg-rose-500 text-white px-12 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all">
          {isDeleting ? 'BORRANDO...' : 'REINICIAR TEMPORADA'}
        </button>
      </div>
    </div>
  );
};

export default Settings;
