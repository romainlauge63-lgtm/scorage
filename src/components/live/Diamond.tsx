import React, { useState } from 'react';
import { RunnersOnBase } from '../../types/baseball';
import { useGameStore } from '../../store/useGameStore';
import { ArrowUpRight, Check, X } from 'lucide-react';

interface DiamondProps {
  runners: RunnersOnBase;
}

export const Diamond: React.FC<DiamondProps> = ({ runners }) => {
  const { manualRunnerAdvance } = useGameStore();
  const [selectedBase, setSelectedBase] = useState<'first' | 'second' | 'third' | null>(null);

  const selectedRunner = selectedBase ? runners[selectedBase] : null;

  return (
    <div className="bg-white border border-slate-300 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col items-center relative overflow-hidden">
      <div className="text-xs sm:text-sm font-black text-slate-700 uppercase tracking-wider mb-2 self-start flex items-center justify-between w-full">
        <span>Coureurs sur base</span>
        <span className="text-xs text-slate-500 font-semibold">
          {runners.first || runners.second || runners.third ? 'Touchez une base ou un nom pour avancer/voler' : 'Bases vides'}
        </span>
      </div>

      {/* Terrain SVG */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 my-1">
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow select-none">
          {/* Surface intérieure du losange */}
          <polygon
            points="100,175 180,95 100,15 20,95"
            fill="#f1f5f9"
            stroke="#94a3b8"
            strokeWidth="3"
            strokeLinejoin="round"
          />

          {/* Lignes de course entre les buts */}
          <polygon
            points="100,165 165,100 100,35 35,100"
            fill="#ffffff"
            stroke="#cbd5e1"
            strokeWidth="2.5"
            strokeDasharray="4 4"
          />

          {/* Lignes de fausse balle */}
          <line x1="100" y1="175" x2="195" y2="80" stroke="#94a3b8" strokeWidth="2" strokeDasharray="3 3" />
          <line x1="100" y1="175" x2="5" y2="80" stroke="#94a3b8" strokeWidth="2" strokeDasharray="3 3" />

          {/* Monticule du lanceur (Pitcher's mound) */}
          <circle cx="100" cy="100" r="18" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5" />
          <rect x="94" y="98" width="12" height="4" fill="#64748b" rx="1" />

          {/* Marbre (Home Plate) */}
          <polygon
            points="95,178 105,178 108,170 100,164 92,170"
            fill="#ffffff"
            stroke="#334155"
            strokeWidth="2"
          />

          {/* 1ère Base (First Base) */}
          <g
            className="cursor-pointer transition-transform hover:scale-110"
            onClick={() => runners.first && setSelectedBase(selectedBase === 'first' ? null : 'first')}
          >
            {/* Zone tactile élargie pour clic facile */}
            <circle cx="165" cy="100" r="26" fill="transparent" />

            <rect
              x="152"
              y="87"
              width="26"
              height="26"
              transform="rotate(45 165 100)"
              fill={runners.first ? (selectedBase === 'first' ? '#d97706' : '#dc2626') : '#ffffff'}
              stroke={selectedBase === 'first' ? '#b45309' : runners.first ? '#b91c1c' : '#475569'}
              strokeWidth={selectedBase === 'first' ? 4 : 2}
              rx="3"
            />
            {runners.first && (
              <text x="165" y="104" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="900">
                1B
              </text>
            )}
          </g>

          {/* 2ème Base (Second Base) */}
          <g
            className="cursor-pointer transition-transform hover:scale-110"
            onClick={() => runners.second && setSelectedBase(selectedBase === 'second' ? null : 'second')}
          >
            {/* Zone tactile élargie pour clic facile */}
            <circle cx="100" cy="35" r="26" fill="transparent" />

            <rect
              x="87"
              y="22"
              width="26"
              height="26"
              transform="rotate(45 100 35)"
              fill={runners.second ? (selectedBase === 'second' ? '#d97706' : '#dc2626') : '#ffffff'}
              stroke={selectedBase === 'second' ? '#b45309' : runners.second ? '#b91c1c' : '#475569'}
              strokeWidth={selectedBase === 'second' ? 4 : 2}
              rx="3"
            />
            {runners.second && (
              <text x="100" y="39" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="900">
                2B
              </text>
            )}
          </g>

          {/* 3ème Base (Third Base) */}
          <g
            className="cursor-pointer transition-transform hover:scale-110"
            onClick={() => runners.third && setSelectedBase(selectedBase === 'third' ? null : 'third')}
          >
            {/* Zone tactile élargie pour clic facile */}
            <circle cx="35" cy="100" r="26" fill="transparent" />

            <rect
              x="22"
              y="87"
              width="26"
              height="26"
              transform="rotate(45 35 100)"
              fill={runners.third ? (selectedBase === 'third' ? '#d97706' : '#dc2626') : '#ffffff'}
              stroke={selectedBase === 'third' ? '#b45309' : runners.third ? '#b91c1c' : '#475569'}
              strokeWidth={selectedBase === 'third' ? 4 : 2}
              rx="3"
            />
            {runners.third && (
              <text x="35" y="104" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="900">
                3B
              </text>
            )}
          </g>
        </svg>

        {/* Étiquettes nominatives cliquables des coureurs (dégagées des carrés) */}
        {runners.first && (
          <button
            type="button"
            onClick={() => setSelectedBase(selectedBase === 'first' ? null : 'first')}
            className={`absolute right-0 top-[58%] z-10 transition-all cursor-pointer active:scale-95 px-2.5 py-1 rounded-xl shadow-md flex items-center gap-1.5 max-w-[130px] border ${
              selectedBase === 'first'
                ? 'bg-amber-500 border-amber-600 text-slate-950 font-black ring-4 ring-amber-300 scale-105'
                : 'bg-red-600 hover:bg-red-700 border-red-700 text-white font-black'
            }`}
            title="Cliquer pour gérer le coureur en 1B"
          >
            <span className="w-2 h-2 rounded-full bg-white flex-shrink-0"></span>
            <span className="text-xs sm:text-sm truncate">
              #{runners.first.jerseyNumber} {runners.first.name.split(' ')[0]}
            </span>
          </button>
        )}

        {runners.second && (
          <button
            type="button"
            onClick={() => setSelectedBase(selectedBase === 'second' ? null : 'second')}
            className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 z-10 transition-all cursor-pointer active:scale-95 px-2.5 py-1 rounded-xl shadow-md flex items-center gap-1.5 max-w-[150px] border ${
              selectedBase === 'second'
                ? 'bg-amber-500 border-amber-600 text-slate-950 font-black ring-4 ring-amber-300 scale-105'
                : 'bg-red-600 hover:bg-red-700 border-red-700 text-white font-black'
            }`}
            title="Cliquer pour gérer le coureur en 2B"
          >
            <span className="w-2 h-2 rounded-full bg-white flex-shrink-0"></span>
            <span className="text-xs sm:text-sm truncate">
              #{runners.second.jerseyNumber} {runners.second.name.split(' ')[0]}
            </span>
          </button>
        )}

        {runners.third && (
          <button
            type="button"
            onClick={() => setSelectedBase(selectedBase === 'third' ? null : 'third')}
            className={`absolute left-0 top-[58%] z-10 transition-all cursor-pointer active:scale-95 px-2.5 py-1 rounded-xl shadow-md flex items-center gap-1.5 max-w-[130px] border ${
              selectedBase === 'third'
                ? 'bg-amber-500 border-amber-600 text-slate-950 font-black ring-4 ring-amber-300 scale-105'
                : 'bg-red-600 hover:bg-red-700 border-red-700 text-white font-black'
            }`}
            title="Cliquer pour gérer le coureur en 3B"
          >
            <span className="w-2 h-2 rounded-full bg-white flex-shrink-0"></span>
            <span className="text-xs sm:text-sm truncate">
              #{runners.third.jerseyNumber} {runners.third.name.split(' ')[0]}
            </span>
          </button>
        )}
      </div>

      {/* Raccourcis directs de sélection sous le terrain */}
      {(runners.first || runners.second || runners.third) && (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-3 w-full border-t border-slate-200 pt-2.5">
          <span className="text-xs font-black text-slate-600 uppercase tracking-wide">
            Gérer :
          </span>
          {runners.first && (
            <button
              type="button"
              onClick={() => setSelectedBase(selectedBase === 'first' ? null : 'first')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 active:scale-95 shadow-sm ${
                selectedBase === 'first'
                  ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400'
                  : 'bg-red-50 hover:bg-red-100 text-red-800 border border-red-300'
              }`}
            >
              <span className="px-1.5 py-0.5 rounded bg-red-600 text-white font-mono text-[10px]">1B</span>
              <span>#{runners.first.jerseyNumber} {runners.first.name}</span>
            </button>
          )}
          {runners.second && (
            <button
              type="button"
              onClick={() => setSelectedBase(selectedBase === 'second' ? null : 'second')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 active:scale-95 shadow-sm ${
                selectedBase === 'second'
                  ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400'
                  : 'bg-red-50 hover:bg-red-100 text-red-800 border border-red-300'
              }`}
            >
              <span className="px-1.5 py-0.5 rounded bg-red-600 text-white font-mono text-[10px]">2B</span>
              <span>#{runners.second.jerseyNumber} {runners.second.name}</span>
            </button>
          )}
          {runners.third && (
            <button
              type="button"
              onClick={() => setSelectedBase(selectedBase === 'third' ? null : 'third')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 active:scale-95 shadow-sm ${
                selectedBase === 'third'
                  ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400'
                  : 'bg-red-50 hover:bg-red-100 text-red-800 border border-red-300'
              }`}
            >
              <span className="px-1.5 py-0.5 rounded bg-red-600 text-white font-mono text-[10px]">3B</span>
              <span>#{runners.third.jerseyNumber} {runners.third.name}</span>
            </button>
          )}
        </div>
      )}

      {/* Menu contextuel tactile pour avancer ou retirer un coureur sélectionné */}
      {selectedBase && selectedRunner && (
        <div className="w-full mt-3 p-3 bg-amber-50 border-2 border-amber-400 rounded-xl animate-in fade-in slide-in-from-bottom-2 text-xs sm:text-sm shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="font-black text-amber-950 text-sm">
              Coureur en {selectedBase === 'first' ? '1B' : selectedBase === 'second' ? '2B' : '3B'} : #{selectedRunner.jerseyNumber} {selectedRunner.name}
            </span>
            <button
              onClick={() => setSelectedBase(null)}
              className="text-slate-600 hover:text-slate-900 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {selectedBase === 'first' && (
              <button
                onClick={() => {
                  manualRunnerAdvance('first', 'second');
                  setSelectedBase(null);
                }}
                className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-900 px-3 py-1.5 rounded-lg border border-slate-300 font-bold shadow-sm"
              >
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                Avance en 2B (Vol/Passé)
              </button>
            )}

            {(selectedBase === 'first' || selectedBase === 'second') && (
              <button
                onClick={() => {
                  manualRunnerAdvance(selectedBase, 'third');
                  setSelectedBase(null);
                }}
                className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-900 px-3 py-1.5 rounded-lg border border-slate-300 font-bold shadow-sm"
              >
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                Avance en 3B
              </button>
            )}

            <button
              onClick={() => {
                manualRunnerAdvance(selectedBase, 'home');
                setSelectedBase(null);
              }}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-black shadow-sm"
            >
              <Check className="w-4 h-4" />
              Marque au marbre (+1 Point)
            </button>

            <button
              onClick={() => {
                manualRunnerAdvance(selectedBase, 'out');
                setSelectedBase(null);
              }}
              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg font-black shadow-sm"
            >
              <X className="w-4 h-4" />
              Retrait sur base (Pickoff / Vol raté)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
