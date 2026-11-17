import React from 'react';
import { PlayType, HitZoneNumber } from '../../types/baseball';
import { Compass, X, Target } from 'lucide-react';

interface HitDirectionModalProps {
  isOpen: boolean;
  actionType: PlayType;
  batterName?: string;
  onClose: () => void;
  onSelectZone: (zone: HitZoneNumber) => void;
}

export const HitDirectionModal: React.FC<HitDirectionModalProps> = ({
  isOpen,
  actionType,
  batterName,
  onClose,
  onSelectZone,
}) => {
  if (!isOpen) return null;

  const isGroundout = actionType === 'GROUNDOUT' || actionType === 'SACRIFICE_BUNT';
  const isFlyOrLine = actionType === 'FLYOUT' || actionType === 'LINEOUT' || actionType === 'POPOUT' || actionType === 'SACRIFICE_FLY';

  const getActionTitle = () => {
    switch (actionType) {
      case 'SINGLE': return { title: 'Simple (1B)', color: 'text-blue-700 bg-blue-50 border-blue-200' };
      case 'DOUBLE': return { title: 'Double (2B)', color: 'text-blue-700 bg-blue-50 border-blue-200' };
      case 'TRIPLE': return { title: 'Triple (3B)', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
      case 'HOMERUN': return { title: 'Home Run (HR)', color: 'text-amber-700 bg-amber-50 border-amber-200' };
      case 'FLYOUT': return { title: 'Balle en volée (FO)', color: 'text-slate-700 bg-slate-100 border-slate-300' };
      case 'LINEOUT': return { title: 'Balle en ligne (LO)', color: 'text-slate-700 bg-slate-100 border-slate-300' };
      case 'POPOUT': return { title: 'Petite chandelle (PO)', color: 'text-slate-700 bg-slate-100 border-slate-300' };
      case 'GROUNDOUT': return { title: 'Roulant (GO)', color: 'text-slate-700 bg-slate-100 border-slate-300' };
      case 'SACRIFICE_FLY': return { title: 'Balle sacrifice (SF)', color: 'text-purple-700 bg-purple-50 border-purple-200' };
      case 'SACRIFICE_BUNT': return { title: 'Amorti sacrifice (SH)', color: 'text-purple-700 bg-purple-50 border-purple-200' };
      default: return { title: actionType, color: 'text-slate-700 bg-slate-100 border-slate-300' };
    }
  };

  const getNotation = (zone: HitZoneNumber) => {
    switch (actionType) {
      case 'SINGLE': return `-${zone}`;
      case 'DOUBLE': return `≠${zone}`;
      case 'TRIPLE': return `≡${zone}`;
      case 'HOMERUN': return `HR${zone}`;
      case 'FLYOUT': return `F${zone}`;
      case 'LINEOUT': return `L${zone}`;
      case 'POPOUT': return `P${zone}`;
      case 'SACRIFICE_FLY': return `SF${zone}`;
      case 'GROUNDOUT': return zone === 3 ? '3-u' : `${zone}3`;
      case 'SACRIFICE_BUNT': return `SH${zone}3`;
      default: return `${zone}`;
    }
  };

  const badge = getActionTitle();

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-white border border-slate-300 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl text-slate-900 space-y-4 my-auto">
        {/* En-tête */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-sm">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 text-base sm:text-lg leading-tight">
                  Direction de la frappe
                </h3>
                <span className={`px-2 py-0.5 rounded-lg text-xs font-black border ${badge.color}`}>
                  {badge.title}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-semibold">
                {batterName ? `Frappeur : ${batterName}` : 'Sélectionnez où la balle a été frappée'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-800 p-1.5 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. CHAMP EXTÉRIEUR (OUTFIELD) : 7, 8, 9 */}
        <div>
          <div className="text-xs font-black text-slate-600 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Champ extérieur (Outfield)</span>
            <span className="text-[11px] text-slate-400 font-medium">1 clic pour valider</span>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              onClick={() => onSelectZone(7)}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 active:scale-95 border-2 border-blue-300 transition shadow-sm group"
            >
              <span className="text-xs font-bold text-blue-600 group-hover:text-blue-800">Zone 7</span>
              <span className="text-sm sm:text-base font-black text-blue-950">Gauche</span>
              <span className="text-[11px] font-mono font-bold bg-white px-2 py-0.5 rounded border border-blue-200 text-blue-800 mt-1">
                {getNotation(7)}
              </span>
            </button>

            <button
              onClick={() => onSelectZone(8)}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 active:scale-95 border-2 border-blue-300 transition shadow-sm group"
            >
              <span className="text-xs font-bold text-blue-600 group-hover:text-blue-800">Zone 8</span>
              <span className="text-sm sm:text-base font-black text-blue-950">Centre</span>
              <span className="text-[11px] font-mono font-bold bg-white px-2 py-0.5 rounded border border-blue-200 text-blue-800 mt-1">
                {getNotation(8)}
              </span>
            </button>

            <button
              onClick={() => onSelectZone(9)}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 active:scale-95 border-2 border-blue-300 transition shadow-sm group"
            >
              <span className="text-xs font-bold text-blue-600 group-hover:text-blue-800">Zone 9</span>
              <span className="text-sm sm:text-base font-black text-blue-950">Droit</span>
              <span className="text-[11px] font-mono font-bold bg-white px-2 py-0.5 rounded border border-blue-200 text-blue-800 mt-1">
                {getNotation(9)}
              </span>
            </button>
          </div>
        </div>

        {/* 2. CHAMP INTÉRIEUR (INFIELD) : 5, 6, 4, 3, 1, 2 */}
        <div>
          <div className="text-xs font-black text-slate-600 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Champ intérieur (Infield / Roulants)</span>
            {isGroundout && <span className="text-[11px] font-bold text-emerald-600">Recommandé pour GO</span>}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onSelectZone(5)}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 border border-slate-300 transition shadow-sm group"
            >
              <span className="text-xs font-bold text-slate-500">Zone 5</span>
              <span className="text-xs sm:text-sm font-black text-slate-900">3e Base</span>
              <span className="text-[10px] font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700 mt-0.5">
                {getNotation(5)}
              </span>
            </button>

            <button
              onClick={() => onSelectZone(6)}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 border border-slate-300 transition shadow-sm group"
            >
              <span className="text-xs font-bold text-slate-500">Zone 6</span>
              <span className="text-xs sm:text-sm font-black text-slate-900">Arrêt-Court</span>
              <span className="text-[10px] font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700 mt-0.5">
                {getNotation(6)}
              </span>
            </button>

            <button
              onClick={() => onSelectZone(4)}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 border border-slate-300 transition shadow-sm group"
            >
              <span className="text-xs font-bold text-slate-500">Zone 4</span>
              <span className="text-xs sm:text-sm font-black text-slate-900">2e Base</span>
              <span className="text-[10px] font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700 mt-0.5">
                {getNotation(4)}
              </span>
            </button>

            <button
              onClick={() => onSelectZone(3)}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 border border-slate-300 transition shadow-sm group"
            >
              <span className="text-xs font-bold text-slate-500">Zone 3</span>
              <span className="text-xs sm:text-sm font-black text-slate-900">1re Base</span>
              <span className="text-[10px] font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700 mt-0.5">
                {getNotation(3)}
              </span>
            </button>

            <button
              onClick={() => onSelectZone(1)}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 border border-slate-300 transition shadow-sm group"
            >
              <span className="text-xs font-bold text-slate-500">Zone 1</span>
              <span className="text-xs sm:text-sm font-black text-slate-900">Lanceur</span>
              <span className="text-[10px] font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700 mt-0.5">
                {getNotation(1)}
              </span>
            </button>

            <button
              onClick={() => onSelectZone(2)}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 border border-slate-300 transition shadow-sm group"
            >
              <span className="text-xs font-bold text-slate-500">Zone 2</span>
              <span className="text-xs sm:text-sm font-black text-slate-900">Receveur</span>
              <span className="text-[10px] font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700 mt-0.5">
                {getNotation(2)}
              </span>
            </button>
          </div>
        </div>

        {/* Boutons d'action rapides */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
          >
            Annuler
          </button>
          <button
            onClick={() => onSelectZone(isGroundout ? 6 : 8)}
            className="px-4 py-2 rounded-xl text-xs font-black bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition active:scale-95 flex items-center gap-1.5"
          >
            <Target className="w-3.5 h-3.5 text-blue-600" />
            <span>Valider par défaut ({isGroundout ? 'Arrêt-court 6' : 'Centre 8'})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
