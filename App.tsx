
import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import RankingTable from './components/RankingTable';
import AddDamageForm from './components/AddDamageForm';
import Settings from './components/Settings';
import JoinForm from './components/JoinForm';
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
  
  // Autenticación de Miembro (LamuG2026)
  const [isMemberAuthenticated, setIsMemberAuthenticated] = useState(() => {
    return sessionStorage.getItem('lamu_member_auth') === 'true';
  });
  const [memberPasswordInput, setMemberPasswordInput] = useState('');

  // Autenticación de Admin (admin123)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return sessionStorage.getItem('lamu_admin_auth') === 'true';
  });
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

  const handleAdminLogin = () => {
    const s = JSON.parse(localStorage.getItem('lamu_settings') || '{}');
    const correctPass = s.adminPassword || 'admin123';
    if (adminPasswordInput === correctPass) {
      setIsAdminAuthenticated(true);
      sessionStorage.setItem('lamu_admin_auth', 'true');
    } else {
      alert("Acceso denegado. Firma vocal incorrecta.");
    }
  };

  const handleMemberLogin = () => {
    if (memberPasswordInput === "LamuG2026") {
      setIsMemberAuthenticated(true);
      sessionStorage.setItem('lamu_member_auth', 'true');
    } else {
      alert("Contraseña de Miembro incorrecta.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-transparent text-sky-50 relative z-10">
      <Navigation 
        activeView={activeView} 
        onViewChange={setActiveView} 
        currentUser={currentUser} 
        onLogin={() => {}} // Se maneja internamente si es necesario
        onLogout={() => { localStorage.removeItem('lamu_discord_user'); setCurrentUser(null); }} 
      />
      
      <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto pb-32 md:pb-12">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {activeView === ViewMode.DASHBOARD && (
            <div className="relative overflow-hidden ado-gradient border-2 border-sky-400/30 rounded-[2.5rem] p-12 text-center shadow-[0_0_60px_rgba(14,165,233,0.3)] group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-sky-300 to-transparent opacity-50"></div>
              <div className="absolute top-6 right-8 rotate-12 opacity-90 pointer-events-none">
                <div className="border-2 border-sky-400 text-sky-400 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-[0.4em] shadow-[0_0_15px_rgba(14,165,233,0.6)] backdrop-blur-sm bg-sky-950/20">
                  M&G
                </div>
              </div>
              <div className="relative z-10 flex flex-col items-center">
                <span className="text-xs font-black text-sky-200 uppercase tracking-[0.6em] mb-4 block opacity-80">Variante: Blue Rose Performance</span>
                <div className="flex flex-col leading-none items-center transform group-hover:scale-[1.03] transition-transform duration-500">
                  <h2 className="text-6xl md:text-8xl font-black ado-title text-white italic drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)]">ADO</h2>
                  <h2 className="text-5xl md:text-7xl font-black ado-title text-white italic -mt-2 drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)]">REVOLUTION</h2>
                </div>
                <p className="text-sky-300/90 font-bold text-[10px] uppercase tracking-[0.4em] mt-6 border-t border-sky-400/20 pt-4 px-8">Incursión Nocturna de Gremio - Lamu</p>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center border-b border-sky-900/50 pb-8">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black text-white ado-title italic">
                  {activeView === ViewMode.DASHBOARD ? 'CHART TOPPERS' : 
                   activeView === ViewMode.HISTORY ? 'ARCHIVOS BLUE' : 
                   activeView === ViewMode.SETTINGS ? 'CONSOLA MAESTRA' : 
                   activeView === ViewMode.JOIN ? 'RECLUTAMIENTO' : 'GRABACIÓN'}
                </h1>
                <span className="text-sky-400 font-black text-[10px] tracking-widest pt-2 bg-sky-950/40 px-2 py-0.5 rounded border border-sky-800/50">M&G</span>
              </div>
            </div>
            <button onClick={refreshData} className="p-4 bg-sky-950/40 hover:bg-sky-900/60 border border-sky-800/30 rounded-2xl transition-all active:scale-90 shadow-lg">
              {isLoading ? '⌛' : '🔄'}
            </button>
          </div>

          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-sky-900/30 border-t-sky-400 rounded-full animate-spin"></div>
              <span className="text-[10px] font-black uppercase text-sky-400 tracking-widest">Sintonizando...</span>
            </div>
          ) : (
            <div className="animate-in fade-in duration-500">
              
              {/* VISTAS PÚBLICAS */}
              {activeView === ViewMode.DASHBOARD && <RankingTable stats={stats} />}
              {activeView === ViewMode.JOIN && <JoinForm />}

              {/* VISTA PROTEGIDA PARA MIEMBROS (LamuG2026) */}
              {activeView === ViewMode.ADD_ENTRY && (
                !isMemberAuthenticated ? (
                  <div className="max-w-md mx-auto mt-10 p-12 bg-sky-950/20 border-2 border-sky-900/10 rounded-[2.5rem] text-center space-y-8 shadow-2xl backdrop-blur-xl">
                    <h2 className="text-2xl font-black text-white ado-title italic">ACCESO MIEMBROS</h2>
                    <input 
                      type="password" 
                      value={memberPasswordInput} 
                      onChange={(e) => setMemberPasswordInput(e.target.value)} 
                      placeholder="CONTRASEÑA MIEMBRO" 
                      className="w-full bg-black/40 border-2 border-sky-900/20 rounded-2xl px-6 py-4 text-center text-sky-400 font-mono outline-none" 
                    />
                    <button onClick={handleMemberLogin} className="w-full bg-sky-600 text-sky-950 py-5 rounded-2xl font-black uppercase text-xs tracking-widest transition-all">Sincronizar</button>
                  </div>
                ) : (
                  <AddDamageForm 
                    currentUser={currentUser} 
                    onLoginRequest={() => {}} 
                    onSuccess={() => { refreshData(); setActiveView(ViewMode.DASHBOARD); }} 
                  />
                )
              )}

              {/* VISTA PROTEGIDA PARA STAFF (admin123) */}
              {(activeView === ViewMode.HISTORY || activeView === ViewMode.SETTINGS) && (
                !isAdminAuthenticated ? (
                  <div className="max-w-md mx-auto mt-10 p-12 bg-sky-950/20 border-2 border-sky-900/10 rounded-[2.5rem] text-center space-y-8 shadow-2xl backdrop-blur-xl">
                    <h2 className="text-2xl font-black text-white ado-title italic">SECURITY: BLACK NIGHT</h2>
                    <input 
                      type="password" 
                      value={adminPasswordInput} 
                      onChange={(e) => setAdminPasswordInput(e.target.value)} 
                      placeholder="FIRMA VOCAL" 
                      className="w-full bg-black/40 border-2 border-sky-900/20 rounded-2xl px-6 py-4 text-center text-rose-400 font-mono outline-none" 
                    />
                    <button onClick={handleAdminLogin} className="w-full bg-rose-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest transition-all">Autorizar</button>
                  </div>
                ) : (
                  activeView === ViewMode.SETTINGS ? <Settings stats={stats} onReset={refreshData} /> : (
                    <div className="space-y-4">
                      {history.map(r => (
                        <div key={r.id} className="bg-sky-950/20 p-6 rounded-[2rem] border border-sky-900/20 group hover:border-sky-400/40 backdrop-blur-sm">
                          <div className="flex items-center justify-between">
                            <h4 className="font-black text-white text-base ado-title italic">{r.playerName}</h4>
                            <span className="font-mono font-black text-sky-400">{r.ticketDamage.toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )
              )}

            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
