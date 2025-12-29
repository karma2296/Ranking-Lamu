

import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import RankingTable from './components/RankingTable';
import AddDamageForm from './components/AddDamageForm';
import Settings from './components/Settings';
import { ViewMode, PlayerStats, DamageRecord, AppSettings, DiscordUser } from './types';
import { getPlayerStats, getRecords, deleteRecord, checkAndPerformAutoReset, isCloudConnected } from './services/dbService';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [stats, setStats] = useState<PlayerStats[]>([]);
  const [history, setHistory] = useState<DamageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [cloudStatus, setCloudStatus] = useState<'connected' | 'local'>('local');
  const [currentUser, setCurrentUser] = useState<DiscordUser | null>(null);
  
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);

  // Manejo de Sesión de Discord
  useEffect(() => {
    const checkDiscordAuth = async () => {
      const fragment = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = fragment.get('access_token');
      
      if (accessToken) {
        try {
          const response = await fetch('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          const userData = await response.json();
          const user: DiscordUser = {
            id: userData.id,
            username: userData.username,
            avatar: userData.avatar ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png` : undefined
          };
          setCurrentUser(user);
          localStorage.setItem('lamu_discord_user', JSON.stringify(user));
          window.location.hash = ''; // Limpiar token de la URL
        } catch (e) {
          console.error("Error autenticando con Discord", e);
        }
      } else {
        const savedUser = localStorage.getItem('lamu_discord_user');
        if (savedUser) setCurrentUser(JSON.parse(savedUser));
      }
    };

    checkDiscordAuth();

    // Sincronización automática vía URL (Gremio)
    const hash = window.location.hash;
    if (hash.startsWith('#setup=')) {
      try {
        const configData = atob(hash.replace('#setup=', ''));
        const parsedConfig = JSON.parse(configData);
        localStorage.removeItem('lamu_guild_records_cloud_v4');
        localStorage.setItem('lamu_settings', JSON.stringify(parsedConfig));
        if (parsedConfig.discordWebhook) {
          localStorage.setItem('lamu_discord_webhook', parsedConfig.discordWebhook);
        }
        setSyncMessage("🛡️ ¡Gremio sincronizado! Conectando...");
        window.location.hash = '';
        setTimeout(() => { setSyncMessage(null); refreshData(); }, 3000);
      } catch (e) { console.error(e); }
    }
  }, []);

  const loginWithDiscord = () => {
    const settingsStr = localStorage.getItem('lamu_settings');
    if (!settingsStr) {
      alert("Primero configura el Gremio en Ajustes.");
      return;
    }
    const settings = JSON.parse(settingsStr);
    if (!settings.discordClientId) {
      alert("Falta configurar el Discord Client ID en Ajustes.");
      return;
    }
    
    const clientId = settings.discordClientId;
    const redirectUri = encodeURIComponent(window.location.origin + window.location.pathname);
    const scope = encodeURIComponent('identify');
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}`;
    
    window.location.href = authUrl;
  };

  const logoutDiscord = () => {
    localStorage.removeItem('lamu_discord_user');
    setCurrentUser(null);
  };

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const isConnected = await isCloudConnected();
      setCloudStatus(isConnected ? 'connected' : 'local');
      await checkAndPerformAutoReset();
      const [newStats, newHistory] = await Promise.all([getPlayerStats(), getRecords()]);
      setStats(newStats);
      setHistory(newHistory.sort((a, b) => b.timestamp - a.timestamp));
    } catch (e) {
      setCloudStatus('local');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 120000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (id: string) => {
    if (!isAdminAuthenticated) {
      alert("Solo un administrador puede borrar registros.");
      setActiveView(ViewMode.SETTINGS);
      return;
    }
    if (confirm('¿Deseas eliminar este registro?')) {
      await deleteRecord(id);
      refreshData();
    }
  };

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    const settingsStr = localStorage.getItem('lamu_settings');
    let masterPass = 'admin123';
    if (settingsStr) {
      try {
        const settings = JSON.parse(settingsStr);
        if (settings.adminPassword) masterPass = settings.adminPassword;
      } catch (err) { masterPass = 'admin123'; }
    }
    if (adminPasswordInput === masterPass) {
      setIsAdminAuthenticated(true);
      setAuthError(false);
      setAdminPasswordInput('');
    } else {
      setAuthError(true);
      setTimeout(() => setAuthError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950">
      <Navigation 
        activeView={activeView} 
        onViewChange={setActiveView} 
        currentUser={currentUser}
        onLogin={loginWithDiscord}
        onLogout={logoutDiscord}
      />
      <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {syncMessage ? (
            <div className="flex flex-col items-center justify-center h-64 text-center animate-bounce">
              <span className="text-5xl mb-4">✨</span>
              <p className="text-emerald-400 font-black uppercase tracking-widest">{syncMessage}</p>
            </div>
          ) : isLoading && activeView !== ViewMode.SETTINGS ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-500 font-medium animate-pulse">Consultando datos del gremio...</p>
            </div>
          ) : (
            <>
              {activeView === ViewMode.DASHBOARD && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                      <h2 className="text-3xl font-bold text-white tracking-tight">Ranking Lamu</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`w-2 h-2 rounded-full ${cloudStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${cloudStatus === 'connected' ? 'text-emerald-500' : 'text-red-500'}`}>
                          {cloudStatus === 'connected' ? 'Cloud Sync Online' : 'Cloud Sync Offline'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button onClick={refreshData} className="p-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-indigo-400">🔄</button>
                      <div className="bg-slate-900 px-5 py-3 rounded-2xl border border-slate-800 text-center min-w-[150px] shadow-xl">
                        <span className="text-[10px] text-slate-500 block uppercase font-black tracking-tighter mb-1">Máximo Semanal</span>
                        <span className="text-2xl font-black text-emerald-400 font-mono">
                          {stats.length > 0 ? stats[0].maxDamage.toLocaleString() : '0'}
                        </span>
                      </div>
                    </div>
                  </header>
                  <RankingTable stats={stats} />
                </div>
              )}
              {activeView === ViewMode.ADD_ENTRY && (
                <AddDamageForm currentUser={currentUser} onSuccess={() => { refreshData(); setActiveView(ViewMode.DASHBOARD); }} />
              )}
              {activeView === ViewMode.HISTORY && (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <header className="mb-8">
                    <h2 className="text-3xl font-bold text-white">Últimos Ataques</h2>
                    <p className="text-slate-400 text-sm">Historial compartido del gremio</p>
                  </header>
                  <div className="grid grid-cols-1 gap-4 pb-24">
                    {history.length > 0 ? history.map((record) => (
                      <div key={record.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between hover:border-indigo-500/30 transition-all group">
                        <div className="flex items-center gap-4">
                          {record.discordUser?.avatar ? (
                            <img src={record.discordUser.avatar} className="w-12 h-12 rounded-xl border border-slate-800" alt="Avatar" />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center text-xl border border-slate-800">⚔️</div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-100">{record.playerName}</h4>
                              <span className="text-[8px] text-slate-500">por {record.discordUser?.username || 'Invitado'}</span>
                              <span className={`text-[8px] px-1.5 py-0.5 rounded font-black border ${record.guild === 'Principal' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                                {record.guild === 'Principal' ? 'L I' : 'L II'}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">{new Date(record.timestamp).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <span className="text-emerald-400 font-mono font-black text-xl">{record.damageValue.toLocaleString()}</span>
                          <button onClick={() => handleDelete(record.id)} className="text-slate-700 hover:text-red-500 transition-colors p-2">🗑️</button>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-20 text-slate-700 uppercase text-xs font-black tracking-[0.3em] opacity-30">No hay registros compartidos</div>
                    )}
                  </div>
                </div>
              )}
              {activeView === ViewMode.SETTINGS && (
                !isAdminAuthenticated ? (
                  <div className="max-w-md mx-auto mt-20 p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-center space-y-8 animate-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto text-4xl border border-amber-500/30">🔐</div>
                    <div>
                      <h2 className="text-xl font-black text-white uppercase tracking-widest">Panel Administrativo</h2>
                      <p className="text-slate-500 text-xs mt-2">Ingresa la contraseña para configurar el gremio.</p>
                    </div>
                    <form onSubmit={handleAdminAuth} className="space-y-4">
                      <input type="password" autoFocus value={adminPasswordInput} onChange={(e) => setAdminPasswordInput(e.target.value)} placeholder="Contraseña..." className={`w-full bg-slate-950 border ${authError ? 'border-red-500 animate-shake' : 'border-slate-800'} rounded-2xl px-6 py-4 text-center font-black tracking-[0.5em] text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all`} />
                      <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg active:scale-95 uppercase text-xs tracking-widest">Acceder</button>
                    </form>
                  </div>
                ) : (
                  <Settings onReset={refreshData} />
                )
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
