
import React, { useState } from 'react';
import { PlayerStats } from '../types';

interface RankingTableProps {
  stats: PlayerStats[];
}

const MedalSVG = ({ type }: { type: 'diamond' | 'gold' | 'silver' }) => {
  const colors = {
    diamond: ['#00f2ff', '#c026d3'],
    gold: ['#fbbf24', '#d97706'],
    silver: ['#94a3b8', '#475569']
  };
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="45" fill="#0f172a" stroke={colors[type][0]} strokeWidth="4" />
      <text x="50" y="65" textAnchor="middle" fill={colors[type][0]} fontSize="40" fontWeight="900">
        {type === 'diamond' ? '1' : type === 'gold' ? '2' : '3'}
      </text>
    </svg>
  );
};

const RankingTable: React.FC<RankingTableProps> = ({ stats }) => {
  const [isCopied, setIsCopied] = useState(false);
  const top3 = stats.slice(0, 3);

  const exportToDiscord = () => {
    let msg = `🛡️ **RANKING GENERAL - GREMIO LAMU** 🛡️\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    stats.forEach((p, i) => {
      const emoji = i === 0 ? '💎' : i === 1 ? '🥇' : i === 2 ? '🥈' : '🥉';
      msg += `${emoji} **${p.playerName}** » \`${p.accumulatedTotal.toLocaleString()}\` *(🔥 Récord Hoy: ${p.maxDailyTicket.toLocaleString()})*\n`;
    });
    navigator.clipboard.writeText(msg);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-end">
        <button onClick={exportToDiscord} className="bg-[#5865F2] px-6 py-3 rounded-xl font-black text-[10px] text-white uppercase tracking-widest shadow-lg hover:scale-105 transition-all">
          {isCopied ? '✅ COPIADO' : '🔗 EXPORTAR PARA DISCORD'}
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-950/50 border-b border-slate-800">
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Rango</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Guerrero</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Daño Total Acumulado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {stats.map((p, i) => (
              <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-8 py-8 text-center w-24">
                  {i < 3 ? (
                    <div className="w-12 h-12 mx-auto">
                      <MedalSVG type={i === 0 ? 'diamond' : i === 1 ? 'gold' : 'silver'} />
                    </div>
                  ) : (
                    <span className="font-mono font-black text-slate-600">#{(i + 1).toString().padStart(2, '0')}</span>
                  )}
                </td>
                <td className="px-8 py-8">
                  <div className="flex items-center gap-4">
                    <img src={p.discordUser?.avatar || 'https://via.placeholder.com/100'} className="w-12 h-12 rounded-2xl border-2 border-slate-800" />
                    <div>
                      <h4 className="font-black text-white tracking-tight">{p.playerName}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="bg-emerald-500/10 text-emerald-500 text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest">
                          🔥 Récord Diario: {p.maxDailyTicket.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-8 text-right">
                  <div className="flex flex-col items-end">
                    <span className={`font-mono text-2xl font-black ${i === 0 ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400' : 'text-slate-100'}`}>
                      {p.accumulatedTotal.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Puntos Totales</span>
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
