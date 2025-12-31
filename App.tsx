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
    // 1. Procesar Link Maestro (Configuración automática)
    const params = new URLSearchParams(window.location.search);
    const configData = params.get('setup');
    if (configData) {
      try {
        const decoded = atob(configData);
        localStorage.setItem('lamu_settings', decoded);
        // Limpiar URL y forzar recarga limpia
        window.history.replaceState({}, document.title, window.location.pathname);
        window.location.reload();
        return;
      } catch (e) {
        console.error("Link Maestro inválido");
      }
    }

    // 2. Auth Discord
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

          {!isLoading && cloudStatus === 'local' && activeView !== ViewMode.SETTINGS && (
            <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-[2rem] flex items-center gap-4 animate-bounce">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="text-amber-200 text-xs font-black uppercase">App no configurada</p>
                <p className="text-amber-500/70 text-[10px]">Pide el Link Maestro a tu líder o configura Supabase en Ajustes.</p>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
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
                  {history.length > 0 ? history.map(r => (
                    <div key={r.id} className="bg-slate-900/50 p-5 rounded-3xl flex items-center justify-between border border-slate-800/50">
                      <div className="flex items-center gap-4">
                        <img src={r.screenshotUrl || 'https://via.placeholder.com/100'} className="w-12 h-12 rounded-xl object-cover" />
                        <div>
                          <h4 className="font-bold text-white text-sm">{r.playerName}</h4>
                          <p className="text-[9px] text-slate-500 font-bold uppercase">{new Date(r.timestamp).toLocaleDateString()}</p>
                        </div>
                      </div>
                      {/* Fixed: damageValue does not exist on DamageRecord, using ticketDamage instead */}
                      <span className="font-mono font-black text-emerald-400 text-lg">{r.ticketDamage.toLocaleString()}</span>
                    </div>
                  )) : (
                    <div className="py-20 text-center text-slate-600 font-black uppercase text-[10px] tracking-widest">Historial vacío</div>
                  )}
                </div>
              )}
              
              {activeView === ViewMode.SETTINGS && (
                !isAdminAuthenticated ? (
                  <div className="max-w-md mx-auto mt-10 p-10 bg-slate-900 border border-slate-800 rounded-[3rem] text-center space-y-6">
                    <h2 className="text-xl font-black text-white uppercase">Acceso Admin</h2>
                    <input 
                      type="password" 
                      value={adminPasswordInput} 
                      onChange={(e) => setAdminPasswordInput(e.target.value)} 
                      placeholder="Contraseña" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-center text-white outline-none" 
                    />
                    <button 
                      onClick={() => { 
                        const s = JSON.parse(localStorage.getItem('lamu_settings') || '{}');
                        if (adminPasswordInput === (s.adminPassword || 'admin123')) setIsAdminAuthenticated(true);
                        else alert("Error");
                      }} 
                      className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-xs"
                    >
                      Entrar
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