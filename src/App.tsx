import React, { useState } from 'react';
import { useGameStore } from './store/useGameStore';
import { Header } from './components/common/Header';
import { ScoreBoard } from './components/live/ScoreBoard';
import { CountGauge } from './components/live/CountGauge';
import { Diamond } from './components/live/Diamond';
import { MatchupCard } from './components/live/MatchupCard';
import { ActionPad } from './components/live/ActionPad';
import { PlaysTimeline } from './components/live/PlaysTimeline';
import { GameSetup } from './components/setup/GameSetup';
import { SubstitutionView } from './components/substitutions/SubstitutionView';
import { BoxScoreView } from './components/boxscore/BoxScoreView';
import { FFBSScoreSheet } from './components/ffbs/FFBSScoreSheet';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'live' | 'setup' | 'substitutions' | 'ffbs' | 'boxscore'>('live');
  const { gameState } = useGameStore();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      {/* Barre supérieure avec navigation et boutons Undo/Redo */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Contenu principal selon l'onglet actif */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6">
        {activeTab === 'live' && (
          <div className="space-y-4">
            {/* 1. Tableau des scores par manche */}
            <ScoreBoard state={gameState} />

            {/* 2. Cœur du scorage en 2 colonnes adaptatives */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Colonne gauche (Compte, Fiche duel Batteur/Lanceur, Boutons d'actions) */}
              <div className="lg:col-span-7 space-y-4">
                {/* Jauge B-S-O */}
                <CountGauge
                  count={gameState.count}
                  inning={gameState.currentInning}
                  isTop={gameState.isTop}
                />

                {/* Duel au bâton */}
                <MatchupCard state={gameState} />

                {/* Pavé de boutons tactiles rapides */}
                <ActionPad />
              </div>

              {/* Colonne droite (Losange des coureurs et fil des actions) */}
              <div className="lg:col-span-5 space-y-4">
                {/* Losange interactif des 3 buts */}
                <Diamond runners={gameState.runners} />

                {/* Fil d'historique des actions */}
                <PlaysTimeline plays={gameState.plays} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'setup' && <GameSetup />}

        {activeTab === 'substitutions' && <SubstitutionView />}

        {activeTab === 'ffbs' && <FFBSScoreSheet />}

        {activeTab === 'boxscore' && <BoxScoreView />}
      </main>

      {/* Pied de page discret */}
      <footer className="border-t border-slate-200 bg-white py-3 text-center text-xs text-slate-500 print:hidden font-medium">
        Scorage • Application PWA Baseball & Softball • Conforme aux règles officielles FFBS / WBSC
      </footer>
    </div>
  );
};

export default App;
