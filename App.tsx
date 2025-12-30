
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
  const [cloudStatus, setCloudStatus] = useState<'connected' | 'local'>('local');
  const [currentUser, setCurrentUser] = useState<DiscordUser | null>(null);
  
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');

  useEffect(() => {
    const checkDiscordAuth = async () => {
      const fragment = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = fragment.get('access_token');
      if (accessToken) {
        try {
          const res = await fetch('https://discord.com/api/users/@me', { headers: { Authorization: `Bearer ${accessToken}` } });
          if (res.ok) {
            const data = await res.json();
            const user = { id: data.id, username: data.username, avatar: data.avatar ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png` : undefined };
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
    if (!s.discordClientId) return alert("Configura el Client ID en Ajustes.");
    const url = `https://discord.com/api/oauth2/authorize?client_id=${s.discordClientId}&redirect_uri=${encodeURIComponent(window.location.origin + window.location.pathname)}&response_type=token&scope=identify`;
    window.location.href = url;
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950">
      <Navigation activeView={activeView} onViewChange={setActiveView} currentUser={currentUser} onLogin={loginWithDiscord} onLogout={() => { localStorage.removeItem('lamu_discord_user'); setCurrentUser(null); }} />
      <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {isLoading ? <div className="h-64 flex items-center justify-center text-slate-500 uppercase font-black text-xs tracking-widest animate-pulse">Cargando datos...</div> : (
            <>
              {activeView === ViewMode.DASHBOARD && <RankingTable stats={stats} />}
              {activeView === ViewMode.ADD_ENTRY && <AddDamageForm currentUser={currentUser} onLoginRequest={loginWithDiscord} onSuccess={() => { refreshData(); setActiveView(ViewMode.DASHBOARD); }} />}
              {activeView === ViewMode.HISTORY && (
                <div className="space-y-4">
                  {history.map(r => (
                    <div key={r.id} className="bg-slate-900 p-4 rounded-2xl flex items-center justify-between border border-slate-800">
                      <div className="flex items-center gap-4">
                        <img src={r.screenshotUrl || 'https://via.placeholder.com/50'} className="w-12 h-12 rounded-lg object-cover" />
                        <div>
                          <h4 className="font-bold text-white">{r.playerName}</h4>
                          <p className="text-[10px] text-slate-500 uppercase">{new Date(r.timestamp).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className="font-mono font-black text-emerald-400 text-xl">{r.damageValue.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
              {activeView === ViewMode.SETTINGS && (
                !isAdminAuthenticated ? (
                  <div className="max-w-md mx-auto mt-20 p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-6">
                    <input type="password" value={adminPasswordInput} onChange={(e) => setAdminPasswordInput(e.target.value)} placeholder="Contraseña Admin" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-center text-white outline-none" />
                    <button onClick={() => { if (adminPasswordInput === (JSON.parse(localStorage.getItem('lamu_settings') || '{}').adminPassword || 'admin123')) setIsAdminAuthenticated(true); }} className="w-full bg-indigo-600 py-3 rounded-xl font-black uppercase text-xs tracking-widest text-white">Desbloquear</button>
                  </div>
                ) : <Settings onReset={refreshData} />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
