import { create } from 'zustand';
import { GameState, PlayType, LineupSlot, Player, SubstitutionRecord, GameConfig } from '../types/baseball';
import { createInitialGameState } from '../engine/sampleData';
import { processAction, PlayOptions } from '../engine/gameEngine';

interface GameStore {
  gameState: GameState;
  history: GameState[];
  future: GameState[];
  
  // Actions
  executePlay: (actionType: PlayType, customDesc?: string, options?: PlayOptions) => void;
  undo: () => void;
  redo: () => void;
  updateConfig: (config: Partial<GameConfig>) => void;
  updateTeamName: (team: 'away' | 'home', name: string) => void;
  updateLineupSlot: (team: 'away' | 'home', order: number, updates: Partial<LineupSlot>) => void;
  addBenchPlayer: (team: 'away' | 'home', player: Player) => void;
  removeBenchPlayer: (team: 'away' | 'home', playerId: string) => void;
  makeSubstitution: (sub: {
    team: 'away' | 'home';
    type: SubstitutionRecord['type'];
    playerOutId: string;
    playerInId: string;
    newPosition?: number;
    notes?: string;
  }) => void;
  manualRunnerAdvance: (fromBase: 'first' | 'second' | 'third', to: 'second' | 'third' | 'home' | 'out') => void;
  resetGame: () => void;
}

const STORAGE_KEY = 'scorage_baseball_pwa_v1';

