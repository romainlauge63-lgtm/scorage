import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { PlayType } from '../../types/baseball';
import { PlayOptions, RunnerResolution, getCurrentBatterSlot } from '../../engine/gameEngine';
import { Flame, ShieldAlert, Sparkles, ChevronDown, HelpCircle, Users, X } from 'lucide-react';
import { ScoringHelpModal } from './ScoringHelpModal';
import { PlayRunnerResolutionModal } from './PlayRunnerResolutionModal';
import { HitDirectionModal } from './HitDirectionModal';

export const ActionPad: React.FC = () => {
  const { gameState, executePlay } = useGameStore();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isDPModalOpen, setIsDPModalOpen] = useState(false);
  const [resolutionModalAction, setResolutionModalAction] = useState<PlayType | null>(null);
  const [hitDirectionModalAction, setHitDirectionModalAction] = useState<PlayType | null>(null);

  const runners = gameState.runners;
  const runnerCount = (runners.first ? 1 : 0) + (runners.second ? 1 : 0) + (runners.third ? 1 : 0);
  const canDoublePlay = runnerCount > 0 && gameState.count.outs < 2;

  const handleAction = (type: PlayType, label?: string, options?: PlayOptions) => {
    executePlay(type, label, options);
  };

  /**
   * Pour toute action sur balle frappée :
   * - Si des coureurs sont sur base : ouvre la modale universelle de résolution pour configurer
   *   les avancements, les points et les retraits (ou choisir un préréglage 1-clic).
   * - Si les bases sont vides : ouvre la modale de sélection de direction de frappe (Gauche, Centre, Droit, Infield) !
   */
  const handleBattedBallClick = (type: PlayType) => {
    if (runnerCount > 0) {
      setResolutionModalAction(type);
    } else {
      setHitDirectionModalAction(type);
    }
  };

  const handleTriggerDP = () => {
    setIsDPModalOpen(true);
  };

  return (
    <>
      <ScoringHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Modale universelle de résolution des coureurs sur balle frappée */}
      <PlayRunnerResolutionModal
        isOpen={resolutionModalAction !== null}
        actionType={resolutionModalAction || 'GROUNDOUT'}
        gameState={gameState}
        onClose={() => setResolutionModalAction(null)}
        onConfirm={(resolution: RunnerResolution, customDesc?: string) => {
          if (resolutionModalAction) {
            handleAction(resolutionModalAction, customDesc, { runnerResolution: resolution });
            setResolutionModalAction(null);
          }
        }}
      />

      {/* Modale de sélection de la direction quand les bases sont vides */}
      <HitDirectionModal
        isOpen={hitDirectionModalAction !== null}
        actionType={hitDirectionModalAction || 'SINGLE'}
        batterName={getCurrentBatterSlot(gameState)?.player?.name}
        onClose={() => setHitDirectionModalAction(null)}
        onSelectZone={(zone) => {
          if (hitDirectionModalAction) {
            handleAction(hitDirectionModalAction, undefined, { hitZone: zone });
            setHitDirectionModalAction(null);
          }
        }}
      />

      <div className="bg-white border border-slate-300 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        {/* En-tête du pavé avec bouton d'aide */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
          <div className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            Pavé de Scorage Tactile
          </div>

          <button
            onClick={() => setIsHelpOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-black border border-red-200 transition active:scale-95 shadow-sm"
            title="Consulter le guide des boutons et des règles FFBS"
          >
            <HelpCircle className="w-4 h-4 text-red-600" />
            <span>Guide des boutons (?)</span>
          </button>
        </div>

        {/* 1. SECTION COMPTE & LANCERS (PITCHES) */}
        <div>
          <div className="text-xs sm:text-sm font-black text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            Lancers & Compte
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              onClick={() => handleAction('BALL')}
              className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 active:scale-95 border-2 border-emerald-400 transition shadow-sm text-emerald-950 font-black"
            >
              <span className="text-xl sm:text-2xl font-black">BALL</span>
              <span className="text-xs text-emerald-800 font-bold">Balle (B)</span>
            </button>

            <button
              onClick={() => handleAction('CALLED_STRIKE')}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-amber-50 hover:bg-amber-100 active:scale-95 border-2 border-amber-400 transition shadow-sm text-amber-950 font-black text-center"
            >
              <span className="text-sm sm:text-base font-black leading-tight">STRIKE LOOKING</span>
              <span className="text-[11px] text-amber-800 font-bold">Prise regardée (KL)</span>
            </button>

            <button
              onClick={() => handleAction('SWINGING_STRIKE')}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-amber-50 hover:bg-amber-100 active:scale-95 border-2 border-amber-400 transition shadow-sm text-amber-950 font-black text-center"
            >
              <span className="text-sm sm:text-base font-black leading-tight">STRIKE SWINGING</span>
              <span className="text-[11px] text-amber-800 font-bold">Prise balancée (KS)</span>
            </button>

            <button
              onClick={() => handleAction('FOUL')}
              className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 border-2 border-slate-300 transition shadow-sm text-slate-900 font-black"
            >
              <span className="text-lg sm:text-xl font-black">FOUL BALL</span>
              <span className="text-xs text-slate-600 font-bold">Fausse balle (F)</span>
            </button>
          </div>
        </div>

        {/* 2. SECTION COUPS SÛRS (HITS) */}
        <div>
          <div className="text-xs sm:text-sm font-black text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            Frappes en jeu (Hits)
          </div>
          <div className="grid grid-cols-4 gap-2.5">
            <button
              onClick={() => handleBattedBallClick('SINGLE')}
              className="flex flex-col items-center justify-center py-3 px-1 sm:p-3.5 rounded-xl bg-blue-50 hover:bg-blue-100 active:scale-95 border-2 border-blue-400 transition shadow-sm text-blue-950 font-black"
            >
              <span className="text-xl sm:text-2xl font-black">1B</span>
              <span className="text-xs text-blue-800 font-bold">Simple</span>
            </button>

            <button
              onClick={() => handleBattedBallClick('DOUBLE')}
              className="flex flex-col items-center justify-center py-3 px-1 sm:p-3.5 rounded-xl bg-blue-50 hover:bg-blue-100 active:scale-95 border-2 border-blue-400 transition shadow-sm text-blue-950 font-black"
            >
              <span className="text-xl sm:text-2xl font-black">2B</span>
              <span className="text-xs text-blue-800 font-bold">Double</span>
            </button>

            <button
              onClick={() => handleBattedBallClick('TRIPLE')}
              className="flex flex-col items-center justify-center py-3 px-1 sm:p-3.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 active:scale-95 border-2 border-indigo-400 transition shadow-sm text-indigo-950 font-black"
            >
              <span className="text-xl sm:text-2xl font-black">3B</span>
              <span className="text-xs text-indigo-800 font-bold">Triple</span>
            </button>

            <button
              onClick={() => handleBattedBallClick('HOMERUN')}
              className="flex flex-col items-center justify-center py-3 px-1 sm:p-3.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-700 hover:to-amber-600 active:scale-95 border-2 border-red-700 transition shadow-md text-white font-black"
            >
              <span className="text-xl sm:text-2xl font-black flex items-center gap-1">
                HR <Flame className="w-4 h-4" />
              </span>
              <span className="text-xs text-amber-100 font-black">Circuit</span>
            </button>
          </div>
        </div>

        {/* 3. SECTION RETRAITS (OUTS) */}
        <div>
          <div className="text-xs sm:text-sm font-black text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
            Retraits Défensifs (Outs)
          </div>
          <div className={`grid ${runnerCount > 0 ? 'grid-cols-5' : 'grid-cols-4'} gap-2.5`}>
            <button
              onClick={() => handleAction('STRIKEOUT')}
              className="flex flex-col items-center justify-center py-3 px-1 sm:p-3 rounded-xl bg-rose-50 hover:bg-rose-100 active:scale-95 border-2 border-rose-400 transition shadow-sm text-rose-950 font-black"
            >
              <span className="text-lg sm:text-xl font-black">K</span>
              <span className="text-xs text-rose-800 font-bold truncate">3 Strikes</span>
            </button>

            <button
              onClick={() => handleBattedBallClick('GROUNDOUT')}
              className="flex flex-col items-center justify-center py-3 px-1 sm:p-3 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 border-2 border-slate-300 transition shadow-sm text-slate-900 font-black"
            >
              <span className="text-lg sm:text-xl font-black">GO</span>
              <span className="text-xs text-slate-700 font-bold truncate">Roulant</span>
            </button>

            <button
              onClick={() => handleBattedBallClick('FLYOUT')}
              className="flex flex-col items-center justify-center py-3 px-1 sm:p-3 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 border-2 border-slate-300 transition shadow-sm text-slate-900 font-black"
            >
              <span className="text-lg sm:text-xl font-black">FO</span>
              <span className="text-xs text-slate-700 font-bold truncate">Volée (Fly)</span>
            </button>

            <button
              onClick={() => handleBattedBallClick('LINEOUT')}
              className="flex flex-col items-center justify-center py-3 px-1 sm:p-3 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 border-2 border-slate-300 transition shadow-sm text-slate-900 font-black"
            >
              <span className="text-lg sm:text-xl font-black">LO</span>
              <span className="text-xs text-slate-700 font-bold truncate">Ligne</span>
            </button>

            {runnerCount > 0 && (
              <button
                onClick={() => handleBattedBallClick('FIELDERS_CHOICE')}
                className="flex flex-col items-center justify-center py-3 px-1 sm:p-3 rounded-xl bg-amber-50 hover:bg-amber-100 active:scale-95 border-2 border-amber-400 transition shadow-sm text-amber-950 font-black"
                title="Choix défensif : retrait sur coureur au marbre, en 3B ou en 2B"
              >
                <span className="text-lg sm:text-xl font-black">FC</span>
                <span className="text-xs text-amber-900 font-bold truncate">Choix Déf.</span>
              </button>
            )}

            {canDoublePlay && (
              <button
                onClick={handleTriggerDP}
                className={`${runnerCount > 0 ? 'col-span-5' : 'col-span-4'} flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-black text-xs sm:text-sm shadow-md transition active:scale-95 animate-pulse`}
              >
                <Users className="w-4 h-4" />
                <span>DOUBLE JEU DÉFENSIF (DP) • 2 Retraits</span>
              </button>
            )}
          </div>
        </div>

        {/* 4. SECTION ACTIONS SPÉCIALES DÉPLIABLES */}
        <div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between text-xs sm:text-sm text-slate-700 hover:text-slate-900 py-1.5 font-bold transition border-t border-slate-200 pt-2.5"
          >
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              Actions spéciales (BB, HBP, Erreur, Sacrifices)
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            />
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2 pt-2 animate-in fade-in">
              <button
                onClick={() => handleAction('WALK')}
                className="py-2.5 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs sm:text-sm font-bold transition active:scale-95 shadow-sm"
              >
                BB (But s/ balles)
              </button>

              <button
                onClick={() => handleAction('HIT_BY_PITCH')}
                className="py-2.5 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs sm:text-sm font-bold transition active:scale-95 shadow-sm"
              >
                HBP (Mort s/ balles)
              </button>

              <button
                onClick={() => handleBattedBallClick('ERROR')}
                className="py-2.5 px-2 rounded-lg bg-orange-50 hover:bg-orange-100 border border-orange-300 text-orange-950 text-xs sm:text-sm font-bold transition active:scale-95 shadow-sm"
              >
                E (Erreur défensive)
              </button>

              <button
                onClick={() => handleBattedBallClick('SACRIFICE_FLY')}
                className="py-2.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-900 text-xs sm:text-sm font-bold transition active:scale-95 shadow-sm"
              >
                SF (Balle sac.)
              </button>

              <button
                onClick={() => handleBattedBallClick('SACRIFICE_BUNT')}
                className="py-2.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-900 text-xs sm:text-sm font-bold transition active:scale-95 shadow-sm"
              >
                SH (Amorti sac.)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODALE DE SÉLECTION DU DOUBLE JEU */}
      {isDPModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-slate-300 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl text-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-sm shadow">
                  DP
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base sm:text-lg">
                    Enregistrer un Double Jeu (2 retraits)
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    Coureurs sur base : {runners.first ? '1B ' : ''}{runners.second ? '2B ' : ''}{runners.third ? '3B' : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDPModalOpen(false)}
                className="text-slate-400 hover:text-slate-800 p-1.5 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {runners.first && runners.second ? (
                <>
                  {/* 1. RETRAIT 2B + 1B */}
                  <button
                    onClick={() => {
                      handleAction('DOUBLE_PLAY', undefined, { dpVariant: '2B_1B' });
                      setIsDPModalOpen(false);
                    }}
                    className="w-full text-left p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-300 transition group shadow-sm"
                  >
                    <div className="flex items-center justify-between font-black text-emerald-950 text-sm mb-1">
                      <span className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-xs">2B + 1B</span>
                        Double Jeu Classique (ex: 6-4-3)
                      </span>
                      <span className="text-xs font-mono bg-white px-2 py-0.5 rounded border border-emerald-300 font-bold">
                        GDP 643
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium">
                      • <strong>Retraits :</strong> Coureur de 1B éliminé en 2B + Batteur éliminé en 1B.<br />
                      • <strong>Avancée :</strong> Le coureur de 2B avance en 3B.
                    </p>
                  </button>

                  {/* 2. RETRAIT 3B + 1B */}
                  <button
                    onClick={() => {
                      handleAction('DOUBLE_PLAY', undefined, { dpVariant: '3B_1B' });
                      setIsDPModalOpen(false);
                    }}
                    className="w-full text-left p-3.5 rounded-2xl bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 transition group shadow-sm"
                  >
                    <div className="flex items-center justify-between font-black text-amber-950 text-sm mb-1">
                      <span className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-amber-600 text-white text-xs">3B + 1B</span>
                        Double Jeu 3B + 1B (ex: 5-3 DP)
                      </span>
                      <span className="text-xs font-mono bg-white px-2 py-0.5 rounded border border-amber-300 font-bold">
                        GDP 53
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium">
                      • <strong>Retraits :</strong> Coureur de 2B éliminé en 3B + Batteur éliminé en 1B.<br />
                      • <strong>Avancée :</strong> Le coureur de 1B avance en 2B.
                    </p>
                  </button>

                  {/* 3. RETRAIT 3B + 2B */}
                  <button
                    onClick={() => {
                      handleAction('DOUBLE_PLAY', undefined, { dpVariant: '3B_2B' });
                      setIsDPModalOpen(false);
                    }}
                    className="w-full text-left p-3.5 rounded-2xl bg-rose-50 hover:bg-rose-100 border-2 border-rose-300 transition group shadow-sm"
                  >
                    <div className="flex items-center justify-between font-black text-rose-950 text-sm mb-1">
                      <span className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-xs">3B + 2B</span>
                        Double Jeu 3B + 2B (ex: 5-4 FC)
                      </span>
                      <span className="text-xs font-mono bg-white px-2 py-0.5 rounded border border-rose-300 font-bold">
                        FC 54
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium">
                      • <strong>Retraits :</strong> Coureur de 2B retiré en 3B + Coureur de 1B retiré en 2B.<br />
                      • <strong>Batteur :</strong> Sauf en 1B sur choix défensif (Option).
                    </p>
                  </button>
                </>
              ) : (
                /* CAS STANDARD : 1 COUREUR SUR BASE */
                <button
                  onClick={() => {
                    handleAction('DOUBLE_PLAY', undefined, { dpVariant: '2B_1B' });
                    setIsDPModalOpen(false);
                  }}
                  className="w-full text-left p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-300 transition group shadow-sm"
                >
                  <div className="flex items-center justify-between font-black text-emerald-950 text-sm mb-1">
                    <span className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-xs">Classique 6-4-3</span>
                      Double Jeu Coureur + Batteur
                    </span>
                    <span className="text-xs font-mono bg-white px-2 py-0.5 rounded border border-emerald-300 font-bold">
                      GDP 643
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium">
                    Coureur de 1B forcé en 2B + Batteur retiré en 1B (2 retraits).
                  </p>
                </button>
              )}

              {/* BALLE EN VOLÉE CAPTÉE + RELAIS */}
              <button
                onClick={() => {
                  handleAction('DOUBLE_PLAY', undefined, { dpVariant: 'FLY_RELAY' });
                  setIsDPModalOpen(false);
                }}
                className="w-full text-left p-3.5 rounded-2xl bg-purple-50 hover:bg-purple-100 border-2 border-purple-300 transition group shadow-sm"
              >
                <div className="flex items-center justify-between font-black text-purple-950 text-sm mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-purple-600 text-white text-xs">Volée + Relais</span>
                    Flyout DP (Batteur de volée + Coureur)
                  </span>
                  <span className="text-xs font-mono bg-white px-2 py-0.5 rounded border border-purple-300 font-bold">
                    F8-4 DP
                  </span>
                </div>
                <p className="text-xs text-slate-700 font-medium">
                  Balle en volée captée au champ + un coureur hors-base éliminé avant de retoucher son but.
                </p>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
