
import React, { useState } from 'react';
import { PlayerStats } from '../types';

interface RankingTableProps {
  stats: PlayerStats[];
}

const MedalSVG = ({ type }: { type: 'sapphire' | 'platinum' | 'diamond' }) => {
  const colors = {
    sapphire: ['#0ea5e9', '#0c4a6e'], // Zafiro
    platinum: ['#f0f9ff', '#64748b'], // Platino
    diamond: ['#7dd3fc', '#0369a1']   // Diamante
  };
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100">
      <defs>
        <radialGradient id={`grad-${type}`} cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" style={{stopColor: colors[type][0], stopOpacity:1}} />
          <stop offset="100%" style={{stopColor: colors[type][1], stopOpacity:1}} />
        </radialGradient>
      </defs>
      <path d="M50 5 L95 25 L95 75 L50 95 L5 75 L5 25 Z" fill={`url(#grad-${type})`} />
      <path d="M50 15 L80 30 L80 70 L50 85 L20 70 L20 30 Z" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
      <text x="50" y="65" textAnchor="middle" fill="white" fontSize="40" fontWeight="900" style={{textShadow: '0 2px 10px rgba(0,0,0,0.5)', fontFamily: 'Space Grotesk'}}>
        {type === 'sapphire' ? '💎' : type === 'platinum' ? '💿' : '🔵'}
      </text>
    </svg>
  );
};

const RankingTable: React.FC<RankingTableProps> = ({ stats }) => {
  const [isCopied, setIsCopied] = useState(false);

  const exportToDiscord = () => {
    let msg = `🔵 **CHART REVOLUTION: BLUE ROSE PERFORMANCE** 🔵\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    stats.forEach((p, i) => {
      const emoji = i === 0 ? '👑' : i === 1 ? '💎' : i === 2 ? '💿' : '🔵';
      msg += `${emoji} **${p.playerName}** » \`${p.accumulatedTotal.toLocaleString()}\` *(⚡ Max: ${p.maxDailyTicket.toLocaleString()})*\n`;
    });
    navigator.clipboard.writeText(msg);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-end">
        <button onClick={exportToDiscord} className="bg-sky-600 hover:bg-sky-500 px-8 py-4 rounded-2xl font-black text-[10px] text-sky-950 uppercase tracking-[0.3em] shadow-xl shadow-sky-900/20 hover:scale-105 transition-all">
          {isCopied ? '✓ TRACKLIST COPIADA' : 'EXPORTAR REPORTE BLUE'}
        </button>
      </div>

      <div className="bg-sky-950/20 border-2 border-sky-900/20 rounded-[3rem] overflow-hidden shadow-2xl relative backdrop-blur-sm">
        <div className="absolute top-0 right-0 p-10 opacity-5 text-9xl pointer-events-none ado-title text-sky-400">ADO</div>
        <table className="w-full border-collapse relative z-10">
          <thead>
            <tr className="bg-black/30 border-b border-sky-900/30">
              <th className="px-8 py-7 text-[10px] font-black text-sky-700 uppercase tracking-[0.4em] text-center">RANK</th>
              <th className="px-8 py-7 text-[10px] font-black text-sky-700 uppercase tracking-[0.4em]">VOCALIST / RECORDS</th>
              <th className="px-8 py-7 text-[10px] font-black text-sky-700 uppercase tracking-[0.4em] text-right">GLOBAL SCORE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sky-900/20">
            {stats.map((p, i) => (
              <tr key={i} className="hover:bg-sky-400/[0.03] transition-colors group">
                <td className="px-8 py-10 text-center w-24 align-top">
                  {i < 3 ? (
                    <div className="w-14 h-14 mx-auto drop-shadow-[0_0_20px_rgba(14,165,233,0.4)] transform group-hover:scale-110 transition-transform mt-2">
                      <MedalSVG type={i === 0 ? 'sapphire' : i === 1 ? 'diamond' : 'platinum'} />
                    </div>
                  ) : (
                    <span className="font-mono font-black text-sky-900 text-lg italic block mt-5">#{i + 1}</span>
                  )}
                </td>
                <td className="px-8 py-10">
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <img src={p.discordUser?.avatar || 'https://via.placeholder.com/100'} className="w-16 h-16 rounded-2xl border-2 border-sky-900/40 group-hover:border-sky-400/50 transition-all shadow-xl" />
                        {i === 0 && <span className="absolute -top-4 -right-4 text-2xl drop-shadow-[0_0_10px_rgba(255,255,255,0.6)] animate-bounce">💙</span>}
                      </div>
                      <div>
                        <h4 className={`font-black ado-title text-xl tracking-tighter ${i === 0 ? 'text-sky-400' : 'text-white'}`}>{p.playerName}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="bg-sky-950/40 text-sky-600 text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest border border-sky-900/30">
                            BEST VERSE: {p.maxDailyTicket.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-10 text-right align-top">
                  <div className="flex flex-col items-end mt-2">
                    <span className={`font-mono text-3xl font-black italic tracking-tighter ${i === 0 ? 'text-sky-400 drop-shadow-[0_0_10px_rgba(14,165,233,0.4)]' : 'text-white'}`}>
                      {p.accumulatedTotal.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-sky-900 font-black uppercase tracking-[0.4em] mt-1 italic">TOTAL SCORE</span>
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
