
import React from 'react';
import { PlayerStats } from '../types';

interface RankingTableProps {
  stats: PlayerStats[];
}

// Medallas SVG integradas para evitar imágenes rotas
const MedalSVG = ({ type, size = "100%" }: { type: 'diamond' | 'gold' | 'silver', size?: string }) => {
  if (type === 'diamond') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_15px_rgba(0,242,255,0.4)]">
        <circle cx="50" cy="50" r="45" stroke="url(#grad_dia)" strokeWidth="5" fill="#0f172a" />
        <path d="M50 15L62 38H38L50 15Z" fill="#00f2ff" opacity="0.8" />
        <path d="M50 85L38 62H62L50 85Z" fill="#00f2ff" opacity="0.8" />
        <defs>
          <linearGradient id="grad_dia" x1="0" y1="0" x2="100" y2="100">
            <stop offset="0%" stopColor="#00f2ff" />
            <stop offset="50%" stopColor="#c026d3" />
            <stop offset="100%" stopColor="#00f2ff" />
          </linearGradient>
        </defs>
      </svg>
    );
  }
  if (type === 'gold') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]">
        <circle cx="50" cy="50" r="45" stroke="#fbbf24" strokeWidth="5" fill="#0f172a" />
        <circle cx="50" cy="50" r="38" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 4" />
        <path d="M50 25L55 40H70L58 50L62 65L50 55L38 65L42 50L30 40H45L50 25Z" fill="#fbbf24" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" stroke="#94a3b8" strokeWidth="5" fill="#0f172a" />
      <circle cx="50" cy="50" r="38" stroke="#64748b" strokeWidth="1" />
      <rect x="40" y="30" width="20" height="40" rx="2" fill="#94a3b8" />
    </svg>
  );
};

const RankingTable: React.FC<RankingTableProps> = ({ stats }) => {
  const top3 = stats.slice(0, 3);

  const renderAvatar = (url?: string, name?: string, size: string = "w-full h-full") => {
    if (url) return <img src={url} className={`${size} object-cover`} alt="" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/100?text=?')} />;
    return (
      <div className={`${size} bg-slate-800 flex items-center justify-center text-slate-500 font-black`}>
        {name?.charAt(0).toUpperCase() || '?'}
      </div>
    );
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {top3.length > 0 && (
        <div className="grid grid-cols-3 gap-2 md:gap-8 items-end max-w-4xl mx-auto pt-24 pb-12">
          
          {/* TOP 2 - ORO (IZQUIERDA) */}
          {top3[1] ? (
            <div className="flex flex-col items-center group">
              <div className="relative mb-6">
                <div className="relative w-24 h-24 md:w-32 md:h-32">
                  <div className="absolute inset-0 z-20"><MedalSVG type="gold" /></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] z-10 overflow-hidden rounded-full border-2 border-amber-500/30">
                    {renderAvatar(top3[1].discordUser?.avatar, top3[1].playerName)}
                  </div>
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 text-[8px] font-black px-4 py-1 rounded-full z-30 uppercase tracking-tighter shadow-lg">ORO</div>
              </div>
              <p className="text-amber-100/80 font-bold text-center text-xs truncate w-full px-2">{top3[1].playerName}</p>
              <p className="text-amber-500 font-mono font-black text-sm">{top3[1].maxDamage.toLocaleString()}</p>
            </div>
          ) : <div />}

          {/* TOP 1 - DIAMANTE (CENTRO) */}
          {top3[0] && (
            <div className="flex flex-col items-center group -translate-y-12">
              <div className="relative mb-6">
                <div className="absolute -inset-16 bg-indigo-500/10 blur-[60px] rounded-full animate-pulse"></div>
                <div className="relative w-36 h-36 md:w-48 md:h-48 scale-110">
                  <div className="absolute inset-0 z-20"><MedalSVG type="diamond" /></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[72%] h-[72%] z-10 overflow-hidden rounded-full border-4 border-indigo-500/20">
                    {renderAvatar(top3[0].discordUser?.avatar, top3[0].playerName)}
                  </div>
                </div>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-purple-600 text-white text-[10px] font-black px-6 py-2 rounded-full z-30 uppercase tracking-[0.2em] animate-bounce shadow-[0_0_20px_rgba(168,85,247,0.4)]">MVP</div>
              </div>
              <p className="text-white font-black text-center text-lg truncate w-full tracking-tight">{top3[0].playerName}</p>
              <p className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400 font-mono font-black text-2xl drop-shadow-sm">{top3[0].maxDamage.toLocaleString()}</p>
            </div>
          )}

          {/* TOP 3 - PLATA (DERECHA) */}
          {top3[2] ? (
            <div className="flex flex-col items-center group">
              <div className="relative mb-6">
                <div className="relative w-24 h-24 md:w-32 md:h-32">
                  <div className="absolute inset-0 z-20"><MedalSVG type="silver" /></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] z-10 overflow-hidden rounded-full border-2 border-slate-500/30">
                    {renderAvatar(top3[2].discordUser?.avatar, top3[2].playerName)}
                  </div>
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-500 text-white text-[8px] font-black px-4 py-1 rounded-full z-30 uppercase tracking-tighter shadow-lg">PLATA</div>
              </div>
              <p className="text-slate-400 font-bold text-center text-xs truncate w-full px-2">{top3[2].playerName}</p>
              <p className="text-slate-300 font-mono font-black text-sm">{top3[2].maxDamage.toLocaleString()}</p>
            </div>
          ) : <div />}
        </div>
      )}

      {/* TABLA DE POSICIONES */}
      <div className="bg-slate-900/50 rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-2xl backdrop-blur-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-950/50 border-b border-slate-800">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Posición</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Guerrero</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Daño Máximo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {stats.map((player, index) => (
              <tr key={index} className="hover:bg-indigo-500/[0.03] transition-colors group">
                <td className="px-8 py-6 w-32 text-center">
                  <div className="flex justify-center items-center">
                    {index < 3 ? (
                      <div className="w-10 h-10">
                        <MedalSVG type={index === 0 ? 'diamond' : index === 1 ? 'gold' : 'silver'} />
                      </div>
                    ) : (
                      <span className="font-mono font-black text-sm text-slate-600">
                        {(index + 1).toString().padStart(2, '0')}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className={`w-11 h-11 rounded-2xl border-2 overflow-hidden ${index === 0 ? 'border-indigo-500/50' : 'border-slate-800'}`}>
                        {renderAvatar(player.discordUser?.avatar, player.playerName)}
                      </div>
                      {index === 0 && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span></span>}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-100 group-hover:text-white transition-colors">{player.playerName}</h4>
                      <p className="text-[9px] text-slate-600 font-bold uppercase tracking-tight">{player.guild === 'Principal' ? 'División I' : 'División II'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <span className={`font-mono text-2xl font-black transition-colors ${index === 0 ? 'text-cyan-400' : index === 1 ? 'text-amber-500' : index === 2 ? 'text-slate-300' : 'text-slate-500 group-hover:text-slate-300'}`}>
                    {player.maxDamage.toLocaleString()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {stats.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-slate-600 font-black uppercase text-xs tracking-widest">Aún no hay registros esta semana</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RankingTable;