const getInitialState = (): GameState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Erreur lecture localStorage', e);
  }
  return createInitialGameState();
};

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: getInitialState(),
  history: [],
  future: [],

  executePlay: (actionType, customDesc, options) => {
    const current = get().gameState;
    const { newState } = processAction(current, actionType, customDesc, options);
    
    // Sauvegarde dans l'historique (max 50 coups en arrière)
    const newHistory = [current, ...get().history.slice(0, 49)];
    
    // Persistance locale instantanée
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (e) {
      console.warn('Storage quota', e);
    }

    set({
      gameState: newState,
      history: newHistory,
      future: [], // On vide le futur lors d'une nouvelle action
    });
  },

  undo: () => {
    const { history, gameState, future } = get();
    if (history.length === 0) return;

    const previous = history[0];
    const newHistory = history.slice(1);
    const newFuture = [gameState, ...future];

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(previous));
    } catch (e) {
      console.warn(e);
    }

    set({
      gameState: previous,
      history: newHistory,
      future: newFuture,
    });
  },

  redo: () => {
    const { history, gameState, future } = get();
    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);
    const newHistory = [gameState, ...history];

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn(e);
    }

    set({
      gameState: next,
      history: newHistory,
      future: newFuture,
    });
  },

  updateConfig: (configUpdates) => {
    set((state) => {
      const updated: GameState = {
        ...state.gameState,
        config: { ...state.gameState.config, ...configUpdates },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { gameState: updated };
    });
  },

  updateTeamName: (team, name) => {
    set((state) => {
      const teamKey = team === 'away' ? 'awayTeam' : 'homeTeam';
      const updated: GameState = {
        ...state.gameState,
        [teamKey]: { ...state.gameState[teamKey], name },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { gameState: updated };
    });
  },

  updateLineupSlot: (team, order, updates) => {
    set((state) => {
      const teamKey = team === 'away' ? 'awayTeam' : 'homeTeam';
      const currentTeam = state.gameState[teamKey];
      const updatedLineup = currentTeam.lineup.map((slot) => {
        if (slot.order === order) {
          return {
            ...slot,
            ...updates,
            player: updates.player ? { ...slot.player, ...updates.player } : slot.player,
          };
        }
        return slot;
      });

      const updated: GameState = {
        ...state.gameState,
        [teamKey]: { ...currentTeam, lineup: updatedLineup },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { gameState: updated };
    });
  },

  addBenchPlayer: (team, player) => {
    set((state) => {
      const teamKey = team === 'away' ? 'awayTeam' : 'homeTeam';
      const currentTeam = state.gameState[teamKey];
      const updated: GameState = {
        ...state.gameState,
        [teamKey]: {
          ...currentTeam,
          bench: [...currentTeam.bench, player],
        },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { gameState: updated };
    });
  },

  removeBenchPlayer: (team, playerId) => {
    set((state) => {
      const teamKey = team === 'away' ? 'awayTeam' : 'homeTeam';
      const currentTeam = state.gameState[teamKey];
      const updated: GameState = {
        ...state.gameState,
        [teamKey]: {
          ...currentTeam,
          bench: currentTeam.bench.filter(p => p.id !== playerId),
        },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { gameState: updated };
    });
  },

  makeSubstitution: ({ team, type, playerOutId, playerInId, newPosition, notes }) => {
    const current = get().gameState;
    const teamKey = team === 'away' ? 'awayTeam' : 'homeTeam';
    const targetTeam = current[teamKey];

    // Trouver le joueur sortant et le joueur entrant
    let playerOut = targetTeam.lineup.find(s => s.player.id === playerOutId)?.player ||
                    targetTeam.bench.find(p => p.id === playerOutId);
    let playerIn = targetTeam.bench.find(p => p.id === playerInId) ||
                   targetTeam.lineup.find(s => s.player.id === playerInId)?.player;

    if (!playerOut || !playerIn) return;

    let updatedLineup = [...targetTeam.lineup];
    let updatedBench = [...targetTeam.bench];
    let activePitcherAwayId = current.activePitcherAwayId;
    let activePitcherHomeId = current.activePitcherHomeId;

    if (type === 'PITCHER_CHANGE') {
      if (team === 'away') {
        activePitcherAwayId = playerIn.id;
      } else {
        activePitcherHomeId = playerIn.id;
      }
      // Si le lanceur est dans le lineup (pas de DH)
      updatedLineup = updatedLineup.map(slot => {
        if (slot.player.id === playerOutId) {
          return { ...slot, player: playerIn!, isStarter: false };
        }
        return slot;
      });
    } else {
      // Remplacement standard dans l'alignement
      updatedLineup = updatedLineup.map(slot => {
        if (slot.player.id === playerOutId) {
          return {
            ...slot,
            player: playerIn!,
            position: newPosition ? (newPosition as any) : slot.position,
            isStarter: false,
          };
        }
        return slot;
      });
      // Le joueur entrant quitte le banc, le joueur sortant y rentre
      updatedBench = updatedBench.filter(p => p.id !== playerIn!.id);
      if (!updatedBench.some(p => p.id === playerOut!.id)) {
        updatedBench.push(playerOut);
      }
    }

    const subRecord: SubstitutionRecord = {
      id: `sub-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      inning: current.currentInning,
      isTop: current.isTop,
      teamName: targetTeam.name,
      type,
      playerOutName: playerOut.name,
      playerInName: playerIn.name,
      newPosition: newPosition as any,
      notes,
    };

    const newState: GameState = {
      ...current,
      activePitcherAwayId,
      activePitcherHomeId,
      [teamKey]: {
        ...targetTeam,
        lineup: updatedLineup,
        bench: updatedBench,
      },
      substitutions: [subRecord, ...current.substitutions],
    };

    set({
      gameState: newState,
      history: [current, ...get().history],
      future: [],
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  },

  manualRunnerAdvance: (fromBase, to) => {
    const current = get().gameState;
    const runner = current.runners[fromBase];
    if (!runner) return;

    let newRunners = { ...current.runners };
    newRunners[fromBase] = null;

    let runsScored = 0;
    if (to === 'second') newRunners.second = runner;
    else if (to === 'third') newRunners.third = runner;
    else if (to === 'home') runsScored = 1;

    let newState: GameState = {
      ...current,
      runners: newRunners,
    };

    if (runsScored > 0) {
      const scoreKey = current.isTop ? 'awayScore' : 'homeScore';
      const inningScores = current.inningScores.map(inn => {
        if (inn.inningNumber === current.currentInning) {
          return current.isTop
            ? { ...inn, awayRuns: (inn.awayRuns || 0) + 1 }
            : { ...inn, homeRuns: (inn.homeRuns || 0) + 1 };
        }
        return inn;
      });
      newState = {
        ...newState,
        [scoreKey]: current[scoreKey] + 1,
        inningScores,
      };
    }

    set({
      gameState: newState,
      history: [current, ...get().history],
      future: [],
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  },

  resetGame: () => {
    const fresh = createInitialGameState();
    set({ gameState: fresh, history: [], future: [] });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  },
}));
