
import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import RankingTable from './components/RankingTable';
import AddDamageForm from './components/AddDamageForm';
import Settings from './components/Settings';
import { ViewMode, PlayerStats, DamageRecord, DiscordUser } from './types';
import { getPlayerStats, getRecords, deleteRecord, checkAndPerformAutoReset, isCloudConnected } from './services/dbService';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [stats, setStats] = useState<PlayerStats[]>([]);
  const [history, setHistory] = useState<DamageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [cloudStatus, setCloudStatus] = useState<'connected' | 'local'>('local');
  const [currentUser, setCurrentUser] = useState<DiscordUser | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    const checkDiscordAuth = async () => {
      const fragment = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = fragment.get('access_token');
      
      if (accessToken) {
        try {
          const response = await fetch('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          if (response.ok) {
            const userData = await response.json();
            const user: DiscordUser = {
              id: userData.id,
              username: userData.username,
              avatar: userData.avatar ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png` : undefined
            };
            setCurrentUser(user);
            localStorage.setItem('lamu_discord_user', JSON.stringify(user));
            window.location.hash = ''; 
          }
        } catch (e) {
          console.error("Error autenticando con Discord", e);
        }
      } else {
        const savedUser = localStorage.getItem('lamu_discord_user');
        if (savedUser) {
          try {
            setCurrentUser(JSON.parse(savedUser));
          } catch(e) {
            localStorage.removeItem('lamu_discord_user');
          }
        }
      }
    };

    checkDiscordAuth();

    const hash = window.location.hash;
    if (hash.startsWith('#setup=')) {
      try {
        const configData = atob(hash.replace('#setup=', ''));
        const parsedConfig = JSON.parse(configData);
        localStorage.setItem('lamu_settings', JSON.stringify(parsedConfig));
        setSyncMessage("🛡️ ¡Gremio sincronizado!");
        window.location.hash = '';
        setTimeout(() => { setSyncMessage(null); refreshData(); }, 3000);
      } catch (e) { console.error(e); }
    }
  }, []);

  const loginWithDiscord = () => {
    const settingsStr = localStorage.getItem('lamu_settings');
    if (!settingsStr) {
      alert("Configura el Gremio en Ajustes primero.");
      return;
    }
    const settings = JSON.parse(settingsStr);
    if (!settings.discordClientId) {
      alert("Configura el Discord Client ID en Ajustes.");
      return;
    }
    
    const clientId = settings.discordClientId;
    const redirectUri = encodeURIComponent(window.location.origin + window.location.pathname);
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=identify`;
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
      alert("Se requiere contraseña de Admin.");
      return;
    }
    if (confirm('¿Eliminar registro?')) {
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
        masterPass = settings.adminPassword || 'admin123';
      } catch (err) {}
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
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <span className="text-5xl mb-4">✨</span>
              <p className="text-emerald-400 font-black uppercase tracking-widest">{syncMessage}</p>
            </div>
          ) : isLoading && activeView !== ViewMode.SETTINGS ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-500 font-medium">Cargando datos...</p>
            </div>
          ) : (
            <>
              {activeView === ViewMode.DASHBOARD && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                      <h2 className="text-3xl font-bold text-white tracking-tight">Ranking Lamu</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`w-2 h-2 rounded-full ${cloudStatus === 'connected' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${cloudStatus === 'connected' ? 'text-emerald-500' : 'text-red-500'}`}>
                          {cloudStatus === 'connected' ? 'Base de datos en línea' : 'Modo fuera de línea'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button onClick={refreshData} className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors">🔄</button>
                      <div className="bg-slate-900 px-5 py-3 rounded-2xl border border-slate-800 text-center min-w-[150px] shadow-xl">
                        <span className="text-[10px] text-slate-500 block uppercase font-black mb-1">MVP de la semana</span>
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
                <AddDamageForm 
                  currentUser={currentUser} 
                  onSuccess={() => { refreshData(); setActiveView(ViewMode.DASHBOARD); }} 
                  onLoginRequest={loginWithDiscord}
                />
              )}
              {activeView === ViewMode.HISTORY && (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <h2 className="text-3xl font-bold text-white">Historial de Reportes</h2>
                  <div className="grid grid-cols-1 gap-4 pb-24">
                    {history.length > 0 ? history.map((record) => (
                      <div key={record.id} className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 group">
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          {record.screenshotUrl ? (
                            <button onClick={() => setFullscreenImage(record.screenshotUrl || null)} className="relative shrink-0">
                                <img src={record.screenshotUrl} className="w-16 h-16 rounded-2xl object-cover border border-slate-700 group-hover:border-indigo-500 transition-colors shadow-lg" alt="Cap" />
                                <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                                    <span className="text-[8px] text-white font-black uppercase">Ver</span>
                                </div>
                            </button>
                          ) : (
                            <div className="w-16 h-16 rounded-2xl bg-slate-950 flex items-center justify-center border border-slate-800 text-xl">⚔️</div>
                          )}
                          <div className="overflow-hidden">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-100 truncate">{record.playerName}</h4>
                              <span className="text-[8px] text-slate-500 font-bold px-1.5 py-0.5 bg-slate-950 rounded border border-slate-800">{record.guild === 'Principal' ? 'DIV I' : 'DIV II'}</span>
                            </div>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1">
                                <span>@{record.discordUser?.username || 'desconocido'}</span>
                                <span className="text-slate-700">•</span>
                                <span>{new Date(record.timestamp).toLocaleDateString()} {new Date(record.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between w-full sm:w-auto gap-6 sm:pl-4">
                          <span className="text-emerald-400 font-mono font-black text-2xl tracking-tight">{record.damageValue.toLocaleString()}</span>
                          <button onClick={() => handleDelete(record.id)} className="bg-red-500/5 hover:bg-red-500/20 text-slate-700 hover:text-red-500 p-3 rounded-xl transition-all border border-transparent hover:border-red-500/20">🗑️</button>
                        </div>
                      </div>
                    )) : (
                        <div className="py-20 text-center text-slate-600 font-black uppercase tracking-widest text-xs opacity-20">No hay registros previos</div>
                    )}
                  </div>
                </div>
              )}
              {activeView === ViewMode.SETTINGS && (
                !isAdminAuthenticated ? (
                  <div className="max-w-md mx-auto mt-20 p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-8 shadow-2xl">
                    <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto text-4xl border border-amber-500/30">🔐</div>
                    <form onSubmit={handleAdminAuth} className="space-y-4">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Ingrese contraseña de administrador para configurar o borrar datos</p>
                      <input type="password" autoFocus value={adminPasswordInput} onChange={(e) => setAdminPasswordInput(e.target.value)} placeholder="••••" className={`w-full bg-slate-950 border ${authError ? 'border-red-500' : 'border-slate-800'} rounded-2xl px-6 py-4 text-center text-white outline-none focus:border-indigo-500 transition-all font-mono text-2xl`} />
                      <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl uppercase text-xs tracking-[0.2em] shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">Desbloquear Panel</button>
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

      {/* MODAL PARA IMAGEN EN PANTALLA COMPLETA */}
      {fullscreenImage && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 flex items-center justify-center p-4 md:p-12 animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setFullscreenImage(null)} className="absolute top-6 right-6 text-slate-400 hover:text-white text-4xl z-10 p-2">✕</button>
            <img src={fullscreenImage} className="max-w-full max-h-full rounded-2xl shadow-2xl border border-white/5 object-contain" alt="Full view" />
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-black/50 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-black text-white uppercase tracking-widest">Vista de Captura</div>
        </div>
      )}
    </div>
  );
};

export default App;
