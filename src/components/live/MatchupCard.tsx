import React from 'react';
import { GameState, DefensivePosition, POSITION_NAMES } from '../../types/baseball';
import { getCurrentBatterSlot, getCurrentPitcher } from '../../engine/gameEngine';
import { calculateBoxScore } from '../../engine/statsEngine';

interface MatchupCardProps {
  state: GameState;
}

export const MatchupCard: React.FC<MatchupCardProps> = ({ state }) => {
  const currentBatterSlot = getCurrentBatterSlot(state);
  const currentPitcher = getCurrentPitcher(state);

  const battingTeam = state.isTop ? state.awayTeam : state.homeTeam;
  const pitchingTeam = state.isTop ? state.homeTeam : state.awayTeam;

  const nextIndex = state.isTop
    ? (state.awayLineupIndex + 1) % state.awayTeam.lineup.length
    : (state.homeLineupIndex + 1) % state.homeTeam.lineup.length;
  const nextBatter = battingTeam.lineup[nextIndex]?.player;

  // Calcul rapide des stats du jour pour le duel
  const boxScore = calculateBoxScore(state);
  const batterStats = (state.isTop ? boxScore.awayBatters : boxScore.homeBatters).find(
    (b) => b.playerId === currentBatterSlot.player.id
  );
  const pitcherStats = (state.isTop ? boxScore.homePitchers : boxScore.awayPitchers).find(
    (p) => p.playerId === currentPitcher.id
  );

  const posInfo = currentBatterSlot.position > 0 ? (POSITION_NAMES as Record<number, { code: string; label: string; shortFr: string }>)[currentBatterSlot.position] : undefined;

  return (
    <div className="bg-white border border-slate-300 rounded-2xl p-4 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-200">
        {/* FRAPPEUR EN COURS */}
        <div className="flex items-start gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-300 flex flex-col items-center justify-center text-amber-900 shrink-0 shadow-sm">
            <span className="text-[11px] uppercase font-bold text-amber-700">Ordre</span>
            <span className="text-2xl font-black">{currentBatterSlot.order}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                Au bâton ({battingTeam.name.split(' ')[0]})
              </span>
              <span className="text-sm font-black text-slate-600">
                #{currentBatterSlot.player.jerseyNumber}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 truncate mt-1">
              {currentBatterSlot.player.name}
            </h3>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 mt-1 font-semibold">
              <span>Pos : <strong className="text-slate-900">{posInfo?.shortFr || posInfo?.code}</strong></span>
              <span>•</span>
              <span>Auj : <strong className="text-red-600 font-mono text-sm">{batterStats?.h || 0}/{batterStats?.ab || 0}</strong> ({batterStats?.rbi || 0} RBI)</span>
            </div>
          </div>
        </div>

        {/* LANCEUR EN POSTE */}
        <div className="flex items-start gap-3.5 pt-3 md:pt-0 md:pl-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 border border-blue-300 flex flex-col items-center justify-center text-blue-900 shrink-0 shadow-sm">
            <span className="text-[11px] uppercase font-bold text-blue-700">Lanceur</span>
            <span className="text-lg font-black">#{currentPitcher.jerseyNumber}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                Au monticule ({pitchingTeam.name.split(' ')[0]})
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 truncate mt-1">
              {currentPitcher.name}
            </h3>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 mt-1 font-semibold">
              <span>Lancers : <strong className="text-blue-700 font-mono text-sm">{pitcherStats?.pitchCount || 0}</strong></span>
              <span>•</span>
              <span>K : <strong className="text-slate-900 font-mono">{pitcherStats?.so || 0}</strong></span>
              <span>•</span>
              <span>Hits : <strong className="text-slate-900 font-mono">{pitcherStats?.h || 0}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* PROCHAIN FRAPPEUR */}
      {nextBatter && (
        <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between text-xs sm:text-sm text-slate-600 font-medium">
          <span>Prochain frappeur (On Deck) : <strong className="text-slate-900 font-bold">{nextBatter.name} (#{nextBatter.jerseyNumber})</strong></span>
          <span className="text-slate-500 font-mono">Manche {state.currentInning} {state.isTop ? '▲ Top' : '▼ Bot'}</span>
        </div>
      )}
    </div>
  );
};
