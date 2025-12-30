
import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import RankingTable from './components/RankingTable';
import AddDamageForm from './components/AddDamageForm';
import Settings from './components/Settings';
import { ViewMode, PlayerStats, DamageRecord, DiscordUser } from './types';
import { getPlayerStats, getRecords, isCloudConnected, checkAndPerformAutoReset } from './services/dbService';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [stats, setStats] = useState<PlayerStats[]>([]);
  const [history, setHistory] = useState<DamageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cloudStatus, setCloudStatus] = useState<'connected' | 'local'>('local');
  const [currentUser, setCurrentUser] = useState<DiscordUser | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');

  useEffect(() => {
    // 1. Procesar Link Maestro (Configuración automática vía URL)
    const params = new URLSearchParams(window.location.search);
    const configData = params.get('setup');
    if (configData) {
      try {
        const decoded = atob(configData);
        localStorage.setItem('lamu_settings', decoded);
        // Limpiar URL y recargar para aplicar
        window.history.replaceState({}, document.title, window.location.pathname);
        window.location.reload();
        return;
      } catch (e) {
        console.error("Error procesando link maestro");
      }
    }

    // 2. Procesar Login de Discord
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

  const loginWithDiscord = () => {
    const s = JSON.parse(localStorage.getItem('lamu_settings') || '{}');
    if (!s.discordClientId) return alert("Error: El administrador no ha configurado el Client ID de Discord.");
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
          
          {/* Header de Estado */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/50 pb-8">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tighter">Ranking Lamu</h1>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${cloudStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {cloudStatus === 'connected' ? 'Cloud Sync Online' : 'Modo Offline / No Configurado'}
                </span>
              </div>
            </div>
            
            <button 
              onClick={refreshData}
              className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all active:scale-95"
              title="Refrescar datos"
            >
              <span className={isLoading ? 'animate-spin inline-block' : ''}>🔄</span>
            </button>
          </div>

          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">Sincronizando guerreros...</p>
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
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Últimos reportes</h3>
                  {history.length > 0 ? history.map(r => (
                    <div key={r.id} className="bg-slate-900/50 p-5 rounded-3xl flex items-center justify-between border border-slate-800/50 hover:border-slate-700 transition-colors">
                      <div className="flex items-center gap-5">
                        <div className="relative group cursor-zoom-in">
                          <img src={r.screenshotUrl || 'https://via.placeholder.com/100'} className="w-14 h-14 rounded-2xl object-cover border border-slate-800" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm">{r.playerName}</h4>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                            {r.guild === 'Principal' ? 'División I' : 'División II'} • {new Date(r.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-black text-emerald-400 text-xl tracking-tighter">{r.damageValue.toLocaleString()}</span>
                      </div>
                    </div>
                  )) : (
                    <div className="py-20 text-center border-2 border-dashed border-slate-900 rounded-[2.5rem]">
                       <p className="text-[10px] font-black uppercase text-slate-600 tracking-widest">No hay historial disponible</p>
                    </div>
                  )}
                </div>
              )}
              
              {activeView === ViewMode.SETTINGS && (
                !isAdminAuthenticated ? (
                  <div className="max-w-md mx-auto mt-20 p-10 bg-slate-900 border border-slate-800 rounded-[3rem] text-center space-y-8 shadow-2xl">
                    <div className="w-16 h-16 bg-indigo-600/10 rounded-3xl flex items-center justify-center mx-auto mb-4 text-2xl">🔐</div>
                    <div>
                      <h2 className="text-xl font-black text-white uppercase tracking-tight">Panel de Control</h2>
                      <p className="text-slate-500 text-xs mt-2">Solo líderes del gremio pueden editar la configuración técnica.</p>
                    </div>
                    <input 
                      type="password" 
                      value={adminPasswordInput} 
                      onChange={(e) => setAdminPasswordInput(e.target.value)} 
                      placeholder="Contraseña Maestra" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-center text-white outline-none focus:border-indigo-500 transition-colors" 
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
                      className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl font-black uppercase text-xs tracking-widest text-white shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                    >
                      Desbloquear Ajustes
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
