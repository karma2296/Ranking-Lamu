
import React from 'react';
import { PlayerStats } from '../types';

interface RankingTableProps {
  stats: PlayerStats[];
}

const RankingTable: React.FC<RankingTableProps> = ({ stats }) => {
  const top3 = stats.slice(0, 3);

  return (
    <div className="space-y-12">
      {/* PODIO VISUAL */}
      {top3.length > 0 && (
        <div className="grid grid-cols-3 gap-2 md:gap-6 items-end max-w-4xl mx-auto pt-10 pb-4">
          {/* Segundo Lugar */}
          {top3[1] && (
            <div className="flex flex-col items-center group">
              <div className="relative mb-4">
                {top3[1].discordUser?.avatar ? (
                  <img src={top3[1].discordUser.avatar} className="w-16 h-16 md:w-24 md:h-24 rounded-2xl border-2 border-slate-400 shadow-xl" alt="P2" />
                ) : (
                  <div className="w-16 h-16 md:w-24 md:h-24 rounded-2xl bg-slate-800 border-2 border-slate-400 flex items-center justify-center text-3xl">🥈</div>
                )}
                <div className="absolute -top-2 -right-2 bg-slate-400 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded shadow-lg">#2</div>
              </div>
              <p className="text-slate-300 font-bold text-center text-xs truncate w-full">{top3[1].playerName}</p>
            </div>
          )}

          {/* Primer Lugar */}
          {top3[0] && (
            <div className="flex flex-col items-center group -translate-y-6">
              <div className="relative mb-4">
                <div className="absolute -inset-4 bg-yellow-500/20 blur-2xl rounded-full animate-pulse"></div>
                {top3[0].discordUser?.avatar ? (
                  <img src={top3[0].discordUser.avatar} className="relative w-24 h-24 md:w-32 md:h-32 rounded-3xl border-4 border-yellow-500 shadow-2xl z-10" alt="P1" />
                ) : (
                  <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-slate-800 border-4 border-yellow-500 flex items-center justify-center text-5xl z-10">🥇</div>
                )}
                <div className="absolute -top-3 -right-3 bg-yellow-500 text-yellow-950 text-xs font-black px-3 py-1 rounded-lg shadow-xl z-20">MVP</div>
              </div>
              <p className="text-white font-black text-center text-sm truncate w-full">{top3[0].playerName}</p>
              <p className="text-yellow-500 font-mono font-bold text-xs">{top3[0].maxDamage.toLocaleString()}</p>
            </div>
          )}

          {/* Tercer Lugar */}
          {top3[2] && (
            <div className="flex flex-col items-center group">
              <div className="relative mb-4">
                {top3[2].discordUser?.avatar ? (
                  <img src={top3[2].discordUser.avatar} className="w-16 h-16 md:w-20 md:h-20 rounded-2xl border-2 border-amber-700 shadow-xl" alt="P3" />
                ) : (
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-slate-800 border-2 border-amber-700 flex items-center justify-center text-3xl">🥉</div>
                )}
                <div className="absolute -top-2 -right-2 bg-amber-700 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-lg">#3</div>
              </div>
              <p className="text-slate-300 font-bold text-center text-xs truncate w-full">{top3[2].playerName}</p>
            </div>
          )}
        </div>
      )}

      {/* TABLA RESTANTE */}
      <div className="bg-slate-900/50 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <tbody className="divide-y divide-slate-800/50">
            {stats.map((player, index) => (
              <tr key={player.playerName} className="hover:bg-indigo-500/[0.03] transition-colors group">
                <td className="px-6 py-6 w-16">
                  <span className={`font-mono font-black text-sm ${index < 3 ? 'text-indigo-400' : 'text-slate-600'}`}>
                    {(index + 1).toString().padStart(2, '0')}
                  </span>
                </td>
                <td className="px-6 py-6">
                  <div className="flex items-center gap-4">
                    {player.discordUser?.avatar ? (
                      <img src={player.discordUser.avatar} className="w-10 h-10 rounded-xl border border-slate-800" alt="Av" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center">⚔️</div>
                    )}
                    <div>
                      <h4 className="font-bold text-slate-100">{player.playerName}</h4>
                      <p className="text-[9px] text-slate-600 font-bold uppercase">{player.guild === 'Principal' ? 'Lamu I' : 'Lamu II'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-6 text-right">
                  <span className="font-mono text-xl font-black text-white group-hover:text-emerald-400 transition-colors">
                    {player.maxDamage.toLocaleString()}
                  </span>
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
