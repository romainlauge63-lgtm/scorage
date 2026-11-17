import { GameState, PlayRecord, PlayType, Player, LineupSlot, HitDirection, HitZoneNumber } from '../types/baseball';

export interface GameEngineOutput {
  newState: GameState;
  playRecord: PlayRecord;
}

export const getCurrentBatterSlot = (state: GameState): LineupSlot => {
  const team = state.isTop ? state.awayTeam : state.homeTeam;
  const index = state.isTop ? state.awayLineupIndex : state.homeLineupIndex;
  return team.lineup[index % team.lineup.length];
};

export const getCurrentPitcher = (state: GameState): Player => {
  if (state.isTop) {
    // Les visiteurs attaquent, donc le lanceur est dans l'équipe locale
    const pitcherId = state.activePitcherHomeId;
    const starter = state.homeTeam.lineup.find(s => s.player.id === pitcherId)?.player;
    if (starter) return starter;
    const benchPlayer = state.homeTeam.bench.find(p => p.id === pitcherId);
    if (benchPlayer) return benchPlayer;
    return { id: 'unknown-home-p', name: 'Lanceur Local', jerseyNumber: 1 };
  } else {
    // Les locaux attaquent, donc le lanceur est dans l'équipe visiteuse
    const pitcherId = state.activePitcherAwayId;
    const starter = state.awayTeam.lineup.find(s => s.player.id === pitcherId)?.player;
    if (starter) return starter;
    const benchPlayer = state.awayTeam.bench.find(p => p.id === pitcherId);
    if (benchPlayer) return benchPlayer;
    return { id: 'unknown-away-p', name: 'Lanceur Visiteur', jerseyNumber: 1 };
  }
};

const advanceBatter = (state: GameState): { awayLineupIndex: number; homeLineupIndex: number } => {
  if (state.isTop) {
    return {
      awayLineupIndex: (state.awayLineupIndex + 1) % state.awayTeam.lineup.length,
      homeLineupIndex: state.homeLineupIndex,
    };
  } else {
    return {
      awayLineupIndex: state.awayLineupIndex,
      homeLineupIndex: (state.homeLineupIndex + 1) % state.homeTeam.lineup.length,
    };
  }
};

const handleThirdOut = (state: GameState): Partial<GameState> => {
  const isTopEnding = state.isTop;
  const nextInning = isTopEnding ? state.currentInning : state.currentInning + 1;
  const nextIsTop = !isTopEnding;

  // Clôture ou mise à jour du tableau des manches
  const updatedInnings = state.inningScores.map(inn => {
    if (inn.inningNumber === state.currentInning) {
      return {
        ...inn,
        awayRuns: isTopEnding && inn.awayRuns === null ? 0 : inn.awayRuns,
        homeRuns: !isTopEnding && inn.homeRuns === null ? 0 : inn.homeRuns,
      };
    }
    return inn;
  });

  // Si on passe à une nouvelle manche qui n'existe pas encore dans le tableau
  if (!isTopEnding && !updatedInnings.some(i => i.inningNumber === nextInning)) {
    updatedInnings.push({
      inningNumber: nextInning,
      awayRuns: 0,
      homeRuns: null,
      awayHits: 0,
      homeHits: 0,
      awayErrors: 0,
      homeErrors: 0,
    });
  }

  // Vérification fin de match
  let isGameOver = false;
  if (!isTopEnding && state.currentInning >= state.config.scheduledInnings) {
    if (state.homeScore !== state.awayScore) {
      isGameOver = true;
    }
  }

  return {
    currentInning: nextInning,
    isTop: nextIsTop,
    count: { balls: 0, strikes: 0, outs: 0 },
    runners: { first: null, second: null, third: null },
    inningScores: updatedInnings,
    isGameOver,
  };
};

const addRuns = (state: GameState, runs: number): { awayScore: number; homeScore: number; inningScores: GameState['inningScores'] } => {
  const awayScore = state.isTop ? state.awayScore + runs : state.awayScore;
  const homeScore = !state.isTop ? state.homeScore + runs : state.homeScore;

  const inningScores = state.inningScores.map(inn => {
    if (inn.inningNumber === state.currentInning) {
      if (state.isTop) {
        return { ...inn, awayRuns: (inn.awayRuns || 0) + runs };
      } else {
        return { ...inn, homeRuns: (inn.homeRuns || 0) + runs };
      }
    }
    return inn;
  });

  return { awayScore, homeScore, inningScores };
};

const addHits = (state: GameState): { awayHits: number; homeHits: number; inningScores: GameState['inningScores'] } => {
  const awayHits = state.isTop ? state.awayHits + 1 : state.awayHits;
  const homeHits = !state.isTop ? state.homeHits + 1 : state.homeHits;

  const inningScores = state.inningScores.map(inn => {
    if (inn.inningNumber === state.currentInning) {
      if (state.isTop) {
        return { ...inn, awayHits: inn.awayHits + 1 };
      } else {
        return { ...inn, homeHits: inn.homeHits + 1 };
      }
    }
    return inn;
  });

  return { awayHits, homeHits, inningScores };
};

export type RunnerDestination =
  | 'hold'
  | 'first'
  | 'second'
  | 'third'
  | 'score'
  | 'out_first'
  | 'out_second'
  | 'out_third'
  | 'out_home'
  | 'out_air';

export interface RunnerResolution {
  runner3BDestination?: RunnerDestination;
  runner2BDestination?: RunnerDestination;
  runner1BDestination?: RunnerDestination;
  batterDestination?: RunnerDestination;
  fieldersInvolved?: string;
  hitDirection?: HitDirection;
  hitZone?: HitZoneNumber;
  customNotes?: string;
}

export interface PlayOptions {
  dpVariant?: '2B_1B' | '3B_1B' | '3B_2B' | 'FLY_RELAY';
  fcVariant?: 'OUT_HOME' | 'OUT_3B' | 'OUT_2B';
  doubleVariant?: 'STANDARD' | 'OUT_HOME' | 'OUT_3B' | 'R1_SCORES';
  runner3BAction?: 'score' | 'hold';
  runner2BAction?: 'third' | 'score' | 'hold';
  runner1BAction?: 'second' | 'third';
  hitDirection?: HitDirection;
  hitZone?: HitZoneNumber;
  runnerResolution?: RunnerResolution;
}

