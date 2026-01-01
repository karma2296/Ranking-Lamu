
import React, { useState } from 'react';
import { PlayerStats } from '../types';

interface RankingTableProps {
  stats: PlayerStats[];
}

const MedalSVG = ({ type }: { type: 'diamond' | 'gold' | 'silver' }) => {
  const colors = {
    diamond: ['#fbbf24', '#f59e0b'], // Dorado intenso para el #1
    gold: ['#d1d5db', '#9ca3af'],    // Plata
    silver: ['#b45309', '#78350f']   // Bronce/Ámbar
  };
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100">
      <defs>
        <radialGradient id={`grad-${type}`} cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" style={{stopColor: colors[type][0], stopOpacity:1}} />
          <stop offset="100%" style={{stopColor: colors[type][1], stopOpacity:1}} />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="45" fill={`url(#grad-${type})`} />
      <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeDasharray="4 2" />
      <text x="50" y="68" textAnchor="middle" fill="white" fontSize="45" fontWeight="900" style={{textShadow: '0 2px 4px rgba(0,0,0,0.3)'}}>
        {type === 'diamond' ? '1' : type === 'gold' ? '2' : '3'}
      </text>
    </svg>
  );
};

const RankingTable: React.FC<RankingTableProps> = ({ stats }) => {
  const [isCopied, setIsCopied] = useState(false);
  const top3 = stats.slice(0, 3);

  const exportToDiscord = () => {
    let msg = `🥂 **RANKING FIN DE AÑO 2025/2026 - LAMU** 🎆\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    stats.forEach((p, i) => {
      const emoji = i === 0 ? '✨' : i === 1 ? '🥇' : i === 2 ? '🥈' : '🥉';
      msg += `${emoji} **${p.playerName}** » \`${p.accumulatedTotal.toLocaleString()}\` *(🔥 Máx Ticket: ${p.maxDailyTicket.toLocaleString()})*\n`;
    });
    navigator.clipboard.writeText(msg);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-end">
        <button onClick={exportToDiscord} className="bg-gradient-to-r from-amber-600 to-amber-400 px-6 py-3 rounded-xl font-black text-[10px] text-slate-950 uppercase tracking-widest shadow-lg hover:scale-105 transition-all">
          {isCopied ? '✅ COPIADO' : '🔗 EXPORTAR CELEBRACIÓN'}
        </button>
      </div>

      <div className="bg-slate-900 border border-amber-500/20 rounded-[3rem] overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 right-0 p-10 opacity-5 text-9xl pointer-events-none">⭐</div>
        <table className="w-full border-collapse relative z-10">
          <thead>
            <tr className="bg-slate-950/50 border-b border-slate-800">
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Rango</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Guerrero del Año</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Daño Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {stats.map((p, i) => (
              <tr key={i} className="hover:bg-amber-500/[0.03] transition-colors group">
                <td className="px-8 py-8 text-center w-24">
                  {i < 3 ? (
                    <div className="w-14 h-14 mx-auto drop-shadow-[0_0_10px_rgba(251,191,36,0.2)]">
                      <MedalSVG type={i === 0 ? 'diamond' : i === 1 ? 'gold' : 'silver'} />
                    </div>
                  ) : (
                    <span className="font-mono font-black text-slate-600">#{(i + 1).toString().padStart(2, '0')}</span>
                  )}
                </td>
                <td className="px-8 py-8">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img src={p.discordUser?.avatar || 'https://via.placeholder.com/100'} className="w-12 h-12 rounded-2xl border-2 border-slate-800 group-hover:border-amber-500/50 transition-all" />
                      {i === 0 && <span className="absolute -top-3 -right-3 text-xl animate-bounce">👑</span>}
                    </div>
                    <div>
                      <h4 className={`font-black tracking-tight ${i === 0 ? 'text-amber-400' : 'text-white'}`}>{p.playerName}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="bg-amber-500/10 text-amber-500 text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest">
                          ✨ Ticket Honor: {p.maxDailyTicket.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-8 text-right">
                  <div className="flex flex-col items-end">
                    <span className={`font-mono text-2xl font-black ${i === 0 ? 'golden-text' : 'text-slate-100'}`}>
                      {p.accumulatedTotal.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Puntos de Gremio</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RankingTable;
