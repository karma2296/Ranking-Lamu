
import React from 'react';
import { PlayerStats } from '../types';

interface RankingTableProps {
  stats: PlayerStats[];
}

const RankingTable: React.FC<RankingTableProps> = ({ stats }) => {
  const top3 = stats.slice(0, 3);

  const getMedalImg = (index: number) => {
    if (index === 0) return "https://generativelabs-user-assets.s3.amazonaws.com/9796e6a18d1a45749f7e8a937a06981b/diamond.png";
    if (index === 1) return "https://generativelabs-user-assets.s3.amazonaws.com/9796e6a18d1a45749f7e8a937a06981b/gold.png";
    if (index === 2) return "https://generativelabs-user-assets.s3.amazonaws.com/9796e6a18d1a45749f7e8a937a06981b/silver.png";
    return null;
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {top3.length > 0 && (
        <div className="grid grid-cols-3 gap-2 md:gap-6 items-end max-w-4xl mx-auto pt-20 pb-4">
          
          {/* TOP 2 - ORO (IZQUIERDA) */}
          {top3[1] ? (
            <div className="flex flex-col items-center group">
              <div className="relative mb-6">
                <div className="relative w-24 h-24 md:w-32 md:h-32">
                  <img src={getMedalImg(1)!} className="absolute inset-0 w-full h-full object-contain z-20 drop-shadow-2xl" alt="Oro" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[58%] h-[58%] z-10 overflow-hidden rounded-full">
                    <img src={top3[1].discordUser?.avatar || 'https://via.placeholder.com/100'} className="w-full h-full object-cover" alt="" />
                  </div>
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-600 text-white text-[8px] font-black px-3 py-1 rounded-full z-30 uppercase tracking-tighter shadow-lg">ORO</div>
              </div>
              <p className="text-yellow-100/80 font-bold text-center text-xs truncate w-full px-2">{top3[1].playerName}</p>
              <p className="text-yellow-500 font-mono font-black text-xs">{top3[1].maxDamage.toLocaleString()}</p>
            </div>
          ) : <div />}

          {/* TOP 1 - DIAMANTE (CENTRO) */}
          {top3[0] && (
            <div className="flex flex-col items-center group -translate-y-10">
              <div className="relative mb-6">
                {/* Brillo exterior para el MVP */}
                <div className="absolute -inset-10 bg-fuchsia-500/20 blur-[50px] rounded-full animate-pulse"></div>
                <div className="relative w-32 h-32 md:w-44 md:h-44 scale-110">
                  <img src={getMedalImg(0)!} className="absolute inset-0 w-full h-full object-contain z-20 drop-shadow-[0_0_25px_rgba(192,38,211,0.5)]" alt="Diamante" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[46%] w-[60%] h-[60%] z-10 overflow-hidden rounded-full">
                    <img src={top3[0].discordUser?.avatar || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" alt="" />
                  </div>
                </div>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white text-[10px] font-black px-5 py-1.5 rounded-full z-30 uppercase tracking-widest animate-bounce shadow-[0_0_15px_rgba(192,38,211,0.6)]">MVP</div>
              </div>
              <p className="text-white font-black text-center text-base truncate w-full tracking-tight">{top3[0].playerName}</p>
              <p className="text-fuchsia-400 font-mono font-black text-xl">{top3[0].maxDamage.toLocaleString()}</p>
            </div>
          )}

          {/* TOP 3 - PLATA (DERECHA) */}
          {top3[2] ? (
            <div className="flex flex-col items-center group">
              <div className="relative mb-6">
                <div className="relative w-24 h-24 md:w-32 md:h-32">
                  <img src={getMedalImg(2)!} className="absolute inset-0 w-full h-full object-contain z-20 drop-shadow-2xl" alt="Plata" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[58%] h-[58%] z-10 overflow-hidden rounded-full">
                    <img src={top3[2].discordUser?.avatar || 'https://via.placeholder.com/100'} className="w-full h-full object-cover" alt="" />
                  </div>
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-600 text-white text-[8px] font-black px-3 py-1 rounded-full z-30 uppercase tracking-tighter shadow-lg">PLATA</div>
              </div>
              <p className="text-slate-400 font-bold text-center text-xs truncate w-full px-2">{top3[2].playerName}</p>
              <p className="text-slate-300 font-mono font-black text-xs">{top3[2].maxDamage.toLocaleString()}</p>
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
                      <div className="relative w-10 h-10">
                        <img src={getMedalImg(index)!} className="w-full h-full object-contain animate-in zoom-in duration-500" alt="Medalla" />
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
                      <img src={player.discordUser?.avatar || 'https://via.placeholder.com/50'} className={`w-11 h-11 rounded-2xl border-2 ${index === 0 ? 'border-fuchsia-500/50' : 'border-slate-800'}`} alt="" />
                      {index === 0 && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuchsia-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-fuchsia-500"></span></span>}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-100 group-hover:text-white transition-colors">{player.playerName}</h4>
                      <p className="text-[9px] text-slate-600 font-bold uppercase tracking-tight">{player.guild === 'Principal' ? 'División I' : 'División II'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <span className={`font-mono text-2xl font-black transition-colors ${index === 0 ? 'text-fuchsia-400' : index === 1 ? 'text-yellow-500' : index === 2 ? 'text-slate-300' : 'text-slate-500 group-hover:text-slate-300'}`}>
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
