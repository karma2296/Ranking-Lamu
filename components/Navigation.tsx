
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
    { id: ViewMode.DASHBOARD, label: 'Ranking', icon: '🎤' },
    { id: ViewMode.ADD_ENTRY, label: 'Grabar', icon: '🎸' },
    { id: ViewMode.HISTORY, label: 'Archivo', icon: '📁' },
    { id: ViewMode.SETTINGS, label: 'Ajustes', icon: '🎚️' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:relative md:w-64 bg-sky-950/90 backdrop-blur-xl border-t md:border-t-0 md:border-r border-sky-900/30 p-4 z-50 flex flex-col overflow-hidden">
      
      {/* Arte de fondo exclusivo para el menú estilo Ado */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-40 transition-opacity duration-700"
        style={{
          backgroundImage: "url('https://i.pinimg.com/736x/d0/65/3a/d0653a60c753c4c2ae60396c45d46747.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center 20%', 
          filter: 'contrast(120%) brightness(60%) hue-rotate(-10deg) saturate(110%)'
        }}
      />
      
      {/* Overlay de degradado para legibilidad del texto */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-sky-950/60 via-sky-950/20 to-sky-950 pointer-events-none" />

      <div className="relative z-10 hidden md:block mb-10 px-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-sky-400 ado-title flex items-center gap-2 tracking-tighter drop-shadow-[0_0_15px_rgba(14,165,233,0.8)]">
            <span>🌹</span> BLUE ROSE
          </h1>
          <span className="text-[10px] font-black text-sky-500/80 tracking-widest">M&G</span>
        </div>
        <p className="text-[8px] text-sky-300/80 font-bold uppercase tracking-[0.3em] mt-1 drop-shadow-md">Ado Revolution</p>
      </div>

      <div className="relative z-10 flex md:flex-col justify-around md:justify-start gap-3 flex-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`flex flex-col md:flex-row items-center gap-4 px-5 py-4 rounded-2xl transition-all active:scale-95 border group ${
              activeView === item.id
                ? 'bg-sky-600 border-sky-400 text-sky-950 shadow-[0_0_25px_rgba(14,165,233,0.4)] font-black'
                : 'text-sky-400/70 border-sky-900/10 hover:bg-sky-900/60 hover:border-sky-500/30 hover:text-sky-300'
            }`}
          >
            <span className="text-2xl md:text-xl group-hover:scale-110 transition-transform">{item.icon}</span>
            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="relative z-10 hidden md:block mt-auto border-t border-sky-900/40 pt-8 px-4">
        {currentUser ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4 p-3 bg-black/50 rounded-2xl border border-sky-800/40 backdrop-blur-md shadow-lg">
              <img 
                src={currentUser.avatar || 'https://via.placeholder.com/150'} 
                className="w-10 h-10 rounded-xl border border-sky-500/50 shadow-[0_0_10px_rgba(14,165,233,0.3)]" 
                alt="Avatar" 
              />
              <div className="overflow-hidden">
                <p className="text-[10px] font-black text-white truncate uppercase tracking-tighter">{currentUser.username}</p>
                <div className="flex items-center justify-between">
                  <p className="text-[8px] text-sky-400 font-bold uppercase tracking-widest">Backstage</p>
                  <span className="text-[7px] text-sky-600 font-black">M&G</span>
                </div>
              </div>
            </div>
            <button 
              onClick={onLogout} 
              className="text-[9px] font-black text-sky-600 hover:text-rose-400 uppercase tracking-[0.3em] text-center transition-colors"
            >
              Finalizar Show
            </button>
          </div>
        ) : (
          <button 
            onClick={onLogin} 
            className="w-full bg-sky-600/20 hover:bg-sky-600 border border-sky-500/40 text-sky-400 hover:text-sky-950 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(0,0,0,0.4)]"
          >
            Sincro Discord
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
