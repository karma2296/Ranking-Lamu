
import React, { useState } from 'react';
import { AppSettings, PlayerStats } from '../types';
import { clearAllData, updateInitialDamage } from '../services/dbService';

interface SettingsProps {
  stats?: PlayerStats[];
  onReset?: () => void;
}

const Settings: React.FC<SettingsProps> = ({ stats = [], onReset }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('lamu_settings');
    const defaultSettings: AppSettings = {
      discordWebhook: '', 
      discordRankingWebhook: '',
      customAppUrl: '',
      supabaseUrl: '', 
      supabaseKey: '', 
      guildName: 'Locked \'N\' Loaded', 
      adminPassword: '', 
      discordClientId: ''
    };
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaultSettings, ...parsed };
      } catch (e) {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });
  
  const [saved, setSaved] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  
  // Estados para el ajuste manual de miembros
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [manualBaseScore, setManualBaseScore] = useState('');
  const [isUpdatingMember, setIsUpdatingMember] = useState(false);

  const handleSave = () => {
    const jsonString = JSON.stringify(settings);
    localStorage.setItem('lamu_settings', jsonString);
    setSaved(true);
    if (onReset) onReset();
    setTimeout(() => setSaved(false), 2500);
  };

  const handleManualUpdate = async () => {
    if (!selectedMemberId || !manualBaseScore) return alert("Selecciona un miembro y define el nuevo score.");
    
    const score = parseInt(manualBaseScore.replace(/\D/g, ''));
    if (isNaN(score)) return alert("Score no válido.");

    setIsUpdatingMember(true);
    try {
      await updateInitialDamage(selectedMemberId, score);
      alert("✓ Score base actualizado correctamente.");
      setManualBaseScore('');
      setSelectedMemberId('');
      if (onReset) onReset();
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setIsUpdatingMember(false);
    }
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
      <div className="bg-sky-950/20 border border-sky-500/30 rounded-[2rem] p-6 shadow-xl backdrop-blur-sm">
        <h3 className="text-[10px] font-black text-sky-500 uppercase tracking-[0.3em] mb-4 text-center">Sincronización de Dispositivos: Blue Mesh</h3>
        <button 
          onClick={generateMaestroLink} 
          className={`w-full py-4 rounded-xl font-black uppercase text-[10px] tracking-[0.3em] transition-all shadow-lg ${copiedLink ? 'bg-sky-400 text-sky-950 shadow-[0_0_20px_#0ea5e9]' : 'bg-indigo-600/80 text-white hover:bg-indigo-600'}`}
        >
          {copiedLink ? '✓ ENLACE DE CONFIGURACIÓN COPIADO' : 'COPIAR LINK MAESTRO'}
        </button>
      </div>

      {/* AJUSTE MANUAL DE MIEMBROS */}
      <div className="bg-[#050b18]/95 border-2 border-sky-400/20 rounded-[2.5rem] p-8 md:p-12 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-2 h-2 bg-sky-400 rounded-full shadow-[0_0_10px_#0ea5e9]"></div>
          <h4 className="text-xl font-black text-white ado-title italic">Gestión de Vocalistas</h4>
        </div>

        <div className="grid md:grid-cols-2 gap-6 items-end">
          <div className="space-y-3">
            <label className="text-[9px] font-black text-sky-700 uppercase tracking-widest ml-1">Seleccionar Miembro</label>
            <select 
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full bg-[#0a1224] border border-sky-900/40 rounded-2xl px-6 py-4 text-sky-300 font-bold text-xs outline-none focus:border-sky-400/50 appearance-none"
            >
              <option value="">-- ELIGE UN VOCALISTA --</option>
              {stats.map(p => (
                <option key={p.discordUser?.id} value={p.discordUser?.id}>
                  {p.playerName} ({p.accumulatedTotal.toLocaleString()})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-3">
            <label className="text-[9px] font-black text-sky-700 uppercase tracking-widest ml-1">Nuevo Daño Base (INITIAL)</label>
            <div className="flex gap-3">
              <input 
                type="text" 
                value={manualBaseScore}
                onChange={(e) => setManualBaseScore(e.target.value)}
                placeholder="NUEVO VALOR"
                className="flex-1 bg-[#0a1224] border border-sky-900/40 rounded-2xl px-6 py-4 text-white font-mono text-xs focus:border-sky-400/50 outline-none transition-all"
              />
              <button 
                onClick={handleManualUpdate}
                disabled={isUpdatingMember || !selectedMemberId}
                className="bg-sky-600 hover:bg-sky-500 disabled:bg-sky-900 disabled:opacity-30 text-sky-950 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
              >
                {isUpdatingMember ? '...' : 'CORREGIR'}
              </button>
            </div>
          </div>
        </div>
        <p className="text-[8px] text-sky-900 font-bold uppercase tracking-widest mt-4 text-center italic">
          * Esto cambiará permanentemente el registro de "Daño Base" de la temporada para este usuario.
        </p>
      </div>

      {/* TERMINAL PRINCIPAL */}
      <div className="bg-[#050b18]/95 border border-sky-900/30 rounded-[2.5rem] p-8 md:p-12 shadow-2xl backdrop-blur-md relative overflow-hidden">
        
        <div className="flex items-center gap-3 mb-10">
          <div className="w-2 h-2 bg-sky-400 rounded-full animate-pulse shadow-[0_0_10px_#0ea5e9]"></div>
          <h4 className="text-[10px] font-black text-sky-400 uppercase tracking-[0.4em]">Mesa de Mezclas de Webhooks</h4>
        </div>
        
        <div className="space-y-8">
          
          {/* ACCESOS */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[9px] font-black text-sky-800 uppercase tracking-widest ml-1">Discord Client ID</label>
              <input 
                type="text" 
                value={settings.discordClientId || ''} 
                onChange={e => setSettings(prev => ({...prev, discordClientId: e.target.value}))} 
                className="w-full bg-[#0a1224] border border-sky-900/30 rounded-2xl px-6 py-5 text-white font-mono text-xs focus:border-sky-500/50 outline-none transition-all" 
                placeholder="ID de la App de Discord"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[9px] font-black text-sky-800 uppercase tracking-widest ml-1">Admin Password</label>
              <input 
                type="text" 
                value={settings.adminPassword || ''} 
                onChange={e => setSettings(prev => ({...prev, adminPassword: e.target.value}))} 
                className="w-full bg-[#0a1224] border border-sky-900/30 rounded-2xl px-6 py-5 text-white font-mono text-xs focus:border-sky-500/50 outline-none transition-all" 
                placeholder="Password de Administrador"
              />
            </div>
          </div>

          {/* WEBHOOKS Y URL MANUAL */}
          <div className="space-y-6 pt-4 border-t border-sky-900/30">
            <div className="space-y-3">
              <label className="text-[9px] font-black text-sky-400 uppercase tracking-widest ml-1">Webhook: Performance Logs (Canal 1)</label>
              <input 
                type="text" 
                value={settings.discordWebhook || ''} 
                onChange={e => setSettings(prev => ({...prev, discordWebhook: e.target.value}))} 
                className="w-full bg-[#0a1224] border border-sky-900/40 rounded-2xl px-6 py-5 text-sky-300 font-mono text-xs focus:border-sky-400/50 outline-none transition-all" 
                placeholder="https://discord.com/api/webhooks/..."
              />
            </div>
            <div className="space-y-3">
              <label className="text-[9px] font-black text-blue-500 uppercase tracking-widest ml-1">Webhook: Charts Globales (Canal 2)</label>
              <input 
                type="text" 
                value={settings.discordRankingWebhook || ''} 
                onChange={e => setSettings(prev => ({...prev, discordRankingWebhook: e.target.value}))} 
                className="w-full bg-[#0a1224] border border-blue-500/20 rounded-2xl px-6 py-5 text-blue-400 font-mono text-xs focus:border-blue-500/50 outline-none transition-all" 
                placeholder="https://discord.com/api/webhooks/..."
              />
            </div>
            <div className="space-y-3 pt-2">
              <label className="text-[9px] font-black text-sky-300 uppercase tracking-widest ml-1">URL Destino del Botón "Ver Charts"</label>
              <input 
                type="text" 
                value={settings.customAppUrl || ''} 
                onChange={e => setSettings(prev => ({...prev, customAppUrl: e.target.value}))} 
                className="w-full bg-[#0a1224] border border-sky-500/40 rounded-2xl px-6 py-5 text-sky-100 font-mono text-xs focus:border-sky-400 outline-none transition-all" 
                placeholder="https://tu-pagina-web.com (Opcional)"
              />
              <p className="text-[8px] text-sky-900 uppercase font-bold tracking-widest ml-1 italic">Si se deja vacío, se usará el link actual de esta página.</p>
            </div>
          </div>

          {/* SUPABASE */}
          <div className="grid md:grid-cols-2 gap-8 pt-4 border-t border-sky-900/30">
            <div className="space-y-3">
              <label className="text-[9px] font-black text-sky-900 uppercase tracking-widest ml-1">Frecuencia URL (Supabase)</label>
              <input 
                type="text" 
                value={settings.supabaseUrl || ''} 
                onChange={e => setSettings(prev => ({...prev, supabaseUrl: e.target.value}))} 
                className="w-full bg-[#0a1224] border border-sky-900/30 rounded-2xl px-6 py-4 text-white font-mono text-[10px]" 
                placeholder="URL de Supabase"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[9px] font-black text-sky-900 uppercase tracking-widest ml-1">Master Key (Anon Key)</label>
              <input 
                type="password" 
                value={settings.supabaseKey || ''} 
                onChange={e => setSettings(prev => ({...prev, supabaseKey: e.target.value}))} 
                className="w-full bg-[#0a1224] border border-sky-900/30 rounded-2xl px-6 py-4 text-white font-mono text-[10px]" 
                placeholder="Clave API"
              />
            </div>
          </div>

          <button 
            onClick={handleSave} 
            className={`w-full py-6 rounded-2xl font-black uppercase text-xs tracking-[0.5em] transition-all shadow-2xl active:scale-95 mt-6 ${saved ? 'bg-sky-400 text-sky-950 scale-[0.98]' : 'bg-sky-600 hover:bg-sky-500 text-sky-950'}`}
          >
            {saved ? '✓ FRECUENCIAS SINCRONIZADAS' : 'SINCRO CON EL SERVIDOR'}
          </button>
        </div>
      </div>

      <div className="pt-4 text-center">
        <button 
          onClick={async () => { if(confirm("¿RESET TOTAL DE LA TEMPORADA?")) { await clearAllData(); onReset?.(); } }} 
          className="text-rose-600/40 hover:text-rose-500 text-[9px] font-black uppercase tracking-[0.4em] transition-colors"
        >
          BORRAR ARCHIVOS DE TEMPORADA (RESET)
        </button>
      </div>
    </div>
  );
};

export default Settings;
