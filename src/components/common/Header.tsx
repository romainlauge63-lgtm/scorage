import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Undo2, Redo2, RotateCcw, HelpCircle } from 'lucide-react';
import { ScoringHelpModal } from '../live/ScoringHelpModal';

interface HeaderProps {
  activeTab: 'live' | 'setup' | 'substitutions' | 'ffbs' | 'boxscore';
  setActiveTab: (tab: 'live' | 'setup' | 'substitutions' | 'ffbs' | 'boxscore') => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const { gameState, history, future, undo, redo, resetGame } = useGameStore();
  const [isHelpOpen, setIsHelpOpen] = React.useState(false);

  return (
    <>
      <ScoringHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 select-none shadow-sm">
        {/* Barre supérieure */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center font-black text-white text-xl shadow">
              ⚾
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 leading-tight flex items-center gap-1.5">
                Scorage
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold border border-slate-200">
                  France
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-semibold hidden sm:block">
                PWA de Scorage Baseball & Softball • Conforme FFBS / WBSC
              </p>
            </div>
          </div>

          {/* Boutons d'actions rapides (Undo, Redo, Reset, Aide) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsHelpOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition active:scale-95 shadow-sm"
              title="Aide et explications de tous les boutons de l'application"
            >
              <HelpCircle className="w-4 h-4 text-red-600" />
              <span className="hidden sm:inline">Guide & Aide</span>
              <span className="sm:hidden font-black">(?)</span>
            </button>
          <button
            onClick={undo}
            disabled={history.length === 0}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-bold transition ${
              history.length > 0
                ? 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300 active:scale-95 shadow-sm'
                : 'bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
            title="Annuler la dernière action"
          >
            <Undo2 className="w-4 h-4" />
            <span>Annuler</span>
            {history.length > 0 && (
              <span className="text-xs bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded-full font-bold">
                {history.length}
              </span>
            )}
          </button>

          <button
            onClick={redo}
            disabled={future.length === 0}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-bold transition ${
              future.length > 0
                ? 'bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-300 active:scale-95 shadow-sm'
                : 'bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
            title="Rétablir l'action"
          >
            <Redo2 className="w-4 h-4" />
            <span className="hidden md:inline">Rétablir</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('Réinitialiser la partie à zéro ? Tous les scores seront effacés.')) {
                resetGame();
              }
            }}
            className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition"
            title="Nouveau match"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Onglets de navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex border-t border-slate-200 overflow-x-auto text-sm sm:text-base font-bold">
        <button
          onClick={() => setActiveTab('live')}
          className={`py-3 px-4 border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
            activeTab === 'live'
              ? 'border-red-600 text-red-600 bg-red-50/60 font-black'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
          </span>
          Direct
          <span className="ml-1 text-xs px-2 py-0.5 bg-slate-900 text-white rounded-md font-mono font-bold shadow-sm">
            {gameState.awayScore} - {gameState.homeScore}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ffbs')}
          className={`py-3 px-4 border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
            activeTab === 'ffbs'
              ? 'border-red-600 text-red-600 bg-red-50/60 font-black'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <span className="text-xs bg-red-600 text-white font-black px-1.5 py-0.5 rounded shadow-sm">
            FFBS
          </span>
          Feuille de Scorage Officielle
        </button>

        <button
          onClick={() => setActiveTab('setup')}
          className={`py-3 px-4 border-b-2 whitespace-nowrap transition ${
            activeTab === 'setup'
              ? 'border-red-600 text-red-600 bg-red-50/60 font-black'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Équipes & Line-ups
        </button>

        <button
          onClick={() => setActiveTab('substitutions')}
          className={`py-3 px-4 border-b-2 whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'substitutions'
              ? 'border-red-600 text-red-600 bg-red-50/60 font-black'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Changements
          {gameState.substitutions.length > 0 && (
            <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
              {gameState.substitutions.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('boxscore')}
          className={`py-3 px-4 border-b-2 whitespace-nowrap transition ${
            activeTab === 'boxscore'
              ? 'border-red-600 text-red-600 bg-red-50/60 font-black'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Box Score Synthèse
        </button>
      </div>
    </header>
    </>
  );
};
