
import React from 'react';
import { ViewMode, DiscordUser } from '../types';

interface NavigationProps {
  activeView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  currentUser: DiscordUser | null;
  onLogin: () => void;
  onLogout: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeView, onViewChange, currentUser, onLogin, onLogout }) => {
  const navItems = [
    { id: ViewMode.DASHBOARD, label: 'Ranking', icon: '🏆' },
    { id: ViewMode.ADD_ENTRY, label: 'Subir Daño', icon: '⚔️' },
    { id: ViewMode.HISTORY, label: 'Historial', icon: '📜' },
    { id: ViewMode.SETTINGS, label: 'Ajustes', icon: '⚙️' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:relative md:w-64 bg-slate-900 border-t md:border-t-0 md:border-r border-slate-800 p-4 z-50 flex flex-col">
      <div className="hidden md:block mb-8 px-4">
        <h1 className="text-xl font-bold text-indigo-400 flex items-center gap-2">
          <span>🛡️</span> Lamu Gremio
        </h1>
      </div>

      <div className="flex md:flex-col justify-around md:justify-start gap-2 flex-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`flex flex-col md:flex-row items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeView === item.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="text-xl md:text-lg">{item.icon}</span>
            <span className="text-[10px] md:text-sm font-bold uppercase md:capitalize">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="hidden md:block mt-auto border-t border-slate-800 pt-6 px-4">
        {currentUser ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <img src={currentUser.avatar || 'https://via.placeholder.com/150'} className="w-10 h-10 rounded-xl border border-indigo-500/30" alt="Avatar" />
              <div className="overflow-hidden">
                <p className="text-xs font-black text-white truncate">{currentUser.username}</p>
              </div>
            </div>
            <button onClick={onLogout} className="text-[9px] font-black text-slate-600 hover:text-red-400 uppercase tracking-widest text-left transition-colors">
              Cerrar Sesión
            </button>
          </div>
        ) : (
          <button onClick={onLogin} className="w-full bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/30 text-indigo-400 hover:text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
            Login con Discord
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
