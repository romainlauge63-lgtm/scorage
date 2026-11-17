import React from 'react';
import { PlayRecord } from '../../types/baseball';
import { History, Clock } from 'lucide-react';

interface PlaysTimelineProps {
  plays: PlayRecord[];
}

export const PlaysTimeline: React.FC<PlaysTimelineProps> = ({ plays }) => {
  return (
    <div className="bg-white border border-slate-300 rounded-2xl p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2.5">
        <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <History className="w-4 h-4 text-red-600" />
          Fil des actions (Play-by-play)
        </h3>
        <span className="text-xs text-slate-500 font-bold">
          {plays.length} action{plays.length > 1 ? 's' : ''} enregistrée{plays.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto pr-1 select-none">
        {plays.length === 0 ? (
          <p className="text-sm text-slate-500 italic py-6 text-center">
            Aucune action pour le moment. Utilisez les boutons du pavé tactile ci-contre pour démarrer le scorage.
          </p>
        ) : (
          plays.map((play) => {
            const isHit = ['SINGLE', 'DOUBLE', 'TRIPLE', 'HOMERUN'].includes(play.type);
            const isOut = ['STRIKEOUT', 'GROUNDOUT', 'FLYOUT', 'LINEOUT', 'SACRIFICE_FLY'].includes(play.type);
            const isHR = play.type === 'HOMERUN';

            return (
              <div
                key={play.id}
                className={`p-2.5 rounded-xl text-xs sm:text-sm border flex items-start justify-between gap-2.5 transition ${
                  isHR
                    ? 'bg-amber-100/70 border-amber-400 text-amber-950 font-black shadow-sm'
                    : isHit
                    ? 'bg-blue-50/80 border-blue-300 text-blue-950 font-bold'
                    : isOut
                    ? 'bg-rose-50/80 border-rose-300 text-rose-950 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-0.5">
                    <span className="font-black text-slate-800">
                      M{play.inning} {play.isTop ? '▲' : '▼'}
                    </span>
                    <span>•</span>
                    <span>{play.batterName}</span>
                    <span>vs</span>
                    <span>{play.pitcherName}</span>
                  </div>
                  <div className="font-extrabold truncate text-slate-900">
                    {play.description}
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs text-slate-500 font-mono shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                  {play.timestamp}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
