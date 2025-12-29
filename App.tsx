
import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import RankingTable from './components/RankingTable';
import AddDamageForm from './components/AddDamageForm';
import Settings from './components/Settings';
import { ViewMode, PlayerStats, DamageRecord } from './types';
import { getPlayerStats, getRecords, deleteRecord, checkAndPerformAutoReset } from './services/dbService';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [stats, setStats] = useState<PlayerStats[]>([]);
  const [history, setHistory] = useState<DamageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      // Primero revisamos si toca reinicio semanal
      const wasReset = await checkAndPerformAutoReset();
      if (wasReset) {
        alert("🛡️ ¡Nueva semana competitiva iniciada! El ranking ha sido reiniciado (Lunes 14:00 ART).");
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
    if (confirm('¿Deseas eliminar este registro?')) {
      await deleteRecord(id);
      refreshData();
    }
  };

  const renderContent = () => {
    if (isLoading && activeView !== ViewMode.SETTINGS) {
      return (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium animate-pulse">Sincronizando con el gremio...</p>
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
                <p className="text-slate-400">Guerreros verificados por IA</p>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={refreshData}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400"
                  title="Actualizar ranking"
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
            <div className="text-center">
              <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">
                El ranking se reinicia cada Lunes a las 14:00 ART
              </p>
            </div>
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
                <p className="text-slate-400">Registros de la semana actual</p>
              </header>
              <div className="grid grid-cols-1 gap-4 pb-24">
                {history.length === 0 ? (
                  <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
                    <p className="text-slate-500 italic">No hay registros esta semana aún.</p>
                  </div>
                ) : history.map((record) => (
                  <div key={record.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between hover:border-slate-700 transition-all">
                    <div className="flex items-center gap-4">
                      {record.screenshotUrl ? (
                        <img src={record.screenshotUrl} className="w-14 h-14 rounded-lg bg-slate-800 object-cover border border-slate-700" alt="Capture" />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-slate-800 flex items-center justify-center text-2xl border border-slate-700">⚔️</div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-200">{record.playerName}</h4>
                          <span className="text-[8px] bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-slate-400">
                            {record.guild === 'Principal' ? 'Lamu I' : 'Lamu II'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 uppercase">{new Date(record.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-indigo-400 font-mono font-bold text-lg">{record.damageValue.toLocaleString()}</div>
                      </div>
                      <button 
                        onClick={() => handleDelete(record.id)}
                        className="text-slate-600 hover:text-red-500 transition-colors p-2 hover:bg-red-500/10 rounded-lg"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
          </div>
        );
      case ViewMode.SETTINGS:
        return <Settings onReset={refreshData} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950">
      <Navigation activeView={activeView} onViewChange={setActiveView} />
      <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
