
import React from 'react';
import { PlayerStats } from '../types';

interface RankingTableProps {
  stats: PlayerStats[];
}

const RankingTable: React.FC<RankingTableProps> = ({ stats }) => {
  return (
    <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
      <table className="w-full text-left">
        <thead className="bg-slate-800/50">
          <tr>
            <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Puesto</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Jugador / Gremio</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Daño Máximo</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {stats.map((player) => (
            <tr key={player.playerName} className="hover:bg-slate-800/30 transition-colors group">
              <td className="px-6 py-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  player.rank === 1 ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]' :
                  player.rank === 2 ? 'bg-slate-300/20 text-slate-300 border border-slate-300/50' :
                  player.rank === 3 ? 'bg-amber-600/20 text-amber-600 border border-amber-600/50' :
                  'text-slate-500 bg-slate-800/50'
                }`}>
                  {player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : player.rank === 3 ? '🥉' : player.rank}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-200 text-lg">{player.playerName}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter border ${
                    player.guild === 'Principal' 
                      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' 
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}>
                    {player.guild === 'Principal' ? 'Lamu I' : 'Lamu II'}
                  </span>
                </div>
                <div className="text-xs text-slate-500">Registros: {player.totalEntries}</div>
              </td>
              <td className="px-6 py-4 text-right">
                <span className="font-mono text-2xl font-black text-emerald-400 drop-shadow-sm">
                  {player.maxDamage.toLocaleString()}
                </span>
              </td>
            </tr>
          ))}
          {stats.length === 0 && (
            <tr>
              <td colSpan={3} className="px-6 py-12 text-center text-slate-500 italic">
                Aún no hay guerreros en el ranking de Lamu.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default RankingTable;
