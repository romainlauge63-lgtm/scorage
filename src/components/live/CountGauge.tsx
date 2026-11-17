import React from 'react';
import { Count } from '../../types/baseball';

interface CountGaugeProps {
  count: Count;
  inning: number;
  isTop: boolean;
}

export const CountGauge: React.FC<CountGaugeProps> = ({ count, inning, isTop }) => {
  return (
    <div className="bg-white border border-slate-300 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4">
      {/* Indicateur de manche */}
      <div className="flex flex-col items-center justify-center bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 min-w-[85px]">
        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
          Manche
        </div>
        <div className="flex items-center gap-1 text-2xl sm:text-3xl font-black text-red-600">
          <span>{isTop ? '▲' : '▼'}</span>
          <span>{inning}</span>
        </div>
        <span className="text-[11px] text-slate-600 font-bold">
          {isTop ? 'Début (Top)' : 'Fin (Bottom)'}
        </span>
      </div>

      {/* Jauge B-S-O */}
      <div className="flex-1 grid grid-cols-3 gap-3">
        {/* BALLES (B) - Max 3 dots */}
        <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 flex flex-col items-center">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-sm sm:text-base font-black text-emerald-800">B</span>
            <span className="text-xs text-emerald-700 font-bold hidden sm:inline">Balles</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {[1, 2, 3].map((num) => (
              <span
                key={num}
                className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full transition-all duration-200 border-2 ${
                  count.balls >= num
                    ? 'bg-emerald-500 border-emerald-700 shadow-md scale-110'
                    : 'bg-white border-emerald-300'
                }`}
              />
            ))}
          </div>
          <span className="mt-1 font-mono text-sm sm:text-base font-black text-emerald-900">{count.balls}</span>
        </div>

        {/* STRIKES (S) - Max 2 dots */}
        <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 flex flex-col items-center">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-sm sm:text-base font-black text-amber-800">S</span>
            <span className="text-xs text-amber-700 font-bold hidden sm:inline">Strikes</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {[1, 2].map((num) => (
              <span
                key={num}
                className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full transition-all duration-200 border-2 ${
                  count.strikes >= num
                    ? 'bg-amber-500 border-amber-700 shadow-md scale-110'
                    : 'bg-white border-amber-300'
                }`}
              />
            ))}
          </div>
          <span className="mt-1 font-mono text-sm sm:text-base font-black text-amber-900">{count.strikes}</span>
        </div>

        {/* RETRAITS (O) - Max 2 dots */}
        <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-200 flex flex-col items-center">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-sm sm:text-base font-black text-rose-800">O</span>
            <span className="text-xs text-rose-700 font-bold hidden sm:inline">Retraits</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {[1, 2].map((num) => (
              <span
                key={num}
                className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full transition-all duration-200 border-2 ${
                  count.outs >= num
                    ? 'bg-rose-600 border-rose-800 shadow-md scale-110'
                    : 'bg-white border-rose-300'
                }`}
              />
            ))}
          </div>
          <span className="mt-1 font-mono text-sm sm:text-base font-black text-rose-900">{count.outs}</span>
        </div>
      </div>
    </div>
  );
};
