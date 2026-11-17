import React from 'react';
import { GameState } from '../../types/baseball';

interface ScoreBoardProps {
  state: GameState;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({ state }) => {
  const { awayTeam, homeTeam, currentInning, isTop, inningScores, awayScore, homeScore, awayHits, homeHits, awayErrors, homeErrors } = state;

  return (
    <div className="bg-white border border-slate-300 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-center border-collapse select-none">
          <thead>
            <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 font-black uppercase text-xs sm:text-sm tracking-wider">
              <th className="py-2.5 px-4 text-left w-44 sm:w-60">Équipes</th>
              {inningScores.map((inn) => (
                <th
                  key={inn.inningNumber}
                  className={`py-2.5 px-3 min-w-[36px] sm:min-w-[44px] ${
                    inn.inningNumber === currentInning
                      ? 'text-red-700 bg-red-50 font-black'
                      : ''
                  }`}
                >
                  {inn.inningNumber}
                </th>
              ))}
              <th className="py-2.5 px-3.5 min-w-[44px] text-red-700 bg-red-50 font-black border-l border-slate-300">
                R
              </th>
              <th className="py-2.5 px-3.5 min-w-[44px] text-slate-800 bg-slate-50 font-black">
                H
              </th>
              <th className="py-2.5 px-3.5 min-w-[44px] text-slate-600 bg-slate-50 font-black">
                E
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-mono text-sm sm:text-base font-bold">
            {/* ÉQUIPE VISITEUSE (AWAY) */}
            <tr className="hover:bg-slate-50 transition">
              <td className="py-3 px-4 text-left font-sans font-black text-slate-900 flex items-center gap-2 truncate text-sm sm:text-base">
                {isTop && (
                  <span className="text-red-600 font-black text-sm animate-pulse">
                    ▲
                  </span>
                )}
                <span className="truncate">{awayTeam.name}</span>
                <span className="text-xs text-slate-500 font-normal hidden sm:inline">(Vis.)</span>
              </td>
              {inningScores.map((inn) => {
                const isActiveCell = isTop && inn.inningNumber === currentInning;
                return (
                  <td
                    key={inn.inningNumber}
                    className={`py-2.5 px-2 ${
                      isActiveCell
                        ? 'bg-amber-100 text-amber-950 font-black ring-2 ring-amber-500 rounded-md'
                        : 'text-slate-800'
                    }`}
                  >
                    {inn.awayRuns !== null ? inn.awayRuns : '-'}
                  </td>
                );
              })}
              <td className="py-2.5 px-2.5 font-black text-red-600 text-base sm:text-xl bg-red-50/80 border-l border-slate-300">
                {awayScore}
              </td>
              <td className="py-2.5 px-2.5 text-slate-800 bg-slate-50 font-black">
                {awayHits}
              </td>
              <td className="py-2.5 px-2.5 text-slate-600 bg-slate-50 font-bold">
                {awayErrors}
              </td>
            </tr>

            {/* ÉQUIPE LOCALE (HOME) */}
            <tr className="hover:bg-slate-50 transition">
              <td className="py-3 px-4 text-left font-sans font-black text-slate-900 flex items-center gap-2 truncate text-sm sm:text-base">
                {!isTop && (
                  <span className="text-red-600 font-black text-sm animate-pulse">
                    ▼
                  </span>
                )}
                <span className="truncate">{homeTeam.name}</span>
                <span className="text-xs text-slate-500 font-normal hidden sm:inline">(Loc.)</span>
              </td>
              {inningScores.map((inn) => {
                const isActiveCell = !isTop && inn.inningNumber === currentInning;
                return (
                  <td
                    key={inn.inningNumber}
                    className={`py-2.5 px-2 ${
                      isActiveCell
                        ? 'bg-amber-100 text-amber-950 font-black ring-2 ring-amber-500 rounded-md'
                        : 'text-slate-800'
                    }`}
                  >
                    {inn.homeRuns !== null ? inn.homeRuns : '-'}
                  </td>
                );
              })}
              <td className="py-2.5 px-2.5 font-black text-red-600 text-base sm:text-xl bg-red-50/80 border-l border-slate-300">
                {homeScore}
              </td>
              <td className="py-2.5 px-2.5 text-slate-800 bg-slate-50 font-black">
                {homeHits}
              </td>
              <td className="py-2.5 px-2.5 text-slate-600 bg-slate-50 font-bold">
                {homeErrors}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
