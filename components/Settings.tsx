
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
    supabaseUrl: '', 
    supabaseKey: '', 
    guildName: 'Lamu', 
    adminPassword: '', 
    discordClientId: ''
  });
  const [saved, setSaved] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estados para corrección de daño
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [newBaseDamage, setNewBaseDamage] = useState('');
  const [isUpdatingDamage, setIsUpdatingDamage] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem('lamu_settings');
    if (s) setSettings(JSON.parse(s));
  }, []);

  const handleSave = () => {
    localStorage.setItem('lamu_settings', JSON.stringify(settings));
    setSaved(true);
    if (onReset) onReset();
    setTimeout(() => setSaved(false), 2000);
  };

  const handleResetRanking = async () => {
    const confirm = window.confirm("⚠️ ¿ESTÁS SEGURO? Esto borrará permanentemente TODOS los registros de daño y reiniciará el ranking de la temporada.");
    if (!confirm) return;

    setIsDeleting(true);
    try {
      await clearAllData();
      alert("Ranking reiniciado con éxito.");
      if (onReset) onReset();
    } catch (e) {
      alert("Error al borrar datos.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateDamage = async () => {
    if (!selectedPlayerId || !newBaseDamage) return alert("Selecciona un jugador e ingresa el nuevo daño base.");
    
    setIsUpdatingDamage(true);
    try {
      const damage = parseInt(newBaseDamage.replace(/\D/g, ''));
      await updateInitialDamage(selectedPlayerId, damage);
      alert("✓ Daño base actualizado correctamente.");
      setSelectedPlayerId('');
      setNewBaseDamage('');
      if (onReset) onReset();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsUpdatingDamage(false);
    }
  };

  const generateMaestroLink = () => {
    const configString = JSON.stringify(settings);
    const encoded = btoa(configString);
    const fullUrl = `${window.location.origin}${window.location.pathname}?setup=${encoded}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* SECCIÓN COMPARTIR */}
      <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/30 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 text-6xl group-hover:scale-110 transition-transform">🚀</div>
        <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Compartir Gremio</h3>
        <p className="text-slate-400 text-sm mb-8 max-w-md">Enlace para que otros miembros se configuren automáticamente.</p>
        
        <button 
          onClick={generateMaestroLink}
          className={`flex items-center gap-3 px-8 py-5 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 ${
            copiedLink ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/20'
          }`}
        >
          {copiedLink ? '✓ LINK COPIADO AL PORTAPAPELES' : 'GENERAR LINK MAESTRO'}
        </button>
      </div>

      {/* GESTIÓN DE GUERREROS (NUEVA SECCIÓN) */}
      <div className="bg-slate-900 border border-amber-500/20 rounded-[2.5rem] p-10 space-y-8 shadow-xl">
        <div>
          <h3 className="text-xl font-black text-amber-400 uppercase tracking-tighter flex items-center gap-3">
            <span>🛡️</span> Gestión de Guerreros
          </h3>
          <p className="text-slate-500 text-xs mt-1">Corrige el Daño Base (INITIAL) de un usuario si hubo errores u olvidos.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Seleccionar Guerrero</label>
            <select 
              value={selectedPlayerId} 
              onChange={e => setSelectedPlayerId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white appearance-none cursor-pointer focus:border-amber-500/50 outline-none"
            >
              <option value="">Elegir de la lista...</option>
              {stats.map(p => (
                <option key={p.discordUser?.id} value={p.discordUser?.id}>
                  {p.playerName} ({p.guild})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Nuevo Daño Base (INITIAL)</label>
            <input 
              type="text" 
              value={newBaseDamage} 
              onChange={e => setNewBaseDamage(e.target.value)}
              placeholder="Ej: 450000000"
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-amber-400 font-mono font-black placeholder:text-slate-800 focus:border-amber-500/50 outline-none"
            />
          </div>
        </div>

        <button 
          onClick={handleUpdateDamage}
          disabled={isUpdatingDamage || !selectedPlayerId}
          className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all shadow-xl disabled:opacity-20"
        >
          {isUpdatingDamage ? 'Sincronizando...' : 'CORREGIR DAÑO BASE'}
        </button>
      </div>

      {/* CONFIGURACIÓN TÉCNICA */}
      <div className="grid gap-6">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-4">Configuración de Base de Datos y Discord</h4>
        <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8 space-y-6 backdrop-blur-sm">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-600 uppercase ml-2">Discord Client ID</label>
              <input type="text" value={settings.discordClientId} onChange={e => setSettings({...settings, discordClientId: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-mono text-sm" placeholder="ID de la App de Discord" />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-600 uppercase ml-2">Contraseña Admin</label>
              <input type="text" value={settings.adminPassword} onChange={e => setSettings({...settings, adminPassword: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-mono text-sm" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-600 uppercase ml-2">Discord Webhook URL</label>
            <input type="text" value={settings.discordWebhook} onChange={e => setSettings({...settings, discordWebhook: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-mono text-xs" placeholder="https://discord.com/api/webhooks/..." />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-600 uppercase ml-2">Supabase URL</label>
            <input type="text" value={settings.supabaseUrl} onChange={e => setSettings({...settings, supabaseUrl: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-mono text-xs" />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-600 uppercase ml-2">Supabase Key</label>
            <input type="password" value={settings.supabaseKey} onChange={e => setSettings({...settings, supabaseKey: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-mono text-xs" />
          </div>

          <button onClick={handleSave} className="w-full bg-slate-100 hover:bg-white text-slate-950 py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all shadow-xl">
            {saved ? '✓ CAMBIOS GUARDADOS' : 'GUARDAR CONFIGURACIÓN'}
          </button>
        </div>
      </div>

      {/* ZONA DE PELIGRO */}
      <div className="bg-rose-950/20 border border-rose-500/20 rounded-[2.5rem] p-10 space-y-6">
        <div className="flex items-center gap-4">
          <span className="text-3xl">⚠️</span>
          <div>
            <h3 className="text-xl font-black text-rose-500 uppercase">Zona de Peligro</h3>
            <p className="text-rose-500/60 text-xs">Acciones irreversibles para la gestión del gremio.</p>
          </div>
        </div>

        <div className="bg-rose-500/5 p-6 rounded-3xl border border-rose-500/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <p className="text-white font-bold text-sm">Reiniciar Temporada de Daño</p>
            <p className="text-slate-500 text-[10px]">Borra todos los registros actuales de la tabla y limpia el ranking.</p>
          </div>
          <button 
            onClick={handleResetRanking}
            disabled={isDeleting}
            className="w-full md:w-auto bg-rose-600 hover:bg-rose-500 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 disabled:opacity-50"
          >
            {isDeleting ? 'BORRANDO...' : 'REINICIAR RANKING'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
