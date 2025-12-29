
import React from 'react';
import { ViewMode } from '../types';

interface NavigationProps {
  activeView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeView, onViewChange }) => {
  const navItems = [
    { id: ViewMode.DASHBOARD, label: 'Ranking', icon: '🏆' },
    { id: ViewMode.ADD_ENTRY, label: 'Subir Daño', icon: '⚔️' },
    { id: ViewMode.HISTORY, label: 'Historial', icon: '📜' },
    { id: ViewMode.SETTINGS, label: 'Ajustes', icon: '⚙️' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:relative md:w-64 bg-slate-900 border-t md:border-t-0 md:border-r border-slate-800 p-4 z-50">
      <div className="flex md:flex-col justify-around md:justify-start gap-4">
        <div className="hidden md:block mb-8 px-4">
          <h1 className="text-xl font-bold text-indigo-400 flex items-center gap-2">
            <span>🛡️</span> Lamu Gremio
          </h1>
          <p className="text-xs text-slate-500">Bot Integration Ready</p>
        </div>
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
            <span className="text-xs md:text-sm font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;
