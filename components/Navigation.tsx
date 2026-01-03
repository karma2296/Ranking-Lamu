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
    { id: ViewMode.DASHBOARD, label: 'Ranking', icon: '💎' },
    { id: ViewMode.ADD_ENTRY, label: 'Subir Daño', icon: '⚔️' },
    { id: ViewMode.HISTORY, label: 'Historial', icon: '📜' },
    { id: ViewMode.SETTINGS, label: 'Ajustes', icon: '⚙️' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:relative md:w-64 bg-emerald-950/80 backdrop-blur-md border-t md:border-t-0 md:border-r border-emerald-900/30 p-4 z-50 flex flex-col">
      <div className="hidden md:block mb-10 px-4">
        <h1 className="text-2xl font-black text-emerald-400 skull-text italic flex items-center gap-2 tracking-tighter">
          <span>🛡️</span> LAMU RAID
        </h1>
        <p className="text-[8px] text-emerald-800 font-bold uppercase tracking-[0.3em] mt-1">Wind Season</p>
      </div>

      <div className="flex md:flex-col justify-around md:justify-start gap-3 flex-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`flex flex-col md:flex-row items-center gap-4 px-5 py-4 rounded-2xl transition-all active:scale-95 ${
              activeView === item.id
                ? 'bg-emerald-600 text-emerald-950 shadow-xl shadow-emerald-600/20 font-black'
                : 'text-emerald-700 hover:bg-emerald-900/20 hover:text-emerald-400'
            }`}
          >
            <span className="text-2xl md:text-xl">{item.icon}</span>
            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="hidden md:block mt-auto border-t border-emerald-900/30 pt-8 px-4">
        {currentUser ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4 p-3 bg-black/20 rounded-2xl border border-emerald-900/30">
              <img src={currentUser.avatar || 'https://via.placeholder.com/150'} className="w-10 h-10 rounded-xl border border-emerald-500/30 shadow-lg" alt="Avatar" />
              <div className="overflow-hidden">
                <p className="text-[10px] font-black text-white truncate uppercase tracking-tighter">{currentUser.username}</p>
                <p className="text-[8px] text-emerald-500 font-bold uppercase tracking-widest">En Línea</p>
              </div>
            </div>
            <button onClick={onLogout} className="text-[9px] font-black text-emerald-900 hover:text-rose-500 uppercase tracking-[0.3em] text-center transition-colors">
              Desconectar
            </button>
          </div>
        ) : (
          <button onClick={onLogin} className="w-full bg-emerald-600/10 hover:bg-emerald-600 border border-emerald-500/30 text-emerald-400 hover:text-emerald-950 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
            Login Discord
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navigation;