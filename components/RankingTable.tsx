
import React from 'react';
import { PlayerStats } from '../types';

interface RankingTableProps {
  stats: PlayerStats[];
}

const RankingTable: React.FC<RankingTableProps> = ({ stats }) => {
  const top3 = stats.slice(0, 3);

  // URLs de las medallas (basadas en las proporcionadas)
  const MEDALS = {
    DIAMOND: 'https://raw.githubusercontent.com/Mizunone/skullgirls-assets/main/medals/diamond.png',
    GOLD: 'https://raw.githubusercontent.com/Mizunone/skullgirls-assets/main/medals/gold.png',
    SILVER: 'https://raw.githubusercontent.com/Mizunone/skullgirls-assets/main/medals/silver.png'
  };

  // Usamos proxies o placeholders si las imágenes no están disponibles, 
  // pero aquí configuramos la estructura para que luzcan increíbles.
  const diamondMedal = "https://i.ibb.co/XfXzSjY/diamond.png"; // Placeholder path
  const goldMedal = "https://i.ibb.co/vYm6zVp/gold.png";
  const silverMedal = "https://i.ibb.co/0M8z2Z3/silver.png";

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* PODIO VISUAL ESTILO SKULLGIRLS */}
      {top3.length > 0 && (
        <div className="grid grid-cols-3 gap-2 md:gap-6 items-end max-w-4xl mx-auto pt-16 pb-4">
          
          {/* TOP 2 - ORO */}
          {top3[1] ? (
            <div className="flex flex-col items-center group animate-in slide-in-from-left-8 duration-1000">
              <div className="relative mb-6">
                <div className="absolute -inset-2 bg-yellow-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative w-20 h-20 md:w-28 md:h-28">
                  {/* Imagen de Fondo (Medalla) */}
                  <img 
                    src="https://generativelabs-user-assets.s3.amazonaws.com/9796e6a18d1a45749f7e8a937a06981b/gold.png" 
                    className="absolute inset-0 w-full h-full object-contain z-20 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" 
                    alt="Oro" 
                  />
                  {/* Avatar del Jugador */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[55%] h-[55%] z-10 overflow-hidden rounded-full border-2 border-yellow-500/50">
                    <img 
                      src={top3[1].discordUser?.avatar || 'https://via.placeholder.com/100'} 
                      className="w-full h-full object-cover opacity-80" 
                      alt="P2" 
                    />
                  </div>
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-600 text-yellow-100 text-[8px] font-black px-2 py-0.5 rounded-full shadow-lg z-30 uppercase tracking-tighter border border-yellow-400">Rango Oro</div>
              </div>
              <p className="text-yellow-100/80 font-bold text-center text-xs truncate w-full px-2">{top3[1].playerName}</p>
              <p className="text-yellow-500 font-mono font-black text-[10px] mt-1">{top3[1].maxDamage.toLocaleString()}</p>
            </div>
          ) : <div />}

          {/* TOP 1 - DIAMANTE (CENTRO) */}
          {top3[0] && (
            <div className="flex flex-col items-center group -translate-y-8 animate-in zoom-in duration-1000">
              <div className="relative mb-6">
                {/* Aura Radiante Rosa/Violeta */}
                <div className="absolute -inset-8 bg-fuchsia-500/30 blur-3xl rounded-full animate-pulse"></div>
                <div className="relative w-28 h-28 md:w-40 md:h-40">
                  <img 
                    src="https://generativelabs-user-assets.s3.amazonaws.com/9796e6a18d1a45749f7e8a937a06981b/diamond.png" 
                    className="absolute inset-0 w-full h-full object-contain z-20 drop-shadow-[0_0_20px_rgba(217,70,239,0.6)]" 
                    alt="Diamante" 
                  />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[45%] w-[58%] h-[58%] z-10 overflow-hidden rounded-full border-2 border-fuchsia-400">
                    <img 
                      src={top3[0].discordUser?.avatar || 'https://via.placeholder.com/150'} 
                      className="w-full h-full object-cover" 
                      alt="P1" 
                    />
                  </div>
                </div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white text-[10px] font-black px-4 py-1 rounded-full shadow-2xl z-30 uppercase tracking-widest border border-fuchsia-300 animate-bounce">MVP</div>
              </div>
              <p className="text-white font-black text-center text-sm truncate w-full px-2 tracking-tight">{top3[0].playerName}</p>
              <p className="text-fuchsia-400 font-mono font-black text-lg drop-shadow-[0_0_8px_rgba(217,70,239,0.4)]">{top3[0].maxDamage.toLocaleString()}</p>
            </div>
          )}

          {/* TOP 3 - PLATA */}
          {top3[2] ? (
            <div className="flex flex-col items-center group animate-in slide-in-from-right-8 duration-1000">
              <div className="relative mb-6">
                <div className="absolute -inset-2 bg-slate-400/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative w-20 h-20 md:w-28 md:h-28">
                  <img 
                    src="https://generativelabs-user-assets.s3.amazonaws.com/9796e6a18d1a45749f7e8a937a06981b/silver.png" 
                    className="absolute inset-0 w-full h-full object-contain z-20 drop-shadow-[0_0_10px_rgba(148,163,184,0.4)]" 
                    alt="Plata" 
                  />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[55%] h-[55%] z-10 overflow-hidden rounded-full border-2 border-slate-400/50">
                    <img 
                      src={top3[2].discordUser?.avatar || 'https://via.placeholder.com/100'} 
                      className="w-full h-full object-cover opacity-70" 
                      alt="P3" 
                    />
                  </div>
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-700 text-slate-100 text-[8px] font-black px-2 py-0.5 rounded-full shadow-lg z-30 uppercase tracking-tighter border border-slate-400">Rango Plata</div>
              </div>
              <p className="text-slate-400 font-bold text-center text-xs truncate w-full px-2">{top3[2].playerName}</p>
              <p className="text-slate-300 font-mono font-black text-[10px] mt-1">{top3[2].maxDamage.toLocaleString()}</p>
            </div>
          ) : <div />}
        </div>
      )}

      {/* TABLA RESTANTE CON DISEÑO LIMPIO */}
      <div className="bg-slate-900/50 rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-2xl backdrop-blur-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-950/50 border-b border-slate-800">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Escalafón</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Guerrero</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Daño Máximo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {stats.length > 0 ? stats.map((player, index) => (
              <tr key={`${player.playerName}-${index}`} className="hover:bg-indigo-500/[0.03] transition-colors group">
                <td className="px-8 py-6 w-24">
                  <span className={`font-mono font-black text-sm ${
                    index === 0 ? 'text-fuchsia-500' : 
                    index === 1 ? 'text-yellow-500' : 
                    index === 2 ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    {(index + 1).toString().padStart(2, '0')}
                  </span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {player.discordUser?.avatar ? (
                        <img src={player.discordUser.avatar} className={`w-11 h-11 rounded-2xl object-cover border-2 ${
                          index === 0 ? 'border-fuchsia-500/50' : 
                          index === 1 ? 'border-yellow-500/50' : 
                          index === 2 ? 'border-slate-400/50' : 'border-slate-800'
                        }`} alt="Av" />
                      ) : (
                        <div className="w-11 h-11 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-xs">⚔️</div>
                      )}
                      {index < 3 && (
                        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-900 ${
                          index === 0 ? 'bg-fuchsia-500' : index === 1 ? 'bg-yellow-500' : 'bg-slate-400'
                        }`}></div>
                      )}
                    </div>
                    <div>
                      <h4 className={`font-bold transition-colors ${index === 0 ? 'text-fuchsia-100' : 'text-slate-100'}`}>{player.playerName}</h4>
                      <p className="text-[9px] text-slate-600 font-bold uppercase tracking-tight">
                        {player.guild === 'Principal' ? 'División I (Lamu)' : 'División II (Sec)'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <span className={`font-mono text-2xl font-black transition-all ${
                    index === 0 ? 'text-fuchsia-400 group-hover:text-fuchsia-300' : 
                    index === 1 ? 'text-yellow-500/90' : 
                    index === 2 ? 'text-slate-300' :
                    'text-slate-500 group-hover:text-white'
                  }`}>
                    {player.maxDamage.toLocaleString()}
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={3} className="px-8 py-24 text-center text-slate-700 uppercase text-[10px] font-black tracking-widest opacity-30 italic">
                  No hay guerreros registrados esta semana
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
