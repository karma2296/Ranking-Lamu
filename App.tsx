import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import RankingTable from './components/RankingTable';
import AddDamageForm from './components/AddDamageForm';
import Settings from './components/Settings';
import { ViewMode, PlayerStats, DamageRecord, DiscordUser } from './types';
import { getPlayerStats, getRecords, isCloudConnected, checkAndPerformAutoReset, deleteRecord, getRecordScreenshot } from './services/dbService';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [stats, setStats] = useState<PlayerStats[]>([]);
  const [history, setHistory] = useState<DamageRecord[]>([]);
  const [loadedScreenshots, setLoadedScreenshots] = useState<Record<string, string>>({});
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

  const handleLoadImage = async (id: string) => {
    if (loadedScreenshots[id]) return;
    const img = await getRecordScreenshot(id);
    if (img) {
      setLoadedScreenshots(prev => ({ ...prev, [id]: img }));
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este registro?")) return;
    
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
    if (!s.discordClientId) return alert("Falta Discord Client ID.");
    const url = `https://discord.com/api/oauth2/authorize?client_id=${s.discordClientId}&redirect_uri=${encodeURIComponent(window.location.origin + window.location.pathname)}&response_type=token&scope=identify`;
    window.location.href = url;
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#020d06] text-emerald-50">
      <Navigation 
        activeView={activeView} 
        onViewChange={setActiveView} 
        currentUser={currentUser} 
        onLogin={loginWithDiscord} 
        onLogout={() => { localStorage.removeItem('lamu_discord_user'); setCurrentUser(null); }} 
      />
      
      <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto pb-32 md:pb-12">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {activeView === ViewMode.DASHBOARD && (
            <div className="relative overflow-hidden wind-gradient border-2 border-emerald-400/30 rounded-[2.5rem] p-12 text-center shadow-[0_0_60px_rgba(16,185,129,0.15)] group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-300 to-transparent opacity-50"></div>
              <div className="relative z-10">
                <span className="text-xs font-black text-emerald-200 uppercase tracking-[0.6em] mb-3 block">Variante: Viento Esmeralda</span>
                <h2 className="text-5xl md:text-7xl font-black skull-text italic text-white leading-none mb-2 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">RAID BOSS</h2>
                <p className="text-emerald-300/80 font-bold text-[10px] uppercase tracking-[0.4em]">Incursión de Gremio Semanal - Lamu</p>
              </div>
              <div className="absolute -bottom-6 -right-6 p-4 opacity-10 pointer-events-none transform rotate-12">
                <span className="text-9xl font-black italic">WIND</span>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center border-b border-emerald-900/50 pb-8">
            <div>
              <h1 className="text-3xl font-black text-white skull-text italic">REGISTROS</h1>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${cloudStatus === 'connected' ? 'bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]' : 'bg-rose-500'}`}></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800">
                  {cloudStatus === 'connected' ? 'ESMERALDA ONLINE' : 'ARCHIVO LOCAL'}
                </span>
              </div>
            </div>
            <button onClick={refreshData} className="p-4 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/30 rounded-2xl transition-all active:scale-90 shadow-lg">
              {isLoading ? '⌛' : '🔄'}
            </button>
          </div>

          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-emerald-900/30 border-t-emerald-400 rounded-full animate-spin"></div>
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Invocando datos...</span>
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
                      {history.map(r => (
                        <div key={r.id} className="bg-emerald-950/20 p-6 rounded-[2rem] border border-emerald-900/20 group hover:border-emerald-500/40 transition-all backdrop-blur-sm">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                {loadedScreenshots[r.id] ? (
                                  <img src={loadedScreenshots[r.id]} className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-800 shadow-2xl" />
                                ) : (
                                  <button 
                                    onClick={() => handleLoadImage(r.id)}
                                    className="w-16 h-16 rounded-2xl bg-black/40 flex flex-col items-center justify-center border-2 border-dashed border-emerald-800/30 hover:border-emerald-400 transition-colors group"
                                  >
                                    <span className="text-xl group-hover:scale-125 transition-transform">📷</span>
                                    <span className="text-[8px] font-black text-emerald-700 uppercase mt-1">LOG</span>
                                  </button>
                                )}
                                <span className={`absolute -top-2 -right-2 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase shadow-lg ${r.recordType === 'INITIAL' ? 'bg-emerald-600 text-white' : 'bg-teal-600 text-white'}`}>
                                  {r.recordType === 'INITIAL' ? 'BASE' : 'TKT'}
                                </span>
                              </div>
                              <div>
                                <h4 className="font-black text-white text-base skull-text italic tracking-tighter">{r.playerName}</h4>
                                <p className="text-[9px] text-emerald-800 font-bold uppercase tracking-widest">
                                  {new Date(r.timestamp).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="text-right">
                                <span className="block font-mono font-black text-emerald-400 text-xl leading-none">{r.ticketDamage.toLocaleString()}</span>
                                <span className="text-[8px] text-emerald-900 font-black uppercase tracking-widest mt-1 block">DAÑO FINAL</span>
                              </div>
                              {isAdminAuthenticated && (
                                <button onClick={() => handleDeleteEntry(r.id)} disabled={isDeletingId === r.id} className="p-3 bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white rounded-xl border border-rose-500/20 transition-all">
                                  {isDeletingId === r.id ? '...' : '🗑️'}
                                </button>
                              )}
                            </div>
                          </div>
                          {loadedScreenshots[r.id] && (
                            <div className="mt-4 animate-in slide-in-from-top-4 duration-500">
                              <img src={loadedScreenshots[r.id]} className="w-full rounded-[1.5rem] border-2 border-emerald-900/30 shadow-inner" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 text-center text-emerald-900 uppercase text-[10px] tracking-[0.5em]">No se han detectado señales de asalto</div>
                  )}
                </div>
              )}
              
              {activeView === ViewMode.SETTINGS && (
                !isAdminAuthenticated ? (
                  <div className="max-w-md mx-auto mt-10 p-12 bg-emerald-950/20 border-2 border-emerald-900/10 rounded-[2.5rem] text-center space-y-8 shadow-2xl backdrop-blur-xl">
                    <div className="space-y-2">
                      <h2 className="text-2xl font-black text-white skull-text italic">SEGURIDAD NIVEL 5</h2>
                      <p className="text-[10px] text-emerald-800 uppercase tracking-widest">Acceso restringido a Maestros de Gremio</p>
                    </div>
                    <input type="password" value={adminPasswordInput} onChange={(e) => setAdminPasswordInput(e.target.value)} placeholder="PASWORD" className="w-full bg-black/40 border-2 border-emerald-900/20 rounded-2xl px-6 py-4 text-center text-emerald-400 focus:border-emerald-500/50 outline-none transition-all font-mono" />
                    <button onClick={() => { 
                      const s = JSON.parse(localStorage.getItem('lamu_settings') || '{}');
                      if (adminPasswordInput === (s.adminPassword || 'admin123')) setIsAdminAuthenticated(true);
                      else alert("Firma energética no reconocida");
                    }} className="w-full bg-emerald-600 hover:bg-emerald-500 text-emerald-950 py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all shadow-xl shadow-emerald-900/20">Autorizar Terminal</button>
                  </div>
                ) : <Settings stats={stats} onReset={refreshData} />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;