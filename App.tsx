
import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import RankingTable from './components/RankingTable';
import AddDamageForm from './components/AddDamageForm';
import Settings from './components/Settings';
import { ViewMode, PlayerStats, DamageRecord, DiscordUser } from './types';
import { getPlayerStats, getRecords, isCloudConnected, checkAndPerformAutoReset, deleteRecord } from './services/dbService';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [stats, setStats] = useState<PlayerStats[]>([]);
  const [history, setHistory] = useState<DamageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [cloudStatus, setCloudStatus] = useState<'connected' | 'local'>('local');
  const [currentUser, setCurrentUser] = useState<DiscordUser | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const configData = params.get('setup');
    if (configData) {
      try {
        const decoded = atob(configData);
        localStorage.setItem('lamu_settings', decoded);
        window.history.replaceState({}, document.title, window.location.pathname);
        window.location.reload();
        return;
      } catch (e) {
        console.error("Link Maestro inválido");
      }
    }

    const checkDiscordAuth = async () => {
      const fragment = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = fragment.get('access_token');
      if (accessToken) {
        try {
          const res = await fetch('https://discord.com/api/users/@me', { 
            headers: { Authorization: `Bearer ${accessToken}` } 
          });
          if (res.ok) {
            const data = await res.json();
            const user = { 
              id: data.id, 
              username: data.username, 
              avatar: data.avatar ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png` : undefined 
            };
            setCurrentUser(user);
            localStorage.setItem('lamu_discord_user', JSON.stringify(user));
            window.location.hash = ''; 
          }
        } catch (e) {}
      } else {
        const saved = localStorage.getItem('lamu_discord_user');
        if (saved) setCurrentUser(JSON.parse(saved));
      }
    };

    checkDiscordAuth();
    refreshData();
  }, []);

  const refreshData = async () => {
    setIsLoading(true);
    const isConnected = await isCloudConnected();
    setCloudStatus(isConnected ? 'connected' : 'local');
    await checkAndPerformAutoReset();
    const [newStats, newHistory] = await Promise.all([getPlayerStats(), getRecords()]);
    setStats(newStats);
    setHistory(newHistory);
    setIsLoading(false);
  };

  const handleDeleteEntry = async (id: string) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este registro? Esto afectará al ranking.")) return;
    
    setIsDeletingId(id);
    try {
      await deleteRecord(id);
      await refreshData();
    } catch (e) {
      alert("Error al borrar el registro");
    } finally {
      setIsDeletingId(null);
    }
  };

  const loginWithDiscord = () => {
    const s = JSON.parse(localStorage.getItem('lamu_settings') || '{}');
    if (!s.discordClientId) return alert("Configuración incompleta: El admin debe poner el Discord Client ID en Ajustes.");
    const url = `https://discord.com/api/oauth2/authorize?client_id=${s.discordClientId}&redirect_uri=${encodeURIComponent(window.location.origin + window.location.pathname)}&response_type=token&scope=identify`;
    window.location.href = url;
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-200">
      <Navigation 
        activeView={activeView} 
        onViewChange={setActiveView} 
        currentUser={currentUser} 
        onLogin={loginWithDiscord} 
        onLogout={() => { localStorage.removeItem('lamu_discord_user'); setCurrentUser(null); }} 
      />
      
      <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto pb-32 md:pb-12">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* BANNER FESTIVO 2026 */}
          {activeView === ViewMode.DASHBOARD && (
            <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-amber-500/30 rounded-[3rem] p-10 text-center shadow-[0_0_40px_rgba(251,191,36,0.1)] group">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] pointer-events-none"></div>
              <div className="relative z-10">
                <span className="text-4xl block mb-2 animate-bounce">🎇</span>
                <h2 className="text-5xl md:text-6xl font-black golden-text uppercase tracking-tighter leading-none mb-2">¡Feliz 2026!</h2>
                <p className="text-amber-500/60 font-black text-[10px] uppercase tracking-[0.4em]">Temporada de Festejos • Gremio Lamu</p>
              </div>
              <div className="absolute -bottom-10 -right-10 text-8xl opacity-10 group-hover:rotate-12 transition-transform">🥂</div>
              <div className="absolute -top-10 -left-10 text-8xl opacity-10 group-hover:-rotate-12 transition-transform">🎉</div>
            </div>
          )}

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/50 pb-8">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tighter">Ranking Lamu</h1>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${cloudStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {cloudStatus === 'connected' ? 'Sincronizado' : 'Configuración Pendiente'}
                </span>
              </div>
            </div>
            
            <button 
              onClick={refreshData}
              className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all active:scale-95 text-xl"
            >
              {isLoading ? '⌛' : '🔄'}
            </button>
          </div>

          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
              <p className="text-[10px] font-black text-amber-500/50 uppercase tracking-widest">Cargando ambiente festivo...</p>
            </div>
          ) : (
            <div className="animate-in fade-in duration-500">
              {activeView === ViewMode.DASHBOARD && <RankingTable stats={stats} />}
              
              {activeView === ViewMode.ADD_ENTRY && (
                <AddDamageForm 
                  currentUser={currentUser} 
                  onLoginRequest={loginWithDiscord} 
                  onSuccess={() => { refreshData(); setActiveView(ViewMode.DASHBOARD); }} 
                />
              )}
              
              {activeView === ViewMode.HISTORY && (
                <div className="grid gap-4">
                  {history.length > 0 ? (
                    <div className="space-y-4">
                      {isAdminAuthenticated && (
                        <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-2 px-4">
                          MODO ADMINISTRADOR: Gestión de registros festivos activa.
                        </p>
                      )}
                      {history.map(r => (
                        <div key={r.id} className="bg-slate-900/50 p-5 rounded-3xl flex items-center justify-between border border-slate-800/50 group hover:border-amber-500/20 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <img src={r.screenshotUrl || 'https://via.placeholder.com/100'} className="w-14 h-14 rounded-xl object-cover border border-slate-800" />
                              <span className={`absolute -top-2 -right-2 px-2 py-0.5 rounded text-[8px] font-black uppercase ${r.recordType === 'INITIAL' ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' : 'bg-emerald-600 text-white'}`}>
                                {r.recordType === 'INITIAL' ? 'INI' : 'TKT'}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-bold text-white text-sm">{r.playerName}</h4>
                              <p className="text-[9px] text-slate-500 font-bold uppercase">
                                {new Date(r.timestamp).toLocaleDateString()} {new Date(r.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <span className="block font-mono font-black text-amber-400 text-lg leading-none">{r.ticketDamage.toLocaleString()}</span>
                              <span className="text-[8px] text-slate-600 font-black uppercase tracking-tighter">Daño Ticket</span>
                            </div>
                            
                            {isAdminAuthenticated && (
                              <button 
                                onClick={() => handleDeleteEntry(r.id)}
                                disabled={isDeletingId === r.id}
                                className="p-3 bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white rounded-xl transition-all border border-rose-500/20"
                              >
                                {isDeletingId === r.id ? '...' : '🗑️'}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 text-center text-slate-600 font-black uppercase text-[10px] tracking-widest">Sin registros este año</div>
                  )}
                </div>
              )}
              
              {activeView === ViewMode.SETTINGS && (
                !isAdminAuthenticated ? (
                  <div className="max-w-md mx-auto mt-10 p-10 bg-slate-900 border border-amber-500/20 rounded-[3rem] text-center space-y-6">
                    <h2 className="text-xl font-black text-white uppercase">Acceso Admin</h2>
                    <input 
                      type="password" 
                      value={adminPasswordInput} 
                      onChange={(e) => setAdminPasswordInput(e.target.value)} 
                      placeholder="Contraseña" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-center text-white outline-none focus:border-amber-500/50 transition-all" 
                    />
                    <button 
                      onClick={() => { 
                        const s = JSON.parse(localStorage.getItem('lamu_settings') || '{}');
                        if (adminPasswordInput === (s.adminPassword || 'admin123')) {
                          setIsAdminAuthenticated(true);
                        } else {
                          alert("Contraseña incorrecta");
                        }
                      }} 
                      className="w-full bg-amber-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-amber-600/20 hover:bg-amber-500 transition-colors"
                    >
                      Identificar Admin
                    </button>
                  </div>
                ) : <Settings onReset={refreshData} />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
