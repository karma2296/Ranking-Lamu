
import React from 'react';
import { PlayerStats } from '../types';

interface RankingTableProps {
  stats: PlayerStats[];
}

// Medallas SVG inspiradas en el estilo de Skullgirls (Art Déco / Fighting Game)
const MedalSVG = ({ type, size = "100%" }: { type: 'diamond' | 'gold' | 'silver', size?: string }) => {
  if (type === 'diamond') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_15px_rgba(0,242,255,0.6)]">
        <defs>
          <linearGradient id="grad_dia_inner" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f2ff" />
            <stop offset="100%" stopColor="#c026d3" />
          </linearGradient>
          <linearGradient id="grad_dia_border" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="100%" stopColor="#00f2ff" />
          </linearGradient>
        </defs>
        <path d="M50 5L90 35L90 65L50 95L10 65L10 35L50 5Z" fill="#0f172a" stroke="url(#grad_dia_border)" strokeWidth="3" />
        <path d="M50 15L80 38L80 62L50 85L20 62L20 38L50 15Z" fill="url(#grad_dia_inner)" opacity="0.4" />
        <path d="M50 20L58 45H42L50 20Z" fill="white" opacity="0.6" />
        <path d="M50 80L42 55H58L50 80Z" fill="white" opacity="0.3" />
        <path d="M50 5L50 95M10 35L90 65M90 35L10 65" stroke="url(#grad_dia_border)" strokeWidth="1" opacity="0.3" />
      </svg>
    );
  }
  if (type === 'gold') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]">
        <defs>
          <linearGradient id="grad_gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="50%" stopColor="#fff" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="45" fill="#0f172a" stroke="url(#grad_gold)" strokeWidth="4" />
        <path d="M50 12 L55 35 L78 35 L60 50 L68 73 L50 58 L32 73 L40 50 L22 35 L45 35 Z" fill="url(#grad_gold)" />
        <circle cx="50" cy="50" r="32" stroke="url(#grad_gold)" strokeWidth="1" strokeDasharray="4 2" opacity="0.5" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad_silver" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="50%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
      </defs>
      <path d="M15 20 Q50 5 85 20 V60 Q50 95 15 60 Z" fill="#0f172a" stroke="url(#grad_silver)" strokeWidth="4" />
      <path d="M30 35 H70 V55 Q50 80 30 55 Z" fill="url(#grad_silver)" opacity="0.8" />
      <rect x="45" y="40" width="10" height="20" fill="#0f172a" opacity="0.5" />
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
          
          {top3[1] ? (
            <div className="flex flex-col items-center group">
              <div className="relative mb-6">
                <div className="relative w-24 h-24 md:w-32 md:h-32">
                  <div className="absolute inset-0 z-20"><MedalSVG type="gold" /></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[65%] h-[65%] z-10 overflow-hidden rounded-full border-2 border-amber-500/30">
                    {renderAvatar(top3[1].discordUser?.avatar, top3[1].playerName)}
                  </div>
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 text-[8px] font-black px-4 py-1 rounded-full z-30 uppercase tracking-tighter shadow-lg">ORO</div>
              </div>
              <p className="text-amber-100/80 font-bold text-center text-xs truncate w-full px-2">{top3[1].playerName}</p>
              <p className="text-amber-500 font-mono font-black text-sm">{top3[1].maxDamage.toLocaleString()}</p>
            </div>
          ) : <div />}

          {top3[0] && (
            <div className="flex flex-col items-center group -translate-y-12">
              <div className="relative mb-6">
                <div className="absolute -inset-20 bg-cyan-500/10 blur-[80px] rounded-full animate-pulse"></div>
                <div className="relative w-36 h-36 md:w-52 md:h-52 scale-110">
                  <div className="absolute inset-0 z-20"><MedalSVG type="diamond" /></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[68%] h-[68%] z-10 overflow-hidden rounded-full border-4 border-indigo-500/20">
                    {renderAvatar(top3[0].discordUser?.avatar, top3[0].playerName)}
                  </div>
                </div>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-600 text-white text-[10px] font-black px-6 py-2 rounded-full z-30 uppercase tracking-[0.2em] animate-bounce shadow-[0_0_25px_rgba(6,182,212,0.5)]">MVP</div>
              </div>
              <p className="text-white font-black text-center text-lg truncate w-full tracking-tight">{top3[0].playerName}</p>
              <p className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400 font-mono font-black text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">{top3[0].maxDamage.toLocaleString()}</p>
            </div>
          )}

          {top3[2] ? (
            <div className="flex flex-col items-center group">
              <div className="relative mb-6">
                <div className="relative w-24 h-24 md:w-32 md:h-32">
                  <div className="absolute inset-0 z-20"><MedalSVG type="silver" /></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[65%] h-[65%] z-10 overflow-hidden rounded-full border-2 border-slate-500/30">
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

      <div className="bg-slate-900/40 rounded-[2.5rem] border border-slate-800/60 overflow-hidden shadow-2xl backdrop-blur-md">
        <table className="w-full text-left">
          <thead className="bg-slate-950/60 border-b border-slate-800/80">
            <tr>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Rango</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Guerrero</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Puntuación</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {stats.map((player, index) => (
              <tr key={index} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-8 py-6 w-32 text-center">
                  <div className="flex justify-center items-center">
                    {index < 3 ? (
                      <div className="w-12 h-12">
                        <MedalSVG type={index === 0 ? 'diamond' : index === 1 ? 'gold' : 'silver'} />
                      </div>
                    ) : (
                      <span className="font-mono font-black text-sm text-slate-700 group-hover:text-slate-500 transition-colors">
                        #{(index + 1).toString().padStart(2, '0')}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-2xl border-2 overflow-hidden transition-transform group-hover:scale-105 ${index === 0 ? 'border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'border-slate-800'}`}>
                        {renderAvatar(player.discordUser?.avatar, player.playerName)}
                      </div>
                      {index === 0 && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span></span>}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-100 group-hover:text-white transition-colors tracking-tight">{player.playerName}</h4>
                      <p className="text-[9px] text-slate-600 font-bold uppercase tracking-[0.1em]">{player.guild === 'Principal' ? 'Lamu Principal' : 'Lamu Secundario'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <span className={`font-mono text-2xl font-black transition-colors ${index === 0 ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400' : index === 1 ? 'text-amber-500' : index === 2 ? 'text-slate-400' : 'text-slate-600 group-hover:text-slate-300'}`}>
                    {player.maxDamage.toLocaleString()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {stats.length === 0 && (
          <div className="py-24 text-center">
            <div className="text-4xl mb-4 opacity-20">💀</div>
            <p className="text-slate-600 font-black uppercase text-xs tracking-widest">Sin actividad reciente en el campo de batalla</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RankingTable;
