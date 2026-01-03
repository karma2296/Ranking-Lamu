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
    <nav className="fixed bottom-0 left-0 right-0 md:relative md:w-64 bg-emerald-950/90 backdrop-blur-xl border-t md:border-t-0 md:border-r border-emerald-900/30 p-4 z-50 flex flex-col overflow-hidden">
      
      {/* Arte de fondo exclusivo para el menú */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: "url('https://images-ng.pixai.art/images/orig/9dbbe2e3-b327-4d77-ae67-0d42cedbd012')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'grayscale(100%) sepia(100%) hue-rotate(90deg) brightness(80%)'
        }}
      />
      
      {/* Overlay de degradado para legibilidad */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-emerald-950/40 via-transparent to-emerald-950 pointer-events-none" />

      <div className="relative z-10 hidden md:block mb-10 px-4">
        <h1 className="text-2xl font-black text-emerald-400 skull-text italic flex items-center gap-2 tracking-tighter drop-shadow-lg">
          <span>🛡️</span> LAMU RAID
        </h1>
        <p className="text-[8px] text-emerald-400/60 font-bold uppercase tracking-[0.3em] mt-1">Wind Season</p>
      </div>

      <div className="relative z-10 flex md:flex-col justify-around md:justify-start gap-3 flex-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`flex flex-col md:flex-row items-center gap-4 px-5 py-4 rounded-2xl transition-all active:scale-95 border ${
              activeView === item.id
                ? 'bg-emerald-600 border-emerald-400 text-emerald-950 shadow-xl shadow-emerald-600/20 font-black'
                : 'text-emerald-400/70 border-transparent hover:bg-emerald-900/40 hover:text-emerald-300'
            }`}
          >
            <span className="text-2xl md:text-xl">{item.icon}</span>
            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="relative z-10 hidden md:block mt-auto border-t border-emerald-900/30 pt-8 px-4">
        {currentUser ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4 p-3 bg-black/40 rounded-2xl border border-emerald-800/30 backdrop-blur-sm">
              <img src={currentUser.avatar || 'https://via.placeholder.com/150'} className="w-10 h-10 rounded-xl border border-emerald-500/30 shadow-lg" alt="Avatar" />
              <div className="overflow-hidden">
                <p className="text-[10px] font-black text-white truncate uppercase tracking-tighter">{currentUser.username}</p>
                <p className="text-[8px] text-emerald-500 font-bold uppercase tracking-widest">En Línea</p>
              </div>
            </div>
            <button onClick={onLogout} className="text-[9px] font-black text-emerald-700 hover:text-rose-400 uppercase tracking-[0.3em] text-center transition-colors">
              Desconectar
            </button>
          </div>
        ) : (
          <button onClick={onLogin} className="w-full bg-emerald-600/10 hover:bg-emerald-600 border border-emerald-500/30 text-emerald-400 hover:text-emerald-950 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg">
            Login Discord
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navigation;