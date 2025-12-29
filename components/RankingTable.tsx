
import React from 'react';
import { PlayerStats } from '../types';

interface RankingTableProps {
  stats: PlayerStats[];
}

const RankingTable: React.FC<RankingTableProps> = ({ stats }) => {
  const top3 = stats.slice(0, 3);
  const rest = stats.slice(3);

  const copyToDiscord = () => {
    let text = "🏆 **RANKING SEMANAL - GREMIO LAMU** 🏆\n";
    text += "```md\n";
    text += "P | JUGADOR         | DAÑO TOTAL\n";
    text += "---------------------------------\n";
    stats.slice(0, 10).forEach((p, i) => {
      const rank = (i + 1).toString().padEnd(2, ' ');
      const name = p.playerName.padEnd(15, ' ').substring(0, 15);
      const dmg = p.maxDamage.toLocaleString().padStart(12, ' ');
      text += `${rank}| ${name} | ${dmg}\n`;
    });
    text += "```\n";
    text += "✨ *¡Sigan atacando para subir en el top!*";
    
    navigator.clipboard.writeText(text);
    alert("¡Copiado! Ahora puedes pegarlo en Discord (Ctrl+V)");
  };

  return (
    <div className="space-y-12">
      {/* BOTÓN DE COPIAR PARA DISCORD */}
      {stats.length > 0 && (
        <div className="flex justify-end">
          <button 
            onClick={copyToDiscord}
            className="text-[10px] font-black bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-indigo-400 px-4 py-2 rounded-full border border-slate-700 transition-all flex items-center gap-2 uppercase tracking-widest"
          >
            <span>📋</span> Copiar Top 10 para Discord
          </button>
        </div>
      )}

      {/* PODIO VISUAL */}
      {top3.length > 0 && (
        <div className="grid grid-cols-3 gap-2 md:gap-6 items-end max-w-4xl mx-auto pt-10 pb-4">
          {/* Segundo Lugar */}
          {top3[1] && (
            <div className="flex flex-col items-center group">
              <div className="relative mb-4">
                <div className="w-16 h-16 md:w-24 md:h-24 rounded-2xl bg-slate-800 border-2 border-slate-400 shadow-[0_0_20px_rgba(148,163,184,0.2)] flex items-center justify-center text-3xl md:text-5xl group-hover:scale-105 transition-transform">🥈</div>
                <div className="absolute -top-3 -right-3 bg-slate-400 text-slate-900 text-[10px] font-black px-2 py-1 rounded-md shadow-lg">#2</div>
              </div>
              <p className="text-slate-300 font-bold text-center text-xs md:text-sm truncate w-full">{top3[1].playerName}</p>
              <p className="text-slate-500 font-mono text-[10px] md:text-xs">{top3[1].maxDamage.toLocaleString()}</p>
            </div>
          )}

          {/* Primer Lugar */}
          {top3[0] && (
            <div className="flex flex-col items-center group -translate-y-6">
              <div className="relative mb-4">
                <div className="absolute -inset-4 bg-yellow-500/20 blur-2xl rounded-full animate-pulse"></div>
                <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-slate-800 border-4 border-yellow-500 shadow-[0_0_40px_rgba(234,179,8,0.3)] flex items-center justify-center text-5xl md:text-7xl group-hover:scale-110 transition-transform z-10">🥇</div>
                <div className="absolute -top-4 -right-4 bg-yellow-500 text-yellow-950 text-xs font-black px-3 py-1 rounded-lg shadow-xl z-20 animate-bounce">MVP</div>
              </div>
              <p className="text-white font-black text-center text-sm md:text-lg truncate w-full tracking-tight">{top3[0].playerName}</p>
              <p className="text-yellow-500 font-mono font-bold text-xs md:text-sm drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">{top3[0].maxDamage.toLocaleString()}</p>
            </div>
          )}

          {/* Tercer Lugar */}
          {top3[2] && (
            <div className="flex flex-col items-center group">
              <div className="relative mb-4">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-slate-800 border-2 border-amber-700 shadow-[0_0_20px_rgba(180,83,9,0.2)] flex items-center justify-center text-3xl md:text-4xl group-hover:scale-105 transition-transform">🥉</div>
                <div className="absolute -top-3 -right-3 bg-amber-700 text-amber-100 text-[10px] font-black px-2 py-1 rounded-md shadow-lg">#3</div>
              </div>
              <p className="text-slate-300 font-bold text-center text-xs md:text-sm truncate w-full">{top3[2].playerName}</p>
              <p className="text-slate-500 font-mono text-[10px] md:text-xs">{top3[2].maxDamage.toLocaleString()}</p>
            </div>
          )}
        </div>
      )}

      {/* TABLA RESTANTE */}
      <div className="bg-slate-900/50 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-slate-800/40">
            <tr>
              <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Pos</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Guerrero / División</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Daño Máximo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {stats.map((player, index) => (
              <tr key={player.playerName} className="hover:bg-indigo-500/[0.03] transition-colors group">
                <td className="px-6 py-6">
                  <span className={`font-mono font-black text-sm ${index < 3 ? 'text-indigo-400' : 'text-slate-600'}`}>
                    {(index + 1).toString().padStart(2, '0')}
                  </span>
                </td>
                <td className="px-6 py-6">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100 group-hover:text-white transition-colors">
                          {player.playerName}
                        </span>
                        {player.totalEntries === 1 && (
                          <span className="bg-emerald-500/10 text-emerald-500 text-[8px] px-1.5 py-0.5 rounded font-black uppercase border border-emerald-500/20">Nuevo</span>
                        )}
                      </div>
                      <span className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${
                        player.guild === 'Principal' ? 'text-indigo-500' : 'text-amber-500'
                      }`}>
                        {player.guild === 'Principal' ? 'Lamu I' : 'Lamu II'}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-6 text-right">
                  <div className="flex flex-col items-end">
                    <span className="font-mono text-xl font-black text-white group-hover:text-emerald-400 transition-colors">
                      {player.maxDamage.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-600 font-bold uppercase">Ataques: {player.totalEntries}</span>
                  </div>
                </td>
              </tr>
            ))}
            {stats.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-4 opacity-30">
                    <span className="text-5xl">🛡️</span>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Esperando los primeros reportes de la semana</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RankingTable;
