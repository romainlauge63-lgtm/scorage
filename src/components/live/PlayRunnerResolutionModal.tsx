import React, { useState, useEffect } from 'react';
import { GameState, PlayType, HitZoneNumber } from '../../types/baseball';
import { RunnerResolution, RunnerDestination, getCurrentBatterSlot } from '../../engine/gameEngine';
import { X, Check, Users, Sparkles, AlertCircle, ArrowRight, Compass } from 'lucide-react';

interface PlayRunnerResolutionModalProps {
  isOpen: boolean;
  actionType: PlayType;
  gameState: GameState;
  onClose: () => void;
  onConfirm: (resolution: RunnerResolution, customDesc?: string) => void;
}

export const PlayRunnerResolutionModal: React.FC<PlayRunnerResolutionModalProps> = ({
  isOpen,
  actionType,
  gameState,
  onClose,
  onConfirm,
}) => {
  const runners = gameState.runners;
  const currentBatter = getCurrentBatterSlot(gameState).player;

  // Initialisation par défaut de la configuration personnalisée
  const getDefaultBatterDest = (type: PlayType): RunnerDestination => {
    switch (type) {
      case 'SINGLE': return 'first';
      case 'DOUBLE': return 'second';
      case 'TRIPLE': return 'third';
      case 'HOMERUN': return 'score';
      case 'FIELDERS_CHOICE':
      case 'ERROR': return 'first';
      case 'FLYOUT':
      case 'LINEOUT':
      case 'SACRIFICE_FLY': return 'out_air';
      default: return 'out_first';
    }
  };

  const getDefault3BDest = (type: PlayType): RunnerDestination => {
    if (!runners.third) return 'hold';
    if (type === 'SINGLE' || type === 'DOUBLE' || type === 'TRIPLE' || type === 'HOMERUN' || type === 'SACRIFICE_FLY') {
      return 'score';
    }
    return 'hold';
  };

  const getDefault2BDest = (type: PlayType): RunnerDestination => {
    if (!runners.second) return 'hold';
    if (type === 'SINGLE') {
      // Si 1B est occupée, 2B est forcé en 3B
      return runners.first ? 'third' : 'third';
    }
    if (type === 'DOUBLE' || type === 'TRIPLE' || type === 'HOMERUN') {
      return 'score';
    }
    if (type === 'GROUNDOUT' || type === 'SACRIFICE_BUNT') {
      return 'third';
    }
    return 'hold';
  };

  const getDefault1BDest = (type: PlayType): RunnerDestination => {
    if (!runners.first) return 'hold';
    if (type === 'SINGLE') return 'second';
    if (type === 'DOUBLE') return 'third';
    if (type === 'TRIPLE' || type === 'HOMERUN') return 'score';
    if (type === 'GROUNDOUT' || type === 'SACRIFICE_BUNT' || type === 'ERROR') return 'second';
    return 'hold';
  };

  const isOutfieldPlay = ['SINGLE', 'DOUBLE', 'TRIPLE', 'HOMERUN', 'FLYOUT', 'LINEOUT', 'SACRIFICE_FLY'].includes(actionType);
  const defaultZone: HitZoneNumber = isOutfieldPlay ? 8 : 6;

  const [dest3B, setDest3B] = useState<RunnerDestination>(getDefault3BDest(actionType));
  const [dest2B, setDest2B] = useState<RunnerDestination>(getDefault2BDest(actionType));
  const [dest1B, setDest1B] = useState<RunnerDestination>(getDefault1BDest(actionType));
  const [destBatter, setDestBatter] = useState<RunnerDestination>(getDefaultBatterDest(actionType));
  const [showCustom, setShowCustom] = useState(false);
  const [selectedZone, setSelectedZone] = useState<HitZoneNumber>(defaultZone);

  // Mettre à jour les états quand le modal s'ouvre ou que l'action change
  useEffect(() => {
    if (isOpen) {
      setDest3B(getDefault3BDest(actionType));
      setDest2B(getDefault2BDest(actionType));
      setDest1B(getDefault1BDest(actionType));
      setDestBatter(getDefaultBatterDest(actionType));
      setShowCustom(false);
      setSelectedZone(isOutfieldPlay ? 8 : 6);
    }
  }, [isOpen, actionType]);

  if (!isOpen) return null;

  // Calcul du résumé en direct
  let previewOuts = 0;
  let previewRuns = 0;
  if (runners.third) {
    if (dest3B.startsWith('out_')) previewOuts++;
    if (dest3B === 'score') previewRuns++;
  }
  if (runners.second) {
    if (dest2B.startsWith('out_')) previewOuts++;
    if (dest2B === 'score') previewRuns++;
  }
  if (runners.first) {
    if (dest1B.startsWith('out_')) previewOuts++;
    if (dest1B === 'score') previewRuns++;
  }
  if (destBatter.startsWith('out_')) previewOuts++;
  if (destBatter === 'score') previewRuns++;

  const totalOutsAfter = gameState.count.outs + previewOuts;
  if (totalOutsAfter >= 3 && (destBatter === 'out_first' || destBatter === 'out_air')) {
    previewRuns = 0;
  }

  const handleApplyPreset = (res: RunnerResolution, desc?: string) => {
    onConfirm({ ...res, hitZone: selectedZone }, desc);
    onClose();
  };

  const handleApplyCustom = () => {
    const res: RunnerResolution = {
      runner3BDestination: runners.third ? dest3B : undefined,
      runner2BDestination: runners.second ? dest2B : undefined,
      runner1BDestination: runners.first ? dest1B : undefined,
      batterDestination: destBatter,
      hitZone: selectedZone,
    };
    onConfirm(res);
    onClose();
  };

  const getActionBadge = () => {
    switch (actionType) {
      case 'GROUNDOUT': return { bg: 'bg-slate-100 text-slate-800 border-slate-300', label: 'GO • Roulant' };
      case 'FLYOUT': return { bg: 'bg-slate-100 text-slate-800 border-slate-300', label: 'FO • Balle en volée' };
      case 'LINEOUT': return { bg: 'bg-slate-100 text-slate-800 border-slate-300', label: 'LO • Balle en ligne' };
      case 'SINGLE': return { bg: 'bg-blue-100 text-blue-900 border-blue-300', label: '1B • Coup sûr Simple' };
      case 'DOUBLE': return { bg: 'bg-blue-100 text-blue-900 border-blue-300', label: '2B • Coup sûr Double' };
      case 'TRIPLE': return { bg: 'bg-indigo-100 text-indigo-900 border-indigo-300', label: '3B • Coup sûr Triple' };
      case 'FIELDERS_CHOICE': return { bg: 'bg-amber-100 text-amber-900 border-amber-300', label: 'FC • Choix défensif' };
      case 'ERROR': return { bg: 'bg-orange-100 text-orange-900 border-orange-300', label: 'E • Erreur défensive' };
      case 'SACRIFICE_FLY': return { bg: 'bg-purple-100 text-purple-900 border-purple-300', label: 'SF • Balle sacrifice' };
      case 'SACRIFICE_BUNT': return { bg: 'bg-purple-100 text-purple-900 border-purple-300', label: 'SH • Amorti sacrifice' };
      default: return { bg: 'bg-slate-100 text-slate-800 border-slate-300', label: actionType };
    }
  };

  const badge = getActionBadge();

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-white border border-slate-300 rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl text-slate-900 space-y-4 my-auto max-h-[92vh] flex flex-col">
        {/* En-tête */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded-xl text-xs sm:text-sm font-black border ${badge.bg}`}>
              {badge.label}
            </span>
            <div>
              <h3 className="font-black text-slate-900 text-base sm:text-lg leading-tight">
                Gestion des coureurs sur base
              </h3>
              <p className="text-xs text-slate-500 font-semibold">
                Frappeur : #{currentBatter?.jerseyNumber} {currentBatter?.name}
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

        {/* Coureurs sur base actuels */}
        <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold flex-shrink-0">
          <span className="text-slate-500 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            Sur base :
          </span>
          {runners.third && (
            <span className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-900 border border-blue-200 font-bold">
              3B : #{runners.third.jerseyNumber} {runners.third.name}
            </span>
          )}
          {runners.second && (
            <span className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-900 border border-blue-200 font-bold">
              2B : #{runners.second.jerseyNumber} {runners.second.name}
            </span>
          )}
          {runners.first && (
            <span className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-900 border border-blue-200 font-bold">
              1B : #{runners.first.jerseyNumber} {runners.first.name}
            </span>
          )}
        </div>

        {/* CONTENU SCROLLABLE */}
        <div className="space-y-4 overflow-y-auto pr-1 flex-1">
          {/* SÉLECTION DIRECTION DE FRAPPE */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-black text-slate-800">
              <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <Compass className="w-4 h-4 text-blue-600" />
                Direction de la frappe :
              </span>
              <span className="text-xs font-black text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-lg border border-blue-200">
                {selectedZone === 7 ? 'Zone 7 • Champ Gauche' :
                 selectedZone === 8 ? 'Zone 8 • Champ Centre' :
                 selectedZone === 9 ? 'Zone 9 • Champ Droit' :
                 selectedZone === 6 ? "Zone 6 • Arrêt-Court" :
                 selectedZone === 4 ? 'Zone 4 • 2e Base' :
                 selectedZone === 5 ? 'Zone 5 • 3e Base' :
                 selectedZone === 3 ? 'Zone 3 • 1re Base' :
                 selectedZone === 1 ? 'Zone 1 • Lanceur' :
                 selectedZone === 2 ? 'Zone 2 • Receveur' : `Zone ${selectedZone}`}
              </span>
            </div>

            {/* Boutons outfield principaux */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { zone: 7 as HitZoneNumber, label: 'Gauche (7)' },
                { zone: 8 as HitZoneNumber, label: 'Centre (8)' },
                { zone: 9 as HitZoneNumber, label: 'Droite (9)' },
              ].map(item => (
                <button
                  key={item.zone}
                  type="button"
                  onClick={() => setSelectedZone(item.zone)}
                  className={`py-2 px-2 rounded-xl text-xs font-black border transition active:scale-95 text-center ${
                    selectedZone === item.zone
                      ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                      : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Boutons infield secondaires */}
            <div className="grid grid-cols-6 gap-1 pt-1.5 border-t border-slate-200">
              {[
                { zone: 5 as HitZoneNumber, label: '3B (5)' },
                { zone: 6 as HitZoneNumber, label: 'SS (6)' },
                { zone: 4 as HitZoneNumber, label: '2B (4)' },
                { zone: 3 as HitZoneNumber, label: '1B (3)' },
                { zone: 1 as HitZoneNumber, label: 'P (1)' },
                { zone: 2 as HitZoneNumber, label: 'C (2)' },
              ].map(item => (
                <button
                  key={item.zone}
                  type="button"
                  onClick={() => setSelectedZone(item.zone)}
                  className={`py-1 px-1 rounded-lg text-[10px] sm:text-[11px] font-bold border transition text-center ${
                    selectedZone === item.zone
                      ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                      : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* SECTION A : PRÉRÉGLAGES 1-CLIC */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Situations fréquentes (1 clic)
              </span>
              <button
                type="button"
                onClick={() => setShowCustom(!showCustom)}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold underline"
              >
                {showCustom ? 'Masquer personnalisé' : 'Personnaliser coureur par coureur'}
              </button>
            </div>

            <div className="space-y-2">
              {/* Presets pour GROUNDOUT */}
              {actionType === 'GROUNDOUT' && (
                <>
                  <button
                    onClick={() =>
                      handleApplyPreset(
                        {
                          batterDestination: 'out_first',
                          runner3BDestination: runners.third ? (gameState.count.outs < 2 ? 'score' : 'hold') : undefined,
                          runner2BDestination: runners.second ? 'third' : undefined,
                          runner1BDestination: runners.first ? 'second' : undefined,
                        },
                        `Roulant (GO) : ${currentBatter?.name} retiré en 1B, les coureurs avancent${
                          runners.third && gameState.count.outs < 2 ? ' (+1 point, RBI)' : ''
                        }`
                      )
                    }
                    className="w-full text-left p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-300 transition shadow-sm group"
                  >
                    <div className="flex items-center justify-between font-black text-emerald-950 text-xs sm:text-sm">
                      <span>Retrait en 1B • Tous les coureurs avancent</span>
                      <span className="bg-white px-2 py-0.5 rounded border border-emerald-300 text-emerald-800">
                        1 Out {runners.third && gameState.count.outs < 2 ? '• +1 Pt' : ''}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                      Batteur retiré en 1B. {runners.third ? (gameState.count.outs < 2 ? '3B marque au marbre. ' : '3B reste prudent. ') : ''}
                      {runners.second ? '2B avance en 3B. ' : ''}
                      {runners.first ? '1B avance en 2B. ' : ''}
                    </p>
                  </button>

                  <button
                    onClick={() =>
                      handleApplyPreset(
                        {
                          batterDestination: 'out_first',
                          runner3BDestination: runners.third ? 'hold' : undefined,
                          runner2BDestination: runners.second ? 'hold' : undefined,
                          runner1BDestination: runners.first ? 'hold' : undefined,
                        },
                        `Roulant (GO) : ${currentBatter?.name} retiré en 1B, coureurs bloqués sur place`
                      )
                    }
                    className="w-full text-left p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 transition shadow-sm group"
                  >
                    <div className="flex items-center justify-between font-black text-slate-900 text-xs sm:text-sm">
                      <span>Retrait en 1B • Coureurs bloqués sur leurs bases</span>
                      <span className="bg-white px-2 py-0.5 rounded border border-slate-300 text-slate-800">
                        1 Out • 0 Pt
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                      Roulant court près des bases : batteur retiré en 1B, aucun coureur ne prend le risque d'avancer.
                    </p>
                  </button>

                  {/* Choix défensif sur coureur (FC) via bouton GO */}
                  {runners.first && (
                    <button
                      onClick={() =>
                        handleApplyPreset(
                          {
                            batterDestination: 'first',
                            runner1BDestination: 'out_second',
                            runner2BDestination: runners.second ? 'third' : undefined,
                            runner3BDestination: runners.third ? (gameState.count.outs < 2 ? 'score' : 'hold') : undefined,
                          },
                          `Choix défensif : ${runners.first?.name} forcé et retiré en 2B, ${currentBatter?.name} sauf en 1B`
                        )
                      }
                      className="w-full text-left p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 transition shadow-sm group"
                    >
                      <div className="flex items-center justify-between font-black text-amber-950 text-xs sm:text-sm">
                        <span>Choix Défensif : Coureur de 1B retiré en 2B</span>
                        <span className="bg-white px-2 py-0.5 rounded border border-amber-300 text-amber-800">
                          1 Out • Batteur sauf
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                        La défense joue sur le coureur de 1B forcé en 2B (6-4 ou 4-6). Batteur sauf en 1B.
                      </p>
                    </button>
                  )}

                  {runners.second && (
                    <button
                      onClick={() =>
                        handleApplyPreset(
                          {
                            batterDestination: 'first',
                            runner2BDestination: 'out_third',
                            runner1BDestination: runners.first ? 'second' : undefined,
                            runner3BDestination: runners.third ? (gameState.count.outs < 2 ? 'score' : 'hold') : undefined,
                          },
                          `Choix défensif : ${runners.second?.name} éliminé en 3B, ${currentBatter?.name} sauf en 1B`
                        )
                      }
                      className="w-full text-left p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 transition shadow-sm group"
                    >
                      <div className="flex items-center justify-between font-black text-amber-950 text-xs sm:text-sm">
                        <span>Choix Défensif : Coureur de 2B retiré en 3B</span>
                        <span className="bg-white px-2 py-0.5 rounded border border-amber-300 text-amber-800">
                          1 Out • Batteur sauf
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                        La défense intercepte et élimine le coureur tentant la 3B. Batteur sauf en 1B.
                      </p>
                    </button>
                  )}

                  {runners.third && (
                    <button
                      onClick={() =>
                        handleApplyPreset(
                          {
                            batterDestination: 'first',
                            runner3BDestination: 'out_home',
                            runner2BDestination: runners.second ? 'third' : undefined,
                            runner1BDestination: runners.first ? 'second' : undefined,
                          },
                          `Choix défensif : ${runners.third?.name} éliminé au marbre, ${currentBatter?.name} sauf en 1B`
                        )
                      }
                      className="w-full text-left p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 border-2 border-rose-300 transition shadow-sm group"
                    >
                      <div className="flex items-center justify-between font-black text-rose-950 text-xs sm:text-sm">
                        <span>Choix Défensif : Coureur de 3B éliminé au marbre</span>
                        <span className="bg-white px-2 py-0.5 rounded border border-rose-300 text-rose-800">
                          1 Out • 0 Point
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                        Relais au marbre pour bloquer le point (ex: 5-2). Le coureur de 3B est retiré. Batteur sauf en 1B.
                      </p>
                    </button>
                  )}
                </>
              )}

              {/* Presets pour FLYOUT & LINEOUT */}
              {(actionType === 'FLYOUT' || actionType === 'LINEOUT') && (
                <>
                  <button
                    onClick={() =>
                      handleApplyPreset(
                        {
                          batterDestination: 'out_air',
                          runner3BDestination: runners.third ? 'hold' : undefined,
                          runner2BDestination: runners.second ? 'hold' : undefined,
                          runner1BDestination: runners.first ? 'hold' : undefined,
                        },
                        `${actionType === 'FLYOUT' ? 'Balle en volée' : 'Ligne'} captée, coureurs restent sur base`
                      )
                    }
                    className="w-full text-left p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 transition shadow-sm group"
                  >
                    <div className="flex items-center justify-between font-black text-slate-900 text-xs sm:text-sm">
                      <span>Balle captée • Tous les coureurs restent sur base</span>
                      <span className="bg-white px-2 py-0.5 rounded border border-slate-300 text-slate-800">
                        1 Out • 0 Pt
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                      Prise de volée standard. Aucun coureur ne tente d'avancer.
                    </p>
                  </button>

                  {runners.third && gameState.count.outs < 2 && (
                    <button
                      onClick={() =>
                        handleApplyPreset(
                          {
                            batterDestination: 'out_air',
                            runner3BDestination: 'score',
                            runner2BDestination: runners.second ? 'third' : undefined,
                            runner1BDestination: runners.first ? 'hold' : undefined,
                          },
                          `Balle sacrifice (SF) : ${currentBatter?.name} retiré de volée, ${runners.third?.name} marque après retouche (+1 point)`
                        )
                      }
                      className="w-full text-left p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-300 transition shadow-sm group"
                    >
                      <div className="flex items-center justify-between font-black text-emerald-950 text-xs sm:text-sm">
                        <span>Balle sacrifice (SF) • Le coureur de 3B marque</span>
                        <span className="bg-white px-2 py-0.5 rounded border border-emerald-300 text-emerald-800">
                          1 Out • +1 Pt (RBI)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                        Volée profonde au champ extérieur : 3B retouche son but et rentre marquer (+1 point).
                      </p>
                    </button>
                  )}

                  {runners.second && (
                    <button
                      onClick={() =>
                        handleApplyPreset(
                          {
                            batterDestination: 'out_air',
                            runner3BDestination: runners.third ? (gameState.count.outs < 2 ? 'score' : 'hold') : undefined,
                            runner2BDestination: 'third',
                            runner1BDestination: runners.first ? 'hold' : undefined,
                          },
                          `Volée captée, coureur de 2B avance en 3B après retouche (Tag-up)`
                        )
                      }
                      className="w-full text-left p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 border-2 border-blue-300 transition shadow-sm group"
                    >
                      <div className="flex items-center justify-between font-black text-blue-950 text-xs sm:text-sm">
                        <span>Avancement sur volée : 2B avance en 3B</span>
                        <span className="bg-white px-2 py-0.5 rounded border border-blue-300 text-blue-800">
                          1 Out
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                        Volée captée au champ droit/centre : le coureur de 2B sprinte en 3B.
                      </p>
                    </button>
                  )}
                </>
              )}

              {/* Presets pour SINGLE (1B) */}
              {actionType === 'SINGLE' && (
                <>
                  <button
                    onClick={() =>
                      handleApplyPreset(
                        {
                          batterDestination: 'first',
                          runner3BDestination: runners.third ? 'score' : undefined,
                          runner2BDestination: runners.second ? 'third' : undefined,
                          runner1BDestination: runners.first ? 'second' : undefined,
                        },
                        `Simple (1B) de ${currentBatter?.name} : avancement standard${runners.third ? ' (+1 point)' : ''}`
                      )
                    }
                    className="w-full text-left p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 border-2 border-blue-300 transition shadow-sm group"
                  >
                    <div className="flex items-center justify-between font-black text-blue-950 text-xs sm:text-sm">
                      <span>Standard : Avancement d'une base</span>
                      <span className="bg-white px-2 py-0.5 rounded border border-blue-300 text-blue-800">
                        {runners.third ? '+1 Pt • 1 RBI' : '0 Out'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                      Batteur en 1B. {runners.third ? '3B marque au marbre. ' : ''}
                      {runners.second ? '2B avance en 3B. ' : ''}
                      {runners.first ? '1B avance en 2B. ' : ''}
                    </p>
                  </button>

                  {runners.second && (
                    <button
                      onClick={() =>
                        handleApplyPreset(
                          {
                            batterDestination: 'first',
                            runner3BDestination: runners.third ? 'score' : undefined,
                            runner2BDestination: 'score',
                            runner1BDestination: runners.first ? 'third' : undefined,
                          },
                          `Simple (1B) au champ de ${currentBatter?.name} : 2B marque directement au marbre`
                        )
                      }
                      className="w-full text-left p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-300 transition shadow-sm group"
                    >
                      <div className="flex items-center justify-between font-black text-emerald-950 text-xs sm:text-sm">
                        <span>Frappe au champ : Le coureur de 2B marque aussi</span>
                        <span className="bg-white px-2 py-0.5 rounded border border-emerald-300 text-emerald-800">
                          {runners.third ? '+2 Pts • 2 RBI' : '+1 Pt • 1 RBI'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                        Frappe bien placée : 2B sprinte et franchit le marbre. {runners.first ? '1B file en 3B.' : ''}
                      </p>
                    </button>
                  )}

                  {runners.third && !runners.first && (
                    <button
                      onClick={() =>
                        handleApplyPreset(
                          {
                            batterDestination: 'first',
                            runner3BDestination: 'hold',
                            runner2BDestination: runners.second ? 'hold' : undefined,
                          },
                          `Simple court (Infield hit) : 3B reste prudent en 3B, ${currentBatter?.name} sauf en 1B`
                        )
                      }
                      className="w-full text-left p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 transition shadow-sm group"
                    >
                      <div className="flex items-center justify-between font-black text-amber-950 text-xs sm:text-sm">
                        <span>Frappe courte : Le coureur de 3B reste en 3B</span>
                        <span className="bg-white px-2 py-0.5 rounded border border-amber-300 text-amber-800">
                          0 Point • 0 Out
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                        1B était vide, 3B n'est pas forcé et reste prudent sur un hit court dans l'infield.
                      </p>
                    </button>
                  )}

                  {/* Coureur retiré au marbre sur relais */}
                  {(runners.third || runners.second) && (
                    <button
                      onClick={() =>
                        handleApplyPreset(
                          {
                            batterDestination: 'first',
                            runner3BDestination: runners.third ? 'out_home' : undefined,
                            runner2BDestination: runners.second ? (!runners.third ? 'out_home' : 'third') : undefined,
                            runner1BDestination: runners.first ? 'second' : undefined,
                          },
                          `Simple (1B) de ${currentBatter?.name} : coureur éliminé au marbre sur relais (ex: 8-2)`
                        )
                      }
                      className="w-full text-left p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 border-2 border-rose-300 transition shadow-sm group"
                    >
                      <div className="flex items-center justify-between font-black text-rose-950 text-xs sm:text-sm">
                        <span>Coup sûr avec retrait au marbre (Relais défensif)</span>
                        <span className="bg-white px-2 py-0.5 rounded border border-rose-300 text-rose-800">
                          1 Hit • +1 Out
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                        Le batteur réussit un simple, mais un coureur tentant de marquer est retiré au marbre (relais 8-2).
                      </p>
                    </button>
                  )}
                </>
              )}

              {/* Presets pour DOUBLE (2B) */}
              {actionType === 'DOUBLE' && (
                <>
                  <button
                    onClick={() =>
                      handleApplyPreset(
                        {
                          batterDestination: 'second',
                          runner3BDestination: runners.third ? 'score' : undefined,
                          runner2BDestination: runners.second ? 'score' : undefined,
                          runner1BDestination: runners.first ? 'third' : undefined,
                        },
                        `Double (2B) de ${currentBatter?.name} : coureurs avancent`
                      )
                    }
                    className="w-full text-left p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 border-2 border-blue-300 transition shadow-sm group"
                  >
                    <div className="flex items-center justify-between font-black text-blue-950 text-xs sm:text-sm">
                      <span>Standard : 2B et 3B marquent, 1B en 3B</span>
                      <span className="bg-white px-2 py-0.5 rounded border border-blue-300 text-blue-800">
                        {(runners.third ? 1 : 0) + (runners.second ? 1 : 0)} Pt(s)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                      Batteur en 2B. Les coureurs de 2B et 3B marquent. Le coureur de 1B s'arrête en 3B.
                    </p>
                  </button>

                  {runners.first && (
                    <button
                      onClick={() =>
                        handleApplyPreset(
                          {
                            batterDestination: 'second',
                            runner3BDestination: runners.third ? 'score' : undefined,
                            runner2BDestination: runners.second ? 'score' : undefined,
                            runner1BDestination: 'score',
                          },
                          `Double (2B) profond de ${currentBatter?.name} : le coureur de 1B marque aussi`
                        )
                      }
                      className="w-full text-left p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-300 transition shadow-sm group"
                    >
                      <div className="flex items-center justify-between font-black text-emerald-950 text-xs sm:text-sm">
                        <span>Double profond : Le coureur de 1B fait le tour et marque</span>
                        <span className="bg-white px-2 py-0.5 rounded border border-emerald-300 text-emerald-800">
                          {(runners.third ? 1 : 0) + (runners.second ? 1 : 0) + 1} Pts
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                        Frappe très profonde dans les coins : tous les coureurs marquent, y compris celui de 1B !
                      </p>
                    </button>
                  )}

                  {/* Coureur éliminé au marbre */}
                  <button
                    onClick={() =>
                      handleApplyPreset(
                        {
                          batterDestination: 'second',
                          runner3BDestination: runners.third ? 'score' : undefined,
                          runner2BDestination: runners.second ? 'out_home' : undefined,
                          runner1BDestination: runners.first ? (!runners.second ? 'out_home' : 'third') : undefined,
                        },
                        `Double (2B) de ${currentBatter?.name} : coureur retiré au marbre sur relais (8-2)`
                      )
                    }
                    className="w-full text-left p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 border-2 border-rose-300 transition shadow-sm group"
                  >
                    <div className="flex items-center justify-between font-black text-rose-950 text-xs sm:text-sm">
                      <span>Double avec coureur éliminé au marbre</span>
                      <span className="bg-white px-2 py-0.5 rounded border border-rose-300 text-rose-800">
                        1 Hit • +1 Out
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                      Batteur en 2B, mais le relais défensif élimine un coureur au marbre (8-2).
                    </p>
                  </button>

                  {runners.first && (
                    <button
                      onClick={() =>
                        handleApplyPreset(
                          {
                            batterDestination: 'second',
                            runner3BDestination: runners.third ? 'score' : undefined,
                            runner2BDestination: runners.second ? 'score' : undefined,
                            runner1BDestination: 'out_third',
                          },
                          `Double (2B) de ${currentBatter?.name} : coureur de 1B éliminé en 3B (9-5)`
                        )
                      }
                      className="w-full text-left p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 transition shadow-sm group"
                    >
                      <div className="flex items-center justify-between font-black text-amber-950 text-xs sm:text-sm">
                        <span>Double avec coureur de 1B éliminé en 3B</span>
                        <span className="bg-white px-2 py-0.5 rounded border border-amber-300 text-amber-800">
                          1 Hit • +1 Out
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                        Le coureur venu de 1B tente la 3e base et est retiré sur le relais (9-5).
                      </p>
                    </button>
                  )}
                </>
              )}

              {/* Presets pour TRIPLE (3B) */}
              {actionType === 'TRIPLE' && (
                <>
                  <button
                    onClick={() =>
                      handleApplyPreset(
                        {
                          batterDestination: 'third',
                          runner3BDestination: runners.third ? 'score' : undefined,
                          runner2BDestination: runners.second ? 'score' : undefined,
                          runner1BDestination: runners.first ? 'score' : undefined,
                        },
                        `Triple (3B) de ${currentBatter?.name} : batteur en 3B, tous les coureurs marquent`
                      )
                    }
                    className="w-full text-left p-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 border-2 border-indigo-300 transition shadow-sm group"
                  >
                    <div className="flex items-center justify-between font-black text-indigo-950 text-xs sm:text-sm">
                      <span>Standard : Batteur en 3B • Tous les coureurs marquent</span>
                      <span className="bg-white px-2 py-0.5 rounded border border-indigo-300 text-indigo-800">
                        {(runners.third ? 1 : 0) + (runners.second ? 1 : 0) + (runners.first ? 1 : 0)} Pt(s) • Batteur en 3B
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                      Frappe profonde : le batteur file en 3B. Tous les coureurs sur base franchissent le marbre (+{(runners.third ? 1 : 0) + (runners.second ? 1 : 0) + (runners.first ? 1 : 0)} point(s)).
                    </p>
                  </button>

                  {/* Option 2: Triple avec coureur éliminé au marbre */}
                  <button
                    onClick={() =>
                      handleApplyPreset(
                        {
                          batterDestination: 'third',
                          runner3BDestination: runners.third ? 'score' : undefined,
                          runner2BDestination: runners.second ? (!runners.third ? 'out_home' : 'score') : undefined,
                          runner1BDestination: runners.first ? 'out_home' : undefined,
                        },
                        `Triple (3B) de ${currentBatter?.name} : batteur en 3B, coureur retiré au marbre (relais)`
                      )
                    }
                    className="w-full text-left p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 border-2 border-rose-300 transition shadow-sm group"
                  >
                    <div className="flex items-center justify-between font-black text-rose-950 text-xs sm:text-sm">
                      <span>Triple avec coureur retiré au marbre (relais défensif)</span>
                      <span className="bg-white px-2 py-0.5 rounded border border-rose-300 text-rose-800">
                        1 Hit • +1 Out
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                      Batteur en 3B, mais la défense effectue un relais rapide et élimine un coureur au marbre.
                    </p>
                  </button>

                  {/* Option 3: Triple et batteur retiré au marbre */}
                  <button
                    onClick={() =>
                      handleApplyPreset(
                        {
                          batterDestination: 'out_home',
                          runner3BDestination: runners.third ? 'score' : undefined,
                          runner2BDestination: runners.second ? 'score' : undefined,
                          runner1BDestination: runners.first ? 'score' : undefined,
                        },
                        `Triple (3B) de ${currentBatter?.name} : coureurs marquent, batteur éliminé au marbre`
                      )
                    }
                    className="w-full text-left p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 transition shadow-sm group"
                  >
                    <div className="flex items-center justify-between font-black text-amber-950 text-xs sm:text-sm">
                      <span>Tentative de circuit intérieur : Batteur retiré au marbre</span>
                      <span className="bg-white px-2 py-0.5 rounded border border-amber-300 text-amber-800">
                        1 Hit (3B) • +1 Out
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                      Tous les coureurs marquent. Le batteur tente le tour complet jusqu'au marbre mais se fait tagger (crédité d'un triple + out au marbre).
                    </p>
                  </button>
                </>
              )}

              {/* Presets pour ERROR (E) */}
              {actionType === 'ERROR' && (
                <>
                  <button
                    onClick={() =>
                      handleApplyPreset(
                        {
                          batterDestination: 'first',
                          runner3BDestination: runners.third ? 'score' : undefined,
                          runner2BDestination: runners.second ? 'third' : undefined,
                          runner1BDestination: runners.first ? 'second' : undefined,
                        },
                        `Erreur défensive : ${currentBatter?.name} sauf en 1B, coureurs avancent d'une base${
                          runners.third ? ' (+1 point non mérité)' : ''
                        }`
                      )
                    }
                    className="w-full text-left p-3 rounded-2xl bg-orange-50 hover:bg-orange-100 border-2 border-orange-300 transition shadow-sm group"
                  >
                    <div className="flex items-center justify-between font-black text-orange-950 text-xs sm:text-sm">
                      <span>Erreur classique : Coureurs avancent d'une base</span>
                      <span className="bg-white px-2 py-0.5 rounded border border-orange-300 text-orange-800">
                        0 Out {runners.third ? '• +1 Pt' : ''}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                      Batteur sauf en 1B. {runners.third ? '3B marque. ' : ''}
                      {runners.second ? '2B va en 3B. ' : ''}
                      {runners.first ? '1B va en 2B.' : ''}
                    </p>
                  </button>

                  <button
                    onClick={() =>
                      handleApplyPreset(
                        {
                          batterDestination: 'second',
                          runner3BDestination: runners.third ? 'score' : undefined,
                          runner2BDestination: runners.second ? 'score' : undefined,
                          runner1BDestination: runners.first ? 'third' : undefined,
                        },
                        `Erreur de lancer majeure : ${currentBatter?.name} en 2B, coureurs avancent de 2 bases`
                      )
                    }
                    className="w-full text-left p-3 rounded-2xl bg-red-50 hover:bg-red-100 border-2 border-red-300 transition shadow-sm group"
                  >
                    <div className="flex items-center justify-between font-black text-red-950 text-xs sm:text-sm">
                      <span>Erreur grave (balle hors-limite) : Avancement de 2 bases</span>
                      <span className="bg-white px-2 py-0.5 rounded border border-red-300 text-red-800">
                        Batteur en 2B
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                      Mauvais relais hors-limite : le batteur va en 2B, les coureurs de 2B et 3B marquent.
                    </p>
                  </button>
                </>
              )}

              {/* Presets pour SACRIFICE BUNT (SH) */}
              {actionType === 'SACRIFICE_BUNT' && (
                <>
                  <button
                    onClick={() =>
                      handleApplyPreset(
                        {
                          batterDestination: 'out_first',
                          runner3BDestination: runners.third ? 'score' : undefined,
                          runner2BDestination: runners.second ? 'third' : undefined,
                          runner1BDestination: runners.first ? 'second' : undefined,
                        },
                        `Amorti sacrifice (SH 1-3) réussi de ${currentBatter?.name} : coureurs avancent`
                      )
                    }
                    className="w-full text-left p-3 rounded-2xl bg-purple-50 hover:bg-purple-100 border-2 border-purple-300 transition shadow-sm group"
                  >
                    <div className="flex items-center justify-between font-black text-purple-950 text-xs sm:text-sm">
                      <span>Amorti sacrifice réussi (SH) • Coureurs avancent</span>
                      <span className="bg-white px-2 py-0.5 rounded border border-purple-300 text-purple-800">
                        1 Out • SH
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                      Batteur retiré en 1B (SH 1-3 ou 2-3). Tous les coureurs sur base gagnent une base.
                    </p>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* SECTION B : CONTRÔLES COUREUR PAR COUREUR */}
          {showCustom && (
            <div className="pt-3 border-t border-slate-200 space-y-4 animate-in fade-in">
              <div className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                Destinations individuelles personnalisées
              </div>

              {/* COUREUR 3B */}
              {runners.third && (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800">
                      3B : #{runners.third.jerseyNumber} {runners.third.name}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">Sélectionnez le résultat :</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDest3B('hold')}
                      className={`p-2 rounded-xl text-xs font-bold border transition ${
                        dest3B === 'hold'
                          ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      Reste en 3B
                    </button>
                    <button
                      type="button"
                      onClick={() => setDest3B('score')}
                      className={`p-2 rounded-xl text-xs font-bold border transition ${
                        dest3B === 'score'
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                          : 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50'
                      }`}
                    >
                      Marque (+1)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDest3B('out_home')}
                      className={`p-2 rounded-xl text-xs font-bold border transition ${
                        dest3B === 'out_home'
                          ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                          : 'bg-white text-rose-800 border-rose-300 hover:bg-rose-50'
                      }`}
                    >
                      OUT au Marbre
                    </button>
                    <button
                      type="button"
                      onClick={() => setDest3B('out_third')}
                      className={`p-2 rounded-xl text-xs font-bold border transition ${
                        dest3B === 'out_third'
                          ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                          : 'bg-white text-rose-800 border-rose-300 hover:bg-rose-50'
                      }`}
                    >
                      OUT en 3B
                    </button>
                  </div>
                </div>
              )}

              {/* COUREUR 2B */}
              {runners.second && (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800">
                      2B : #{runners.second.jerseyNumber} {runners.second.name}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">Sélectionnez le résultat :</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDest2B('hold')}
                      className={`p-2 rounded-xl text-xs font-bold border transition ${
                        dest2B === 'hold' || dest2B === 'second'
                          ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      Reste en 2B
                    </button>
                    <button
                      type="button"
                      onClick={() => setDest2B('third')}
                      className={`p-2 rounded-xl text-xs font-bold border transition ${
                        dest2B === 'third'
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                          : 'bg-white text-indigo-800 border-indigo-300 hover:bg-indigo-50'
                      }`}
                    >
                      Avance en 3B
                    </button>
                    <button
                      type="button"
                      onClick={() => setDest2B('score')}
                      className={`p-2 rounded-xl text-xs font-bold border transition ${
                        dest2B === 'score'
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                          : 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50'
                      }`}
                    >
                      Marque (+1)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDest2B('out_third')}
                      className={`p-2 rounded-xl text-xs font-bold border transition ${
                        dest2B === 'out_third'
                          ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                          : 'bg-white text-rose-800 border-rose-300 hover:bg-rose-50'
                      }`}
                    >
                      OUT en 3B
                    </button>
                    <button
                      type="button"
                      onClick={() => setDest2B('out_home')}
                      className={`p-2 rounded-xl text-xs font-bold border transition ${
                        dest2B === 'out_home'
                          ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                          : 'bg-white text-rose-800 border-rose-300 hover:bg-rose-50'
                      }`}
                    >
                      OUT au Marbre
                    </button>
                    <button
                      type="button"
                      onClick={() => setDest2B('out_second')}
                      className={`p-2 rounded-xl text-xs font-bold border transition ${
                        dest2B === 'out_second'
                          ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                          : 'bg-white text-rose-800 border-rose-300 hover:bg-rose-50'
                      }`}
                    >
                      OUT en 2B
                    </button>
                  </div>
                </div>
              )}

              {/* COUREUR 1B */}
              {runners.first && (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800">
                      1B : #{runners.first.jerseyNumber} {runners.first.name}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">Sélectionnez le résultat :</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDest1B('hold')}
                      className={`p-2 rounded-xl text-xs font-bold border transition ${
                        dest1B === 'hold' || dest1B === 'first'
                          ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      Reste en 1B
                    </button>
                    <button
                      type="button"
                      onClick={() => setDest1B('second')}
                      className={`p-2 rounded-xl text-xs font-bold border transition ${
                        dest1B === 'second'
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                          : 'bg-white text-indigo-800 border-indigo-300 hover:bg-indigo-50'
                      }`}
                    >
                      Avance en 2B
                    </button>
                    <button
                      type="button"
                      onClick={() => setDest1B('third')}
                      className={`p-2 rounded-xl text-xs font-bold border transition ${
                        dest1B === 'third'
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                          : 'bg-white text-indigo-800 border-indigo-300 hover:bg-indigo-50'
                      }`}
                    >
                      Avance en 3B
                    </button>
                    <button
                      type="button"
                      onClick={() => setDest1B('score')}
                      className={`p-2 rounded-xl text-xs font-bold border transition ${
                        dest1B === 'score'
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                          : 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50'
                      }`}
                    >
                      Marque (+1)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDest1B('out_second')}
                      className={`p-2 rounded-xl text-xs font-bold border transition ${
                        dest1B === 'out_second'
                          ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                          : 'bg-white text-rose-800 border-rose-300 hover:bg-rose-50'
                      }`}
                    >
                      OUT en 2B
                    </button>
                    <button
                      type="button"
                      onClick={() => setDest1B('out_third')}
                      className={`p-2 rounded-xl text-xs font-bold border transition ${
                        dest1B === 'out_third'
                          ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                          : 'bg-white text-rose-800 border-rose-300 hover:bg-rose-50'
                      }`}
                    >
                      OUT en 3B
                    </button>
                    <button
                      type="button"
                      onClick={() => setDest1B('out_home')}
                      className={`p-2 rounded-xl text-xs font-bold border transition ${
                        dest1B === 'out_home'
                          ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                          : 'bg-white text-rose-800 border-rose-300 hover:bg-rose-50'
                      }`}
                    >
                      OUT au Marbre
                    </button>
                  </div>
                </div>
              )}

              {/* BATTEUR (FRAPPEUR) */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800">
                    Batteur : #{currentBatter?.jerseyNumber} {currentBatter?.name}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">Sélectionnez le résultat :</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDestBatter('third')}
                    className={`p-2 rounded-xl text-xs font-bold border transition ${
                      destBatter === 'third'
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                        : 'bg-white text-indigo-900 border-indigo-300 hover:bg-indigo-50'
                    }`}
                  >
                    Sauf en 3B
                  </button>
                  <button
                    type="button"
                    onClick={() => setDestBatter('second')}
                    className={`p-2 rounded-xl text-xs font-bold border transition ${
                      destBatter === 'second'
                        ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                        : 'bg-white text-blue-900 border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    Sauf en 2B
                  </button>
                  <button
                    type="button"
                    onClick={() => setDestBatter('first')}
                    className={`p-2 rounded-xl text-xs font-bold border transition ${
                      destBatter === 'first'
                        ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Sauf en 1B
                  </button>
                  <button
                    type="button"
                    onClick={() => setDestBatter('score')}
                    className={`p-2 rounded-xl text-xs font-bold border transition ${
                      destBatter === 'score'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                        : 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50'
                    }`}
                  >
                    Marque (+1)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDestBatter('out_first')}
                    className={`p-2 rounded-xl text-xs font-bold border transition ${
                      destBatter === 'out_first'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                        : 'bg-white text-rose-800 border-rose-300 hover:bg-rose-50'
                    }`}
                  >
                    OUT en 1B
                  </button>
                  <button
                    type="button"
                    onClick={() => setDestBatter('out_air')}
                    className={`p-2 rounded-xl text-xs font-bold border transition ${
                      destBatter === 'out_air'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                        : 'bg-white text-rose-800 border-rose-300 hover:bg-rose-50'
                    }`}
                  >
                    OUT de volée
                  </button>
                  <button
                    type="button"
                    onClick={() => setDestBatter('out_third')}
                    className={`p-2 rounded-xl text-xs font-bold border transition ${
                      destBatter === 'out_third'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                        : 'bg-white text-rose-800 border-rose-300 hover:bg-rose-50'
                    }`}
                  >
                    OUT en 3B
                  </button>
                  <button
                    type="button"
                    onClick={() => setDestBatter('out_home')}
                    className={`p-2 rounded-xl text-xs font-bold border transition ${
                      destBatter === 'out_home'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                        : 'bg-white text-rose-800 border-rose-300 hover:bg-rose-50'
                    }`}
                  >
                    OUT au Marbre
                  </button>
                </div>
              </div>

              {/* Bouton pour valider la personnalisation */}
              <button
                type="button"
                onClick={handleApplyCustom}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm shadow-md transition active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Valider cette configuration personnalisée</span>
              </button>
            </div>
          )}
        </div>

        {/* PIED DE MODAL : RÉSUMÉ EN DIRECT */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between flex-shrink-0 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-600 flex items-center gap-1">
              Retraits sur ce jeu :
              <strong className={`font-black ml-1 ${previewOuts > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                +{previewOuts} (Total : {Math.min(totalOutsAfter, 3)}/3)
              </strong>
            </span>
            <span className="font-bold text-slate-600 flex items-center gap-1">
              Points marqués :
              <strong className={`font-black ml-1 ${previewRuns > 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                +{previewRuns}
              </strong>
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold transition"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};