export const processAction = (
  state: GameState,
  actionType: PlayType,
  customDesc?: string,
  options?: PlayOptions
): GameEngineOutput => {
  const batterSlot = getCurrentBatterSlot(state);
  const batter = batterSlot.player;
  const pitcher = getCurrentPitcher(state);

  const baseRecord: Omit<PlayRecord, 'id' | 'timestamp' | 'description' | 'rbi' | 'runsScored' | 'outsRecorded'> = {
    inning: state.currentInning,
    isTop: state.isTop,
    type: actionType,
    batterName: batter.name,
    batterOrder: batterSlot.order,
    pitcherName: pitcher.name,
    scoreAway: state.awayScore,
    scoreHome: state.homeScore,
  };

  // Traitement universel des jeux sur balle frappée avec résolution précise des coureurs
  if (options?.runnerResolution) {
    const res = options.runnerResolution;
    let outsRecorded = 0;
    let runsScored = 0;
    const newRunners: GameState['runners'] = { first: null, second: null, third: null };
    const descParts: string[] = [];

    // 1. Coureur en 3B
    if (state.runners.third) {
      const dest = res.runner3BDestination || 'hold';
      const r3 = state.runners.third;
      if (dest.startsWith('out_')) {
        outsRecorded += 1;
        const outLocation = dest === 'out_home' ? 'au marbre' : dest === 'out_third' ? 'en 3B' : 'sur base';
        descParts.push(`${r3.name} éliminé ${outLocation}`);
      } else if (dest === 'score') {
        runsScored += 1;
        descParts.push(`${r3.name} marque`);
      } else {
        newRunners.third = r3;
      }
    }

    // 2. Coureur en 2B
    if (state.runners.second) {
      const dest = res.runner2BDestination || 'hold';
      const r2 = state.runners.second;
      if (dest.startsWith('out_')) {
        outsRecorded += 1;
        const outLocation = dest === 'out_home' ? 'au marbre' : dest === 'out_third' ? 'en 3B' : 'en 2B';
        descParts.push(`${r2.name} éliminé ${outLocation}`);
      } else if (dest === 'score') {
        runsScored += 1;
        descParts.push(`${r2.name} marque`);
      } else if (dest === 'third') {
        newRunners.third = r2;
        descParts.push(`${r2.name} avance en 3B`);
      } else {
        newRunners.second = r2;
      }
    }

    // 3. Coureur en 1B
    if (state.runners.first) {
      const dest = res.runner1BDestination || 'hold';
      const r1 = state.runners.first;
      if (dest.startsWith('out_')) {
        outsRecorded += 1;
        const outLocation = dest === 'out_home' ? 'au marbre' : dest === 'out_third' ? 'en 3B' : 'en 2B';
        descParts.push(`${r1.name} éliminé ${outLocation}`);
      } else if (dest === 'score') {
        runsScored += 1;
        descParts.push(`${r1.name} marque`);
      } else if (dest === 'third') {
        newRunners.third = r1;
        descParts.push(`${r1.name} avance en 3B`);
      } else if (dest === 'second') {
        newRunners.second = r1;
        descParts.push(`${r1.name} avance en 2B`);
      } else {
        newRunners.first = r1;
      }
    }

    // 4. Batteur
    const defaultBatterDest: RunnerDestination = 
      actionType === 'SINGLE' ? 'first' :
      actionType === 'DOUBLE' ? 'second' :
      actionType === 'TRIPLE' ? 'third' :
      actionType === 'HOMERUN' ? 'score' :
      (actionType === 'FIELDERS_CHOICE' || actionType === 'ERROR') ? 'first' :
      (actionType === 'FLYOUT' || actionType === 'LINEOUT' || actionType === 'SACRIFICE_FLY') ? 'out_air' :
      'out_first';

    const batterDest = res.batterDestination || defaultBatterDest;
    let batterActionDesc = '';
    if (batterDest.startsWith('out_')) {
      outsRecorded += 1;
      if (batterDest === 'out_air') {
        batterActionDesc = `${batter.name} retiré de volée`;
      } else {
        batterActionDesc = `${batter.name} retiré en 1B`;
      }
    } else if (batterDest === 'score') {
      runsScored += 1;
      batterActionDesc = `${batter.name} marque`;
    } else if (batterDest === 'third') {
      newRunners.third = batter;
      batterActionDesc = `${batter.name} sauf en 3B`;
    } else if (batterDest === 'second') {
      newRunners.second = batter;
      batterActionDesc = `${batter.name} sauf en 2B`;
    } else if (batterDest === 'first') {
      newRunners.first = batter;
      batterActionDesc = `${batter.name} sauf en 1B`;
    }

    const nextOuts = state.count.outs + outsRecorded;

    // Règle officielle FFBS / WBSC 5.08(a) :
    // Aucun point ne peut marquer si le 3e retrait est effectué sur le batteur-coureur avant 1B ou sur jeu forcé
    if (nextOuts >= 3 && (batterDest === 'out_first' || batterDest === 'out_air')) {
      runsScored = 0;
    }

    // Calcul des points produits (RBI)
    let rbi = 0;
    if (actionType !== 'ERROR' && outsRecorded < 2) {
      rbi = runsScored;
    }

    // Résolution de la zone et de la direction (Gauche = 7, Centre = 8, Droite = 9)
    const hitZone = res.hitZone || (
      res.hitDirection === 'left' ? 7 :
      res.hitDirection === 'right' ? 9 :
      res.hitDirection === 'center' ? 8 :
      res.hitDirection === 'infield_3b' ? 5 :
      res.hitDirection === 'infield_ss' ? 6 :
      res.hitDirection === 'infield_2b' ? 4 :
      res.hitDirection === 'infield_1b' ? 3 :
      res.hitDirection === 'infield_p' ? 1 :
      res.hitDirection === 'infield_c' ? 2 : undefined
    );

    let directionName = '';
    if (hitZone === 7 || res.hitDirection === 'left') directionName = 'au champ gauche';
    else if (hitZone === 8 || res.hitDirection === 'center') directionName = 'au champ centre';
    else if (hitZone === 9 || res.hitDirection === 'right') directionName = 'au champ droit';
    else if (hitZone === 5 || res.hitDirection === 'infield_3b') directionName = 'vers la 3e base';
    else if (hitZone === 6 || res.hitDirection === 'infield_ss') directionName = "vers l'arrêt-court";
    else if (hitZone === 4 || res.hitDirection === 'infield_2b') directionName = 'vers la 2e base';
    else if (hitZone === 3 || res.hitDirection === 'infield_1b') directionName = 'vers la 1re base';
    else if (hitZone === 1 || res.hitDirection === 'infield_p') directionName = 'vers le lanceur';
    else if (hitZone === 2 || res.hitDirection === 'infield_c') directionName = 'vers le receveur';

    // Code FFBS officiel
    let ffbsCode = res.fieldersInvolved;
    if (!ffbsCode) {
      const z = hitZone || 8;
      if (actionType === 'SINGLE') ffbsCode = `-${z}`;
      else if (actionType === 'DOUBLE') ffbsCode = `≠${z}`;
      else if (actionType === 'TRIPLE') ffbsCode = `≡${z}`;
      else if (actionType === 'HOMERUN') ffbsCode = `HR${z}`;
      else if (actionType === 'FIELDERS_CHOICE') ffbsCode = hitZone ? `FC ${hitZone}` : 'FC 64';
      else if (actionType === 'ERROR') ffbsCode = hitZone ? `E${hitZone}` : 'E6';
      else if (actionType === 'SACRIFICE_FLY') ffbsCode = `SF${z}`;
      else if (actionType === 'SACRIFICE_BUNT') ffbsCode = hitZone ? `SH${hitZone}3` : 'SH13';
      else if (actionType === 'GROUNDOUT') ffbsCode = hitZone ? `${hitZone}3` : '63';
      else if (actionType === 'FLYOUT') ffbsCode = `F${z}`;
      else if (actionType === 'LINEOUT') ffbsCode = `L${hitZone ? (hitZone >= 7 ? hitZone : hitZone) : 6}`;
    }

    // Description claire et complète en français
    let finalDesc = customDesc;
    if (!finalDesc) {
      let typeLabel = 
        actionType === 'SINGLE' ? 'Simple (1B)' :
        actionType === 'DOUBLE' ? 'Double (2B)' :
        actionType === 'TRIPLE' ? 'Triple (3B)' :
        actionType === 'HOMERUN' ? 'Home Run' :
        actionType === 'FIELDERS_CHOICE' ? 'Choix défensif (FC)' :
        actionType === 'ERROR' ? 'Erreur défensive' :
        actionType === 'SACRIFICE_FLY' ? 'Balle sacrifice (SF)' :
        actionType === 'SACRIFICE_BUNT' ? 'Amorti sacrifice (SH)' :
        actionType === 'GROUNDOUT' ? 'Roulant' :
        actionType === 'FLYOUT' ? 'Balle en volée' :
        actionType === 'LINEOUT' ? 'Ligne' : actionType;

      if (directionName) {
        typeLabel += ` ${directionName}`;
      }

      const details = [batterActionDesc, ...descParts].filter(Boolean).join(', ');
      finalDesc = `${typeLabel} : ${details}${runsScored > 0 ? ` (+${runsScored} point${runsScored > 1 ? 's' : ''})` : ''}`;
    }

    const record: PlayRecord = {
      ...baseRecord,
      id: `play-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      description: finalDesc,
      rbi,
      runsScored,
      outsRecorded,
      ffbsCode,
      zone: hitZone,
    };

    let intermediateState: GameState = {
      ...state,
      runners: newRunners,
      count: { ...state.count, outs: nextOuts },
      ...advanceBatter(state),
    };

    if (['SINGLE', 'DOUBLE', 'TRIPLE', 'HOMERUN'].includes(actionType)) {
      const hitsUpdate = addHits(intermediateState);
      intermediateState = { ...intermediateState, ...hitsUpdate };
    }

    if (actionType === 'ERROR') {
      const errorProp = state.isTop ? 'homeErrors' : 'awayErrors';
      const inningScores = intermediateState.inningScores.map(inn => {
        if (inn.inningNumber === state.currentInning) {
          return state.isTop
            ? { ...inn, homeErrors: inn.homeErrors + 1 }
            : { ...inn, awayErrors: inn.awayErrors + 1 };
        }
        return inn;
      });
      intermediateState = {
        ...intermediateState,
        [errorProp]: state[errorProp] + 1,
        inningScores,
      };
    }

    if (runsScored > 0) {
      intermediateState = { ...intermediateState, ...addRuns(intermediateState, runsScored) };
    }

    if (nextOuts >= 3) {
      const halfInningState = handleThirdOut(intermediateState);
      const finalState: GameState = {
        ...intermediateState,
        ...halfInningState,
      };
      return { newState: { ...finalState, plays: [record, ...finalState.plays] }, playRecord: record };
    } else {
      const finalState: GameState = {
        ...intermediateState,
        count: { balls: 0, strikes: 0, outs: nextOuts },
      };
      return { newState: { ...finalState, plays: [record, ...finalState.plays] }, playRecord: record };
    }
  }

  // 1. BALL
  if (actionType === 'BALL') {
    if (state.count.balls < 3) {
      const newState: GameState = {
        ...state,
        count: { ...state.count, balls: state.count.balls + 1 },
      };
      const record: PlayRecord = {
        ...baseRecord,
        id: `play-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        description: `Balle (${newState.count.balls}-${newState.count.strikes})`,
        rbi: 0,
        runsScored: 0,
        outsRecorded: 0,
      };
      return { newState: { ...newState, plays: [record, ...newState.plays] }, playRecord: record };
    } else {
      // 4e Balle -> BUT SUR BALLES (WALK / BB)
      return processAction(state, 'WALK');
    }
  }

  // 2. STRIKES
  if (actionType === 'CALLED_STRIKE' || actionType === 'SWINGING_STRIKE') {
    const isSwinging = actionType === 'SWINGING_STRIKE';
    const strikeText = isSwinging ? 'Strike swinging' : 'Strike looking';

    if (state.count.strikes < 2) {
      const newState: GameState = {
        ...state,
        count: { ...state.count, strikes: state.count.strikes + 1 },
      };
      const record: PlayRecord = {
        ...baseRecord,
        id: `play-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        description: `${strikeText} (${newState.count.balls}-${newState.count.strikes})`,
        rbi: 0,
        runsScored: 0,
        outsRecorded: 0,
      };
      return { newState: { ...newState, plays: [record, ...newState.plays] }, playRecord: record };
    } else {
      // 3e Strike -> STRIKEOUT (K / KL / KS)
      return processAction(state, 'STRIKEOUT', isSwinging ? 'Strikeout swinging (KS)' : 'Strikeout looking (KL)');
    }
  }

  // 3. FOUL
  if (actionType === 'FOUL') {
    const newStrikes = state.count.strikes < 2 ? state.count.strikes + 1 : 2;
    const newState: GameState = {
      ...state,
      count: { ...state.count, strikes: newStrikes },
    };
    const record: PlayRecord = {
      ...baseRecord,
      id: `play-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      description: `Fausse balle (Foul) (${newState.count.balls}-${newStrikes})`,
      rbi: 0,
      runsScored: 0,
      outsRecorded: 0,
    };
    return { newState: { ...newState, plays: [record, ...newState.plays] }, playRecord: record };
  }

  // 4. RETRAITS (OUTS) : STRIKEOUT, GROUNDOUT, FLYOUT, LINEOUT, etc.
  if (
    actionType === 'STRIKEOUT' ||
    actionType === 'GROUNDOUT' ||
    actionType === 'FLYOUT' ||
    actionType === 'LINEOUT' ||
    actionType === 'POPOUT' ||
    actionType === 'SACRIFICE_FLY' ||
    actionType === 'SACRIFICE_BUNT'
  ) {
    const isSacFly = actionType === 'SACRIFICE_FLY';
    let runsScored = 0;
    let rbi = 0;
    let newRunners = { ...state.runners };

    // Balle sacrifice : si coureur en 3B et moins de 2 retraits, le point rentre
    if (isSacFly && state.runners.third && state.count.outs < 2) {
      runsScored = 1;
      rbi = 1;
      newRunners.third = null;
    }

    const nextOuts = state.count.outs + 1;

    // Résolution de la zone et de la direction
    const hitZone = options?.hitZone || (
      options?.hitDirection === 'left' ? 7 :
      options?.hitDirection === 'right' ? 9 :
      options?.hitDirection === 'center' ? 8 :
      options?.hitDirection === 'infield_3b' ? 5 :
      options?.hitDirection === 'infield_ss' ? 6 :
      options?.hitDirection === 'infield_2b' ? 4 :
      options?.hitDirection === 'infield_1b' ? 3 :
      options?.hitDirection === 'infield_p' ? 1 :
      options?.hitDirection === 'infield_c' ? 2 : undefined
    );

    let directionName = '';
    if (hitZone === 7 || options?.hitDirection === 'left') directionName = 'au champ gauche';
    else if (hitZone === 8 || options?.hitDirection === 'center') directionName = 'au champ centre';
    else if (hitZone === 9 || options?.hitDirection === 'right') directionName = 'au champ droit';
    else if (hitZone === 5 || options?.hitDirection === 'infield_3b') directionName = 'vers la 3e base';
    else if (hitZone === 6 || options?.hitDirection === 'infield_ss') directionName = "vers l'arrêt-court";
    else if (hitZone === 4 || options?.hitDirection === 'infield_2b') directionName = 'vers la 2e base';
    else if (hitZone === 3 || options?.hitDirection === 'infield_1b') directionName = 'vers la 1re base';
    else if (hitZone === 1 || options?.hitDirection === 'infield_p') directionName = 'vers le lanceur';
    else if (hitZone === 2 || options?.hitDirection === 'infield_c') directionName = 'vers le receveur';

    let ffbsCode: string | undefined = undefined;
    if (actionType === 'FLYOUT') ffbsCode = `F${hitZone || 8}`;
    else if (actionType === 'LINEOUT') ffbsCode = `L${hitZone || 6}`;
    else if (actionType === 'POPOUT') ffbsCode = `P${hitZone || 2}`;
    else if (actionType === 'SACRIFICE_FLY') ffbsCode = `SF${hitZone || 8}`;
    else if (actionType === 'GROUNDOUT') ffbsCode = hitZone ? `${hitZone}3` : '63';
    else if (actionType === 'SACRIFICE_BUNT') ffbsCode = hitZone ? `SH${hitZone}3` : 'SH13';

    let description = customDesc || `Retrait (${actionType})`;
    if (actionType === 'STRIKEOUT') description = customDesc || `Retrait sur 3 strikes (K) de ${batter.name}`;
    if (actionType === 'GROUNDOUT') description = customDesc || `Roulant de ${batter.name} ${directionName ? directionName + ' ' : ''}pour le retrait`;
    if (actionType === 'FLYOUT') description = customDesc || `Balle en volée captée de ${batter.name} ${directionName ? directionName : ''}`.trim();
    if (actionType === 'LINEOUT') description = customDesc || `Ligne captée de ${batter.name} ${directionName ? directionName : ''}`.trim();
    if (actionType === 'POPOUT') description = customDesc || `Petite chandelle captée de ${batter.name} ${directionName ? directionName : ''}`.trim();
    if (isSacFly) description = customDesc || `Balle sacrifice de ${batter.name} ${directionName ? directionName + ' ' : ''}(+1 point)`;

    const record: PlayRecord = {
      ...baseRecord,
      id: `play-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      description,
      rbi,
      runsScored,
      outsRecorded: 1,
      ffbsCode,
      zone: hitZone,
    };

    let intermediateState: GameState = {
      ...state,
      runners: newRunners,
      count: { ...state.count, outs: nextOuts },
      ...advanceBatter(state),
    };

    if (runsScored > 0) {
      const scoreUpdate = addRuns(intermediateState, runsScored);
      intermediateState = { ...intermediateState, ...scoreUpdate };
    }

    if (nextOuts >= 3) {
      // 3 retraits -> Changement de côté
      const halfInningState = handleThirdOut(intermediateState);
      const finalState: GameState = {
        ...intermediateState,
        ...halfInningState,
      };
      return { newState: { ...finalState, plays: [record, ...finalState.plays] }, playRecord: record };
    } else {
      // Prochain batteur, count réinitialisé
      const finalState: GameState = {
        ...intermediateState,
        count: { balls: 0, strikes: 0, outs: nextOuts },
      };
      return { newState: { ...finalState, plays: [record, ...finalState.plays] }, playRecord: record };
    }
  }

  // 4b. DOUBLE JEU DÉFENSIF (DOUBLE PLAY / GDP)
  if (actionType === 'DOUBLE_PLAY') {
    const variant = options?.dpVariant || (state.runners.first ? '2B_1B' : 'FLY_RELAY');
    const nextOuts = state.count.outs + 2;
    let newRunners = { ...state.runners };
    let desc = customDesc;
    let ffbsCode = 'GDP 643';

    if (variant === '3B_1B') {
      // 1. Double Jeu 3B + 1B (ex: 5-3 DP)
      // Coureur forcé en 3B retiré + batteur retiré en 1B
      const r2 = newRunners.second;
      newRunners.second = null; // Retiré en 3B
      newRunners.third = null;
      if (newRunners.first) {
        // Le coureur de 1B avance en 2B
        newRunners.second = newRunners.first;
        newRunners.first = null;
      }
      desc = desc || `Double jeu 3B + 1B (5-3) : ${r2?.name || 'Coureur 2B'} éliminé en 3B, ${batter.name} éliminé en 1B, coureur avance en 2B`;
      ffbsCode = 'GDP 53';
    } else if (variant === '3B_2B') {
      // 2. Double Jeu 3B + 2B (ex: 5-4 DP)
      // Coureur de 2B retiré en 3B + Coureur de 1B forcé en 2B. Batteur sauf en 1B (Choix défensif / Option).
      const r2 = newRunners.second;
      const r1 = newRunners.first;
      newRunners.third = null;
      newRunners.second = null;
      newRunners.first = batter; // Batteur sauf en 1B
      desc = desc || `Double jeu 3B + 2B (5-4) : ${r2?.name || 'Coureur 2B'} éliminé en 3B, ${r1?.name || 'Coureur 1B'} éliminé en 2B, ${batter.name} sauf en 1B (Option)`;
      ffbsCode = 'FC 54';
    } else if (variant === 'FLY_RELAY') {
      // 3. Double Jeu Balle en volée + Relais (Flyout DP)
      if (newRunners.second) {
        const r2 = newRunners.second;
        newRunners.second = null;
        desc = desc || `Double jeu sur balle en volée captée + relais hors-base : ${batter.name} et ${r2.name} éliminés`;
      } else if (newRunners.first) {
        const r1 = newRunners.first;
        newRunners.first = null;
        desc = desc || `Double jeu sur balle en volée captée + relais hors-base : ${batter.name} et ${r1.name} éliminés`;
      } else if (newRunners.third) {
        const r3 = newRunners.third;
        newRunners.third = null;
        desc = desc || `Double jeu sur balle en volée captée + relais hors-base : ${batter.name} et ${r3.name} éliminés`;
      } else {
        desc = desc || `Double jeu sur balle en volée captée + relais hors-base (Flyout DP)`;
      }
      ffbsCode = 'F8-4 DP';
    } else {
      // 4. Double Jeu 2B + 1B (Classique 6-4-3 ou 4-6-3)
      if (newRunners.first) {
        const runnerFirst = newRunners.first;
        newRunners.first = null; // Retiré en 2B
        if (newRunners.second) {
          // Le coureur de 2B avance en 3B
          newRunners.third = newRunners.second;
          newRunners.second = null;
          desc = desc || `Double jeu 2B + 1B (6-4-3) : ${runnerFirst.name} forcé en 2B, ${batter.name} éliminé en 1B, coureur avance en 3B`;
        } else {
          desc = desc || `Double jeu 2B + 1B (6-4-3) : ${runnerFirst.name} forcé en 2B et ${batter.name} éliminé en 1B`;
        }
      } else if (newRunners.second) {
        newRunners.second = null;
        desc = desc || `Double jeu défensif : ${batter.name} et coureur 2B éliminés`;
      } else {
        desc = desc || `Double jeu défensif 6-4-3 (2 retraits)`;
      }
      ffbsCode = 'GDP 643';
    }

    const record: PlayRecord = {
      ...baseRecord,
      id: `play-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      description: desc,
      rbi: 0, // En FFBS/WBSC, aucun RBI accordé sur un double jeu
      runsScored: 0,
      outsRecorded: 2,
      ffbsCode,
    };

    let intermediateState: GameState = {
      ...state,
      runners: newRunners,
      count: { ...state.count, outs: nextOuts },
      ...advanceBatter(state),
    };

    if (nextOuts >= 3) {
      const halfInningState = handleThirdOut(intermediateState);
      const finalState: GameState = {
        ...intermediateState,
        ...halfInningState,
      };
      return { newState: { ...finalState, plays: [record, ...finalState.plays] }, playRecord: record };
    } else {
      const finalState: GameState = {
        ...intermediateState,
        count: { balls: 0, strikes: 0, outs: nextOuts },
      };
      return { newState: { ...finalState, plays: [record, ...finalState.plays] }, playRecord: record };
    }
  }

  // 4c. CHOIX DÉFENSIF (FIELDER'S CHOICE - FC)
  // La défense choisit d'éliminer un coureur sur base plutôt que le frappeur en 1B.
  // 1 seul retrait enregistré sur le coureur, le batteur est sauf en 1B.
  if (actionType === 'FIELDERS_CHOICE') {
    const variant = options?.fcVariant || (state.runners.third ? 'OUT_HOME' : state.runners.second ? 'OUT_3B' : 'OUT_2B');
    const nextOuts = state.count.outs + 1;
    let newRunners: GameState['runners'] = { first: batter, second: null, third: null };
    let runsScored = 0;
    let rbi = 0;
    let desc = customDesc;
    let ffbsCode = 'FC 64';

    if (variant === 'OUT_HOME' && state.runners.third) {
      // 1. Retrait au marbre (ex: 5-2 ou 6-2 FC)
      // Le coureur de 3B est retiré au marbre (0 point)
      const retiredRunner = state.runners.third;
      newRunners.third = state.runners.second || null;
      newRunners.second = state.runners.first || null;
      newRunners.first = batter;
      desc = desc || `Choix défensif (FC) : ${retiredRunner.name} éliminé au marbre, ${batter.name} sauf en 1B`;
      ffbsCode = 'FC 52';
    } else if (variant === 'OUT_3B' && state.runners.second) {
      // 2. Retrait en 3B (ex: 6-5 ou 5-u FC)
      // Le coureur de 2B est retiré en 3B
      const retiredRunner = state.runners.second;
      // Si 3B était occupé et que ce n'est pas le 3e retrait : le coureur de 3B marque
      if (state.runners.third && nextOuts < 3) {
        if (options?.runner3BAction === 'hold') {
          newRunners.third = state.runners.third;
        } else {
          runsScored = 1;
        }
      }
      newRunners.second = state.runners.first || null;
      newRunners.first = batter;
      desc = desc || `Choix défensif (FC) : ${retiredRunner.name} éliminé en 3B, ${batter.name} sauf en 1B` + (runsScored > 0 ? ' (+1 point)' : '');
      ffbsCode = 'FC 65';
    } else {
      // 3. Retrait forcé en 2B (ex: 6-4 ou 4-6 FC)
      // Le coureur de 1B est forcé et retiré en 2B
      const retiredRunner = state.runners.first;
      // Si 3B était occupé et que ce n'est pas le 3e retrait : marque
      if (state.runners.third && nextOuts < 3) {
        if (options?.runner3BAction === 'hold') {
          newRunners.third = state.runners.third;
        } else {
          runsScored = 1;
        }
      }
      // Si 2B était occupé : avance en 3B
      if (state.runners.second) {
        if (!newRunners.third) {
          newRunners.third = state.runners.second;
        }
      }
      newRunners.first = batter;
      desc = desc || `Choix défensif (FC) : ${retiredRunner?.name || 'Coureur 1B'} éliminé en 2B, ${batter.name} sauf en 1B` + (runsScored > 0 ? ' (+1 point)' : '');
      ffbsCode = 'FC 64';
    }

    // Règle officielle : Si le 3e retrait est effectué sur un jeu forcé, aucun point ne peut marquer
    if (nextOuts >= 3) {
      runsScored = 0;
    }

    const record: PlayRecord = {
      ...baseRecord,
      id: `play-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      description: desc,
      rbi,
      runsScored,
      outsRecorded: 1,
      ffbsCode,
    };

    let intermediateState: GameState = {
      ...state,
      runners: newRunners,
      count: { ...state.count, outs: nextOuts },
      ...advanceBatter(state),
    };

    if (runsScored > 0) {
      intermediateState = { ...intermediateState, ...addRuns(intermediateState, runsScored) };
    }

    if (nextOuts >= 3) {
      const halfInningState = handleThirdOut(intermediateState);
      const finalState: GameState = {
        ...intermediateState,
        ...halfInningState,
      };
      return { newState: { ...finalState, plays: [record, ...finalState.plays] }, playRecord: record };
    } else {
      const finalState: GameState = {
        ...intermediateState,
        count: { balls: 0, strikes: 0, outs: nextOuts },
      };
      return { newState: { ...finalState, plays: [record, ...finalState.plays] }, playRecord: record };
    }
  }

  // 5. BUT SUR BALLES (WALK / BB) ou MORT SUR BALLES (HIT BY PITCH)
  if (actionType === 'WALK' || actionType === 'HIT_BY_PITCH') {
    const isHbp = actionType === 'HIT_BY_PITCH';
    const desc = isHbp ? `Atteint par un tir (HBP) pour ${batter.name}` : `But sur balles (BB) pour ${batter.name}`;
    
    // Décalage forcé des coureurs
    let newRunners = { ...state.runners };
    let runsScored = 0;
    let rbi = 0;

    if (newRunners.first) {
      if (newRunners.second) {
        if (newRunners.third) {
          // Bases pleines ! Le coureur de 3B marque
          runsScored = 1;
          rbi = 1;
          newRunners.third = newRunners.second;
          newRunners.second = newRunners.first;
          newRunners.first = batter;
        } else {
          newRunners.third = newRunners.second;
          newRunners.second = newRunners.first;
          newRunners.first = batter;
        }
      } else {
        newRunners.second = newRunners.first;
        newRunners.first = batter;
      }
    } else {
      newRunners.first = batter;
    }

    const record: PlayRecord = {
      ...baseRecord,
      id: `play-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      description: desc + (runsScored > 0 ? ' (Bases pleines, +1 point)' : ''),
      rbi,
      runsScored,
      outsRecorded: 0,
    };

    let updatedState: GameState = {
      ...state,
      runners: newRunners,
      count: { ...state.count, balls: 0, strikes: 0 },
      ...advanceBatter(state),
    };

    if (runsScored > 0) {
      updatedState = { ...updatedState, ...addRuns(updatedState, runsScored) };
    }

    return { newState: { ...updatedState, plays: [record, ...updatedState.plays] }, playRecord: record };
  }

  // 6. FRAPPES (HITS) : SIMPLE (1B), DOUBLE (2B), TRIPLE (3B), COUPE DE CIRCUIT (HR)
  if (actionType === 'SINGLE') {
    let runs = 0;
    let rbi = 0;
    const newRunners: GameState['runners'] = { first: batter, second: null, third: null };

    // RÈGLES DE JEU FORCÉ (OFFICIAL BASEBALL & FFBS RULES) :
    // - Si 1B et 2B sont occupées : le coureur en 3B est FORCÉ au marbre ! Il ne peut jamais 'hold' en 3B.
    // - Si 1B est occupée : le coureur en 2B est FORCÉ en 3B ! Il ne peut jamais 'hold' en 2B.
    const is3BForced = !!(state.runners.first && state.runners.second);
    const is2BForced = !!state.runners.first;

    // 1. Coureur en 3B
    if (state.runners.third) {
      if (!is3BForced && options?.runner3BAction === 'hold') {
        // Non forcé et maintenu en 3B
        newRunners.third = state.runners.third;
      } else {
        // Forcé au marbre OU avance pour marquer
        runs++;
        rbi++;
      }
    }

    // 2. Coureur en 2B
    if (state.runners.second) {
      if (options?.runner2BAction === 'score') {
        runs++;
        rbi++;
      } else if (!is2BForced && options?.runner2BAction === 'hold') {
        newRunners.second = state.runners.second;
      } else {
        // Avance en 3B (sauf si 3B occupée par un hold non forcé)
        if (!newRunners.third) {
          newRunners.third = state.runners.second;
        } else {
          newRunners.second = state.runners.second;
        }
      }
    }

    // 3. Coureur en 1B (forcé d'avancer en 2B, ou 3B sur frappe profonde)
    if (state.runners.first) {
      if (options?.runner1BAction === 'third' && !newRunners.third) {
        newRunners.third = state.runners.first;
      } else {
        newRunners.second = state.runners.first;
      }
    }

    const hitsUpdate = addHits(state);
    let updatedState: GameState = {
      ...state,
      ...hitsUpdate,
      runners: newRunners,
      count: { ...state.count, balls: 0, strikes: 0 },
      ...advanceBatter(state),
    };
    if (runs > 0) {
      updatedState = { ...updatedState, ...addRuns(updatedState, runs) };
    }

    let descDetail = '';
    if (options?.runner3BAction === 'hold' && !is3BForced) {
      descDetail = ' (Coureur maintenu en 3B)';
    } else if (runs > 0) {
      descDetail = runs === 1 ? ' (+1 point)' : ` (+${runs} points)`;
    }

    const hitZone = options?.hitZone || (
      options?.hitDirection === 'left' ? 7 :
      options?.hitDirection === 'right' ? 9 :
      options?.hitDirection === 'center' ? 8 :
      options?.hitDirection === 'infield_3b' ? 5 :
      options?.hitDirection === 'infield_ss' ? 6 :
      options?.hitDirection === 'infield_2b' ? 4 :
      options?.hitDirection === 'infield_1b' ? 3 :
      options?.hitDirection === 'infield_p' ? 1 :
      options?.hitDirection === 'infield_c' ? 2 : undefined
    );

    let directionName = '';
    if (hitZone === 7 || options?.hitDirection === 'left') directionName = ' au champ gauche';
    else if (hitZone === 8 || options?.hitDirection === 'center') directionName = ' au champ centre';
    else if (hitZone === 9 || options?.hitDirection === 'right') directionName = ' au champ droit';
    else if (hitZone === 5 || options?.hitDirection === 'infield_3b') directionName = ' vers la 3e base';
    else if (hitZone === 6 || options?.hitDirection === 'infield_ss') directionName = " vers l'arrêt-court";
    else if (hitZone === 4 || options?.hitDirection === 'infield_2b') directionName = ' vers la 2e base';
    else if (hitZone === 3 || options?.hitDirection === 'infield_1b') directionName = ' vers la 1re base';
    else if (hitZone === 1 || options?.hitDirection === 'infield_p') directionName = ' vers le lanceur';
    else if (hitZone === 2 || options?.hitDirection === 'infield_c') directionName = ' vers le receveur';

    const z = hitZone || 8;
    const ffbsCode = `-${z}`;

    const record: PlayRecord = {
      ...baseRecord,
      id: `play-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      description: customDesc || (`Coup sûr simple (1B)${directionName} de ${batter.name}${descDetail}`),
      rbi,
      runsScored: runs,
      outsRecorded: 0,
      ffbsCode,
      zone: hitZone,
    };
    return { newState: { ...updatedState, plays: [record, ...updatedState.plays] }, playRecord: record };
  }

  if (actionType === 'DOUBLE') {
    const variant = options?.doubleVariant || 'STANDARD';
    let runs = 0;
    let rbi = 0;
    let outsRecorded = 0;
    const isOut = variant === 'OUT_HOME' || variant === 'OUT_3B';
    const nextOuts = state.count.outs + (isOut ? 1 : 0);
    const newRunners: GameState['runners'] = { first: null, second: batter, third: null };
    let desc = customDesc;

    const hitZone = options?.hitZone || (
      options?.hitDirection === 'left' ? 7 :
      options?.hitDirection === 'right' ? 9 :
      options?.hitDirection === 'center' ? 8 :
      options?.hitDirection === 'infield_3b' ? 5 :
      options?.hitDirection === 'infield_ss' ? 6 :
      options?.hitDirection === 'infield_2b' ? 4 :
      options?.hitDirection === 'infield_1b' ? 3 :
      options?.hitDirection === 'infield_p' ? 1 :
      options?.hitDirection === 'infield_c' ? 2 : undefined
    );

    let directionName = '';
    if (hitZone === 7 || options?.hitDirection === 'left') directionName = ' au champ gauche';
    else if (hitZone === 8 || options?.hitDirection === 'center') directionName = ' au champ centre';
    else if (hitZone === 9 || options?.hitDirection === 'right') directionName = ' au champ droit';
    else if (hitZone === 5 || options?.hitDirection === 'infield_3b') directionName = ' vers la 3e base';
    else if (hitZone === 6 || options?.hitDirection === 'infield_ss') directionName = " vers l'arrêt-court";
    else if (hitZone === 4 || options?.hitDirection === 'infield_2b') directionName = ' vers la 2e base';
    else if (hitZone === 3 || options?.hitDirection === 'infield_1b') directionName = ' vers la 1re base';
    else if (hitZone === 1 || options?.hitDirection === 'infield_p') directionName = ' vers le lanceur';
    else if (hitZone === 2 || options?.hitDirection === 'infield_c') directionName = ' vers le receveur';

    const z = hitZone || 8;
    let ffbsCode = `≠${z}`;

    if (variant === 'OUT_HOME') {
      outsRecorded = 1;
      ffbsCode = `≠${z} (${z}-2)`;
      // Un coureur tentait de marquer au marbre mais est retiré (relais 8-2)
      if (state.runners.third && state.runners.second) {
        // Le coureur de 3B marque, mais celui de 2B est retiré au marbre
        runs = 1;
        rbi = 1;
        if (state.runners.first) newRunners.third = state.runners.first;
        desc = desc || `Double (2B)${directionName} de ${batter.name} : ${state.runners.third.name} marque, mais ${state.runners.second.name} est retiré au marbre (${z}-2)`;
      } else if (state.runners.third) {
        if (state.runners.first) newRunners.third = state.runners.first;
        desc = desc || `Double (2B)${directionName} de ${batter.name} : ${state.runners.third.name} retiré au marbre sur relais (${z}-2)`;
      } else if (state.runners.second) {
        if (state.runners.first) newRunners.third = state.runners.first;
        desc = desc || `Double (2B)${directionName} de ${batter.name} : ${state.runners.second.name} retiré au marbre sur relais (${z}-2)`;
      } else if (state.runners.first) {
        desc = desc || `Double (2B)${directionName} de ${batter.name} : ${state.runners.first.name} retiré au marbre sur relais (${z}-2)`;
      } else {
        desc = desc || `Double (2B)${directionName} de ${batter.name} : Coureur retiré au marbre sur relais (${z}-2)`;
      }
    } else if (variant === 'OUT_3B') {
      outsRecorded = 1;
      ffbsCode = `≠${z} (${z}-5)`;
      // Coureur de 1B éliminé en 3B sur relais (9-5)
      // Les coureurs de 3B et 2B marquent
      if (state.runners.third) { runs++; rbi++; }
      if (state.runners.second) { runs++; rbi++; }
      const r1 = state.runners.first;
      desc = desc || `Double (2B)${directionName} de ${batter.name} : ${r1 ? r1.name : 'Coureur'} éliminé en 3B (${z}-5)` + (runs > 0 ? ` (+${runs} pt)` : '');
    } else if (variant === 'R1_SCORES') {
      if (state.runners.third) { runs++; rbi++; }
      if (state.runners.second) { runs++; rbi++; }
      if (state.runners.first) { runs++; rbi++; }
      desc = desc || `Double (2B) profond${directionName} de ${batter.name} - Tous les coureurs marquent (+${runs} pt)`;
      ffbsCode = `≠${z}`;
    } else {
      // STANDARD
      if (state.runners.third) { runs++; rbi++; }
      if (state.runners.second) { runs++; rbi++; }
      if (state.runners.first) { newRunners.third = state.runners.first; }
      desc = desc || `Coup sûr double (2B)${directionName} de ${batter.name}` + (runs > 0 ? ` (+${runs} point(s))` : '');
      ffbsCode = `≠${z}`;
    }

    const hitsUpdate = addHits(state);
    let intermediateState: GameState = {
      ...state,
      ...hitsUpdate,
      runners: newRunners,
      count: { ...state.count, balls: 0, strikes: 0, outs: nextOuts },
      ...advanceBatter(state),
    };
    if (runs > 0) {
      intermediateState = { ...intermediateState, ...addRuns(intermediateState, runs) };
    }

    const record: PlayRecord = {
      ...baseRecord,
      id: `play-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      description: desc,
      rbi,
      runsScored: runs,
      outsRecorded,
      ffbsCode,
      zone: hitZone,
    };

    if (nextOuts >= 3) {
      const halfInningState = handleThirdOut(intermediateState);
      const finalState: GameState = {
        ...intermediateState,
        ...halfInningState,
      };
      return { newState: { ...finalState, plays: [record, ...finalState.plays] }, playRecord: record };
    } else {
      return { newState: { ...intermediateState, plays: [record, ...intermediateState.plays] }, playRecord: record };
    }
  }

  if (actionType === 'TRIPLE') {
    let runs = 0;
    let rbi = 0;
    if (state.runners.third) { runs++; rbi++; }
    if (state.runners.second) { runs++; rbi++; }
    if (state.runners.first) { runs++; rbi++; }

    const hitZone = options?.hitZone || (
      options?.hitDirection === 'left' ? 7 :
      options?.hitDirection === 'right' ? 9 :
      options?.hitDirection === 'center' ? 8 :
      options?.hitDirection === 'infield_3b' ? 5 :
      options?.hitDirection === 'infield_ss' ? 6 :
      options?.hitDirection === 'infield_2b' ? 4 :
      options?.hitDirection === 'infield_1b' ? 3 :
      options?.hitDirection === 'infield_p' ? 1 :
      options?.hitDirection === 'infield_c' ? 2 : undefined
    );

    let directionName = '';
    if (hitZone === 7 || options?.hitDirection === 'left') directionName = ' au champ gauche';
    else if (hitZone === 8 || options?.hitDirection === 'center') directionName = ' au champ centre';
    else if (hitZone === 9 || options?.hitDirection === 'right') directionName = ' au champ droit';

    const z = hitZone || 8;
    const ffbsCode = `≡${z}`;

    const hitsUpdate = addHits(state);
    let updatedState: GameState = {
      ...state,
      ...hitsUpdate,
      runners: { first: null, second: null, third: batter },
      count: { ...state.count, balls: 0, strikes: 0 },
      ...advanceBatter(state),
    };
    if (runs > 0) {
      updatedState = { ...updatedState, ...addRuns(updatedState, runs) };
    }

    const record: PlayRecord = {
      ...baseRecord,
      id: `play-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      description: customDesc || (`Coup sûr triple (3B)${directionName} de ${batter.name}` + (runs > 0 ? ` (+${runs} point(s))` : '')),
      rbi,
      runsScored: runs,
      outsRecorded: 0,
      ffbsCode,
      zone: hitZone,
    };
    return { newState: { ...updatedState, plays: [record, ...updatedState.plays] }, playRecord: record };
  }

  if (actionType === 'HOMERUN') {
    let runs = 1; // Le frappeur marque toujours
    let rbi = 1;
    if (state.runners.third) { runs++; rbi++; }
    if (state.runners.second) { runs++; rbi++; }
    if (state.runners.first) { runs++; rbi++; }

    const hitZone = options?.hitZone || (
      options?.hitDirection === 'left' ? 7 :
      options?.hitDirection === 'right' ? 9 :
      options?.hitDirection === 'center' ? 8 : undefined
    );

    let directionName = '';
    if (hitZone === 7 || options?.hitDirection === 'left') directionName = ' au champ gauche';
    else if (hitZone === 8 || options?.hitDirection === 'center') directionName = ' au champ centre';
    else if (hitZone === 9 || options?.hitDirection === 'right') directionName = ' au champ droit';

    const z = hitZone || 8;
    const ffbsCode = `HR${z}`;

    const hrTypes = runs === 1 ? 'Solo Home Run' : runs === 2 ? 'Home Run de 2 points' : runs === 3 ? 'Home Run de 3 points' : 'GRAND SLAM (Grand Chelem) !';

    const hitsUpdate = addHits(state);
    let updatedState: GameState = {
      ...state,
      ...hitsUpdate,
      runners: { first: null, second: null, third: null },
      count: { ...state.count, balls: 0, strikes: 0 },
      ...advanceBatter(state),
    };
    updatedState = { ...updatedState, ...addRuns(updatedState, runs) };

    const record: PlayRecord = {
      ...baseRecord,
      id: `play-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      description: customDesc || (`💣 ${hrTypes}${directionName} de ${batter.name} ! (+${runs} point(s))`),
      rbi,
      runsScored: runs,
      outsRecorded: 0,
      ffbsCode,
      zone: hitZone,
    };
    return { newState: { ...updatedState, plays: [record, ...updatedState.plays] }, playRecord: record };
  }

  // 7. ERREUR DÉFENSIVE (ERROR)
  if (actionType === 'ERROR') {
    const errorProp = state.isTop ? 'homeErrors' : 'awayErrors';
    const inningScores = state.inningScores.map(inn => {
      if (inn.inningNumber === state.currentInning) {
        return state.isTop
          ? { ...inn, homeErrors: inn.homeErrors + 1 }
          : { ...inn, awayErrors: inn.awayErrors + 1 };
      }
      return inn;
    });

    // Avancement forcé
    let newRunners = { ...state.runners };
    if (newRunners.first) {
      newRunners.second = newRunners.first;
    }
    newRunners.first = batter;

    const record: PlayRecord = {
      ...baseRecord,
      id: `play-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      description: `Erreur défensive (${batter.name} sur base)`,
      rbi: 0,
      runsScored: 0,
      outsRecorded: 0,
    };

    const updatedState: GameState = {
      ...state,
      [errorProp]: state[errorProp] + 1,
      inningScores,
      runners: newRunners,
      count: { ...state.count, balls: 0, strikes: 0 },
      ...advanceBatter(state),
    };

    return { newState: { ...updatedState, plays: [record, ...updatedState.plays] }, playRecord: record };
  }

  // Default fallback
  const record: PlayRecord = {
    ...baseRecord,
    id: `play-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString(),
    description: customDesc || actionType,
    rbi: 0,
    runsScored: 0,
    outsRecorded: 0,
  };
  return { newState: { ...state, plays: [record, ...state.plays] }, playRecord: record };
};
