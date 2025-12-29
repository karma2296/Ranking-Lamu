
import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import RankingTable from './components/RankingTable';
import AddDamageForm from './components/AddDamageForm';
import Settings from './components/Settings';
import { ViewMode, PlayerStats, DamageRecord, AppSettings } from './types';
import { getPlayerStats, getRecords, deleteRecord, checkAndPerformAutoReset } from './services/dbService';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [stats, setStats] = useState<PlayerStats[]>([]);
  const [history, setHistory] = useState<DamageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  
  // Lógica de Autenticación Admin
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);

  // Sincronización automática vía URL
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#setup=')) {
      try {
        const configData = atob(hash.replace('#setup=', ''));
        const parsedConfig = JSON.parse(configData);
        
        localStorage.setItem('lamu_settings', JSON.stringify(parsedConfig));
        if (parsedConfig.discordWebhook) {
          localStorage.setItem('lamu_discord_webhook', parsedConfig.discordWebhook);
        }
        
        setSyncMessage("🛡️ ¡Gremio sincronizado con éxito! Cargando datos...");
        window.location.hash = ''; // Limpiar URL
        
        setTimeout(() => {
          setSyncMessage(null);
          refreshData();
        }, 3000);
      } catch (e) {
        console.error("Error en sincronización:", e);
      }
    }
  }, []);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const wasReset = await checkAndPerformAutoReset();
      if (wasReset) {
        console.log("Nueva semana iniciada");
      }

      const [newStats, newHistory] = await Promise.all([
        getPlayerStats(),
        getRecords()
      ]);
      setStats(newStats);
      setHistory(newHistory.sort((a, b) => b.timestamp - a.timestamp));
    } catch (e) {
      console.error("Error al refrescar datos:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
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
    let masterPass = 'admin123'; // Valor por defecto absoluto
    
    if (settingsStr) {
      try {
        const settings = JSON.parse(settingsStr);
        // Si el objeto existe pero no tiene contraseña, sigue siendo admin123
        if (settings.adminPassword) {
          masterPass = settings.adminPassword;
        }
      } catch (err) {
        masterPass = 'admin123';
      }
    }
    
    if (adminPasswordInput === masterPass) {
      setIsAdminAuthenticated(true);
      setAuthError(false);
      setAdminPasswordInput(''); // Limpiar para seguridad
    } else {
      setAuthError(true);
      setTimeout(() => setAuthError(false), 2000);
    }
  };

  const renderContent = () => {
    if (syncMessage) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center animate-bounce">
          <span className="text-5xl mb-4">✨</span>
          <p className="text-emerald-400 font-black uppercase tracking-widest">{syncMessage}</p>
        </div>
      );
    }

    if (isLoading && activeView !== ViewMode.SETTINGS) {
      return (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium animate-pulse">Conectando con el Gremio...</p>
        </div>
      );
    }

    switch (activeView) {
      case ViewMode.DASHBOARD:
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-3xl font-bold text-white">Ranking Lamu</h2>
                <p className="text-slate-400">Datos compartidos en tiempo real</p>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={refreshData}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400"
                >
                  🔄
                </button>
                <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 text-center min-w-[140px]">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-tighter">Máximo Semanal</span>
                  <span className="text-xl font-bold text-emerald-400">
                    {stats.length > 0 ? stats[0].maxDamage.toLocaleString() : '0'}
                  </span>
                </div>
              </div>
            </header>
            <RankingTable stats={stats} />
          </div>
        );
      case ViewMode.ADD_ENTRY:
        return (
          <AddDamageForm 
            onSuccess={() => {
              refreshData();
              setActiveView(ViewMode.DASHBOARD);
            }} 
          />
        );
      case ViewMode.HISTORY:
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
             <header className="mb-8">
                <h2 className="text-3xl font-bold text-white">Últimos Ataques</h2>
                <p className="text-slate-400">Historial del servidor</p>
              </header>
              <div className="grid grid-cols-1 gap-4 pb-24">
                {history.length > 0 ? history.map((record) => (
                  <div key={record.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between hover:border-slate-700 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-xl border border-slate-700">⚔️</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-200">{record.playerName}</h4>
                          <span className={`text-[8px] px-1 rounded font-black ${record.guild === 'Principal' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {record.guild === 'Principal' ? 'L I' : 'L II'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 uppercase">{new Date(record.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-indigo-400 font-mono font-bold text-lg">{record.damageValue.toLocaleString()}</span>
                      <button 
                        onClick={() => handleDelete(record.id)}
                        className="text-slate-600 hover:text-red-500 transition-colors p-2"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-20 text-slate-600 uppercase text-xs font-bold tracking-widest italic opacity-50">No hay registros globales aún</div>
                )}
              </div>
          </div>
        );
      case ViewMode.SETTINGS:
        if (!isAdminAuthenticated) {
          return (
            <div className="max-w-md mx-auto mt-20 p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-center space-y-8 animate-in zoom-in duration-300">
              <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto text-4xl border border-amber-500/30">
                🔐
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-widest">Acceso Administrativo</h2>
                <p className="text-slate-500 text-xs mt-2">Ingresa la clave para gestionar el gremio.</p>
              </div>
              <form onSubmit={handleAdminAuth} className="space-y-4">
                <input
                  type="password"
                  autoFocus
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  placeholder="Contraseña..."
                  className={`w-full bg-slate-950 border ${authError ? 'border-red-500 animate-shake' : 'border-slate-800'} rounded-2xl px-6 py-4 text-center font-black tracking-[0.5em] text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all`}
                />
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg active:scale-95 uppercase text-xs tracking-widest">
                  Entrar al Panel
                </button>
                {authError && <p className="text-red-500 text-[10px] font-black uppercase tracking-tighter mt-2">Clave Incorrecta</p>}
              </form>
            </div>
          );
        }
        return <Settings onReset={refreshData} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950">
      <Navigation activeView={activeView} onViewChange={(view) => {
        setActiveView(view);
      }} />
      <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
