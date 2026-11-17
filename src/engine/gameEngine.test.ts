import { createInitialGameState } from './sampleData';
import { processAction } from './gameEngine';
import { calculateBoxScore, formatInningsPitched } from './statsEngine';

async function runTests() {
  console.log('🧪 Starting Baseball Scoring Engine Tests...\n');
  let failures = 0;

  const assert = (condition: boolean, testName: string) => {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failures++;
    }
  };

  // Test 1: Count Ball
  let state = createInitialGameState();
  assert(state.count.balls === 0 && state.count.strikes === 0 && state.count.outs === 0, 'Initial state count is 0-0-0');
  
  let res = processAction(state, 'BALL');
  state = res.newState;
  assert(state.count.balls === 1, 'First ball brings count to 1-0');

  // Test 2: Strikes and Foul rules
  res = processAction(state, 'CALLED_STRIKE');
  state = res.newState;
  assert(state.count.strikes === 1 && state.count.balls === 1, 'Strike brings count to 1-1');

  res = processAction(state, 'FOUL');
  state = res.newState;
  assert(state.count.strikes === 2, 'Foul with 1 strike brings strikes to 2');

  res = processAction(state, 'FOUL');
  state = res.newState;
  assert(state.count.strikes === 2, 'Foul with 2 strikes keeps strikes at 2');

  // Test 3: Strikeout (K)
  res = processAction(state, 'SWINGING_STRIKE');
  state = res.newState;
  assert(state.count.outs === 1 && state.count.strikes === 0 && state.count.balls === 0, '3rd strike records 1 out and resets count');

  // Test 4: Walk (BB) on 4 balls
  state = createInitialGameState();
  res = processAction(state, 'BALL');
  res = processAction(res.newState, 'BALL');
  res = processAction(res.newState, 'BALL');
  res = processAction(res.newState, 'BALL'); // 4th ball
  state = res.newState;
  assert(state.runners.first !== null, '4th ball places batter on 1B');
  assert(state.count.balls === 0 && state.count.strikes === 0, 'Walk resets count');

  // Test 5: Single advances runner from 1B to 2B
  const runner1Name = state.runners.first?.name;
  res = processAction(state, 'SINGLE');
  state = res.newState;
  assert(state.runners.second?.name === runner1Name, 'Runner from 1B advanced to 2B on Single');
  assert(state.runners.first !== null && state.runners.first.name !== runner1Name, 'New batter on 1B');

  // Test 6: Home Run scores all runners + batter
  res = processAction(state, 'HOMERUN');
  state = res.newState;
  assert(state.awayScore === 3, 'Home run with 2 runners on base scores 3 runs');
  assert(state.runners.first === null && state.runners.second === null && state.runners.third === null, 'All runners cleared on HR');

  // Test 7: 3 outs switches half-inning
  state = createInitialGameState();
  res = processAction(state, 'STRIKEOUT');
  res = processAction(res.newState, 'FLYOUT');
  res = processAction(res.newState, 'GROUNDOUT'); // 3rd out
  state = res.newState;
  assert(!state.isTop && state.currentInning === 1, '3 outs in top of 1st switches to bottom of 1st');
  assert(state.count.outs === 0, 'Outs reset to 0 for next half-inning');

  // Test 8: Stats calculation
  const boxScore = calculateBoxScore(state);
  assert(boxScore.awayBatters.length === 9, 'Away team has 9 batters in box score');
  assert(formatInningsPitched(3) === '1.0', '3 outs pitched formats as 1.0 IP');
  assert(formatInningsPitched(4) === '1.1', '4 outs pitched formats as 1.1 IP');

  // Test 9: Feuille de scorage FFBS & Formule de Contrôle (SF1 page 40)
  const { generateFFBSScoreSheet } = await import('./statsEngine');
  const ffbsSheet = generateFFBSScoreSheet(state, 'away');
  assert(ffbsSheet.batters.length === 9, 'Feuille FFBS : 9 frappeurs initialisés');
  assert(ffbsSheet.pitchers.length >= 1, 'Feuille FFBS : Lanceur initialisé');
  assert(ffbsSheet.controlFormula.isBalanced, 'Feuille FFBS : Formule de contrôle équilibrée (Ligne 1 = Ligne 2)');

  // Test 10a: Double Jeu 2B + 1B (6-4-3)
  let dpState = createInitialGameState();
  dpState = processAction(dpState, 'WALK').newState; // Coureur en 1B
  dpState = processAction(dpState, 'SINGLE').newState; // Coureurs en 1B et 2B
  assert(dpState.runners.first !== null && dpState.runners.second !== null, 'Deux coureurs sur base (1B et 2B)');
  
  dpState = processAction(dpState, 'DOUBLE_PLAY', undefined, { dpVariant: '2B_1B' }).newState;
  assert(dpState.count.outs === 2, 'Double jeu 2B+1B enregistre 2 retraits (outs = 2)');
  assert(dpState.runners.first === null, 'Coureur de 1B retiré en 2B');
  assert(dpState.runners.second === null, 'Deuxième base libérée');
  assert(dpState.runners.third !== null, 'Coureur de 2B a avancé en 3B');
  assert(generateFFBSScoreSheet(dpState, 'away').controlFormula.isBalanced, 'Contrôle FFBS équilibré après DP 2B+1B');

  // Test 10b: Double Jeu 3B + 1B (5-3)
  let dp31State = createInitialGameState();
  dp31State = processAction(dp31State, 'WALK').newState;
  dp31State = processAction(dp31State, 'SINGLE').newState;
  dp31State = processAction(dp31State, 'DOUBLE_PLAY', undefined, { dpVariant: '3B_1B' }).newState;
  assert(dp31State.count.outs === 2, 'Double jeu 3B+1B enregistre 2 retraits (outs = 2)');
  assert(dp31State.runners.first === null, 'Première base vide (batteur out)');
  assert(dp31State.runners.second !== null, 'Coureur de 1B a avancé en 2B');
  assert(dp31State.runners.third === null, 'Coureur de 2B forcé en 3B');
  assert(generateFFBSScoreSheet(dp31State, 'away').controlFormula.isBalanced, 'Contrôle FFBS équilibré après DP 3B+1B');

  // Test 10c: Double Jeu 3B + 2B (5-4)
  let dp32State = createInitialGameState();
  dp32State = processAction(dp32State, 'WALK').newState;
  dp32State = processAction(dp32State, 'SINGLE').newState;
  dp32State = processAction(dp32State, 'DOUBLE_PLAY', undefined, { dpVariant: '3B_2B' }).newState;
  assert(dp32State.count.outs === 2, 'Double jeu 3B+2B enregistre 2 retraits (outs = 2)');
  assert(dp32State.runners.second === null, 'Coureur forcé en 2B retiré');
  assert(dp32State.runners.third === null, 'Coureur forcé en 3B retiré');
  assert(dp32State.runners.first !== null, 'Batteur sauf en 1B (Option FC)');
  // Test 11: Coup sûr simple (1B) avec coureur en 3B uniquement (Non forcé)
  // Cas A : Le coureur en 3B reste en 3B (hold)
  let singleHoldState = createInitialGameState();
  singleHoldState = processAction(singleHoldState, 'TRIPLE').newState; // Coureur en 3B uniquement
  assert(singleHoldState.runners.third !== null && singleHoldState.runners.first === null && singleHoldState.runners.second === null, 'Coureur placé en 3B uniquement');
  
  singleHoldState = processAction(singleHoldState, 'SINGLE', undefined, { runner3BAction: 'hold' }).newState;
  assert(singleHoldState.awayScore === 0, 'Score reste à 0 car le coureur est resté en 3B');
  assert(singleHoldState.runners.third !== null, 'Coureur toujours présent en 3B');
  assert(singleHoldState.runners.first !== null, 'Nouveau frappeur installé en 1B');
  assert(singleHoldState.runners.second === null, 'Deuxième base vide');
  assert(generateFFBSScoreSheet(singleHoldState, 'away').controlFormula.isBalanced, 'Contrôle FFBS conforme après 1B avec coureur 3B maintenu');

  // Cas B : Le coureur en 3B marque le point (score)
  let singleScoreState = createInitialGameState();
  singleScoreState = processAction(singleScoreState, 'TRIPLE').newState;
  singleScoreState = processAction(singleScoreState, 'SINGLE', undefined, { runner3BAction: 'score' }).newState;
  assert(singleScoreState.awayScore === 1, 'Score passe à 1 car le coureur de 3B a marqué');
  // Test 12: Coup sûr simple (1B) avec coureur en 2B uniquement (Non forcé)
  // Cas A : Le coureur en 2B reste en 2B (hold)
  let single2BHoldState = createInitialGameState();
  single2BHoldState = processAction(single2BHoldState, 'DOUBLE').newState; // Coureur en 2B uniquement
  assert(single2BHoldState.runners.second !== null && single2BHoldState.runners.first === null && single2BHoldState.runners.third === null, 'Coureur placé en 2B uniquement');

  single2BHoldState = processAction(single2BHoldState, 'SINGLE', undefined, { runner2BAction: 'hold' }).newState;
  assert(single2BHoldState.awayScore === 0, 'Score reste à 0 car le coureur est resté en 2B');
  assert(single2BHoldState.runners.second !== null, 'Coureur toujours présent en 2B');
  assert(single2BHoldState.runners.first !== null, 'Nouveau frappeur en 1B');
  assert(single2BHoldState.runners.third === null, 'Troisième base vide');
  // Test 13: Bases pleines (1B, 2B, 3B) + 1B simple (Jeu forcé obligatoire)
  let basesLoadedState = createInitialGameState();
  basesLoadedState = processAction(basesLoadedState, 'WALK').newState; // 1B
  basesLoadedState = processAction(basesLoadedState, 'WALK').newState; // 1B, 2B
  basesLoadedState = processAction(basesLoadedState, 'WALK').newState; // 1B, 2B, 3B (Bases pleines)
  assert(basesLoadedState.runners.first !== null && basesLoadedState.runners.second !== null && basesLoadedState.runners.third !== null, 'Bases pleines initialisées');

  // Cas 13A : Coup sûr simple standard sur bases pleines (1 point forcé)
  let blSingleState = processAction(basesLoadedState, 'SINGLE', undefined, { runner3BAction: 'score', runner2BAction: 'third' }).newState;
  assert(blSingleState.awayScore === 1, 'Bases pleines + 1B : Le score passe à 1 (3B forcé au marbre)');
  assert(blSingleState.runners.first !== null, 'Batteur en 1B');
  assert(blSingleState.runners.second !== null, 'Ancien 1B forcé en 2B');
  assert(blSingleState.runners.third !== null, 'Ancien 2B forcé en 3B');
  assert(generateFFBSScoreSheet(blSingleState, 'away').controlFormula.isBalanced, 'Contrôle FFBS conforme après 1B sur bases pleines');

  // Cas 13B : Protection de règle - Si quelqu'un envoie 'hold' sur bases pleines, le coureur est forcé de marquer
  let blForcedProtection = processAction(basesLoadedState, 'SINGLE', undefined, { runner3BAction: 'hold' }).newState;
  assert(blForcedProtection.awayScore === 1, 'Règle FFBS : Coureur 3B forcé au marbre même si hold spécifié sur bases pleines');

  // Cas 13C : Frappe profonde sur bases pleines (2 points marquent)
  let blDeepSingle = processAction(basesLoadedState, 'SINGLE', undefined, { runner3BAction: 'score', runner2BAction: 'score', runner1BAction: 'third' }).newState;
  assert(blDeepSingle.awayScore === 2, 'Bases pleines + 1B profond : 2 points marqués');
  assert(blDeepSingle.runners.first !== null, 'Batteur en 1B');
  assert(blDeepSingle.runners.third !== null, 'Ancien 1B avance en 3B');
  assert(generateFFBSScoreSheet(blDeepSingle, 'away').controlFormula.isBalanced, 'Contrôle FFBS conforme après 1B profond');

  // Test 14: Coureurs en 1B et 2B (3B vide) + 1B simple
  let r12State = createInitialGameState();
  r12State = processAction(r12State, 'WALK').newState; // 1B
  r12State = processAction(r12State, 'WALK').newState; // 1B, 2B
  
  // Cas 14A : Avancement forcé standard (2B va en 3B, 1B va en 2B)
  let r12Single = processAction(r12State, 'SINGLE', undefined, { runner2BAction: 'third' }).newState;
  assert(r12Single.awayScore === 0, 'Score à 0 sur 1B avec 1B+2B (avancement forcé)');
  assert(r12Single.runners.third !== null, '2B forcé en 3B');
  assert(r12Single.runners.second !== null, '1B forcé en 2B');
  assert(r12Single.runners.first !== null, 'Batteur en 1B');
  assert(generateFFBSScoreSheet(r12Single, 'away').controlFormula.isBalanced, 'Contrôle FFBS conforme après 1B avec 1B+2B');

  // Cas 14B : Protection de règle - Si 'hold' spécifié pour 2B alors que 1B est occupée, 2B est forcé en 3B
  let r12HoldProtection = processAction(r12State, 'SINGLE', undefined, { runner2BAction: 'hold' }).newState;
  assert(r12HoldProtection.runners.third !== null, 'Règle FFBS : 2B ne peut pas rester en 2B quand 1B est occupée (forcé en 3B)');

  // Test 15: Coureurs en 2B et 3B (1B vide) + 1B simple
  let r23State = createInitialGameState();
  r23State = processAction(r23State, 'DOUBLE').newState; // 2B
  r23State = processAction(r23State, 'SINGLE', undefined, { runner2BAction: 'third' }).newState; // 3B et 1B
  // Placer 2B et 3B avec 1B vide
  r23State.runners.first = null;
  r23State.runners.second = r23State.runners.third;
  r23State.runners.third = { id: 'p3', name: 'Third Runner', jerseyNumber: 33 };
  assert(r23State.runners.first === null && r23State.runners.second !== null && r23State.runners.third !== null, '2B et 3B occupées, 1B vide');

  // Coureurs bloqués valide car 1B vide
  let r23Blocked = processAction(r23State, 'SINGLE', undefined, { runner3BAction: 'hold', runner2BAction: 'hold' }).newState;
  assert(r23Blocked.awayScore === 0, 'Score à 0 car coureurs bloqués sur 2B+3B avec 1B libre');
  assert(r23Blocked.runners.third !== null && r23Blocked.runners.second !== null && r23Blocked.runners.first !== null, 'Bases désormais pleines');

  // Test 16: Choix Défensif (FC) au Marbre sur Bases Pleines
  let fcBasesLoaded = createInitialGameState();
  fcBasesLoaded = processAction(fcBasesLoaded, 'WALK').newState; // 1B
  fcBasesLoaded = processAction(fcBasesLoaded, 'WALK').newState; // 1B, 2B
  fcBasesLoaded = processAction(fcBasesLoaded, 'WALK').newState; // Bases pleines
  const runner3BId = fcBasesLoaded.runners.third?.id;

  let fcHomeState = processAction(fcBasesLoaded, 'FIELDERS_CHOICE', undefined, { fcVariant: 'OUT_HOME' }).newState;
  assert(fcHomeState.awayScore === 0, 'FC Marbre : Aucun point marqué (bloqué au marbre)');
  assert(fcHomeState.count.outs === 1, 'FC Marbre : 1 retrait enregistré');
  assert(fcHomeState.runners.first !== null, 'Batteur sauf en 1B sur FC');
  assert(fcHomeState.runners.second !== null, 'Ancien 1B avancé en 2B');
  assert(fcHomeState.runners.third !== null, 'Ancien 2B avancé en 3B');
  assert(fcHomeState.runners.third?.id !== runner3BId, 'Ancien 3B retiré au marbre');
  assert(generateFFBSScoreSheet(fcHomeState, 'away').controlFormula.isBalanced, 'Contrôle FFBS conforme après FC au marbre');

  // Test 17: Choix Défensif (FC) en 3B avec coureurs en 1B et 2B
  let fc12State = createInitialGameState();
  fc12State = processAction(fc12State, 'WALK').newState; // 1B
  fc12State = processAction(fc12State, 'WALK').newState; // 1B, 2B
  const runner2BId = fc12State.runners.second?.id;

  let fc3BState = processAction(fc12State, 'FIELDERS_CHOICE', undefined, { fcVariant: 'OUT_3B' }).newState;
  assert(fc3BState.awayScore === 0, 'FC 3B : Aucun point');
  assert(fc3BState.count.outs === 1, 'FC 3B : 1 retrait');
  assert(fc3BState.runners.first !== null, 'Batteur sauf en 1B');
  assert(fc3BState.runners.second !== null, 'Ancien 1B en 2B');
  assert(fc3BState.runners.third === null, '3B vide car coureur 2B éliminé');
  assert(generateFFBSScoreSheet(fc3BState, 'away').controlFormula.isBalanced, 'Contrôle FFBS conforme après FC en 3B');

  // Test 18: Choix Défensif (FC) en 2B avec coureur en 1B
  let fc1BState = createInitialGameState();
  fc1BState = processAction(fc1BState, 'WALK').newState; // 1B

  let fc2BState = processAction(fc1BState, 'FIELDERS_CHOICE', undefined, { fcVariant: 'OUT_2B' }).newState;
  assert(fc2BState.count.outs === 1, 'FC 2B : 1 retrait');
  assert(fc2BState.runners.first !== null, 'Batteur sauf en 1B');
  assert(fc2BState.runners.second === null, '2B vide car coureur 1B éliminé');
  assert(generateFFBSScoreSheet(fc2BState, 'away').controlFormula.isBalanced, 'Contrôle FFBS conforme après FC en 2B');

  // Test 19: Choix Défensif (FC) qui constitue le 3e retrait (changement de manche)
  let fcThirdOutState = createInitialGameState();
  fcThirdOutState = processAction(fcThirdOutState, 'STRIKEOUT').newState; // 1 out
  fcThirdOutState = processAction(fcThirdOutState, 'STRIKEOUT').newState; // 2 outs
  fcThirdOutState = processAction(fcThirdOutState, 'WALK').newState; // Coureur en 1B
  let endHalfState = processAction(fcThirdOutState, 'FIELDERS_CHOICE', undefined, { fcVariant: 'OUT_2B' }).newState;
  assert(!endHalfState.isTop, '3e retrait sur FC -> Passage en fin de manche (isTop = false)');
  assert(endHalfState.count.outs === 0, 'Outs réinitialisés à 0 pour la manche suivante');
  assert(endHalfState.runners.first === null && endHalfState.runners.second === null && endHalfState.runners.third === null, 'Bases vidées au 3e retrait');

  // Test 20: Coup sûr Double (2B) standard avec coureurs en 1B et 2B
  let dblInitState = createInitialGameState();
  dblInitState = processAction(dblInitState, 'WALK').newState; // 1B
  dblInitState = processAction(dblInitState, 'WALK').newState; // 1B et 2B
  let dblState = processAction(dblInitState, 'DOUBLE', undefined, { doubleVariant: 'STANDARD' }).newState;
  assert(dblState.awayScore === 1, 'Double standard avec 1B+2B : 1 point marqué (2B rentre)');
  assert(dblState.count.outs === 0, 'Double standard : 0 retrait');
  assert(dblState.runners.second !== null, 'Batteur installé en 2B');
  assert(dblState.runners.third !== null, 'Ancien coureur de 1B avancé en 3B');
  assert(generateFFBSScoreSheet(dblState, 'away').controlFormula.isBalanced, 'Contrôle FFBS conforme après Double standard');

  // Test 21: Double (2B) avec coureur éliminé au marbre (OUT_HOME, relais 8-2)
  let dblOutHomeInit = createInitialGameState();
  dblOutHomeInit = processAction(dblOutHomeInit, 'WALK').newState; // 1B
  dblOutHomeInit = processAction(dblOutHomeInit, 'WALK').newState; // 1B et 2B
  let dblOutHomeState = processAction(dblOutHomeInit, 'DOUBLE', undefined, { doubleVariant: 'OUT_HOME' }).newState;
  assert(dblOutHomeState.count.outs === 1, 'Double OUT_HOME : 1 retrait enregistré');
  assert(dblOutHomeState.awayScore === 0, 'Double OUT_HOME (seul 2B tentait le marbre) : 0 point marqué');
  assert(dblOutHomeState.runners.second !== null, 'Batteur sauf en 2B (crédité d un 2B)');
  assert(dblOutHomeState.runners.third !== null, 'Coureur de 1B avancé en 3B');
  assert(generateFFBSScoreSheet(dblOutHomeState, 'away').controlFormula.isBalanced, 'Contrôle FFBS conforme après Double avec coureur retiré au marbre');

  // Test 22: Double (2B) avec coureur de 1B éliminé en 3B (OUT_3B, relais 9-5)
  let dblOut3BInit = createInitialGameState();
  dblOut3BInit = processAction(dblOut3BInit, 'WALK').newState; // 1B
  dblOut3BInit = processAction(dblOut3BInit, 'WALK').newState; // 1B et 2B
  let dblOut3BState = processAction(dblOut3BInit, 'DOUBLE', undefined, { doubleVariant: 'OUT_3B' }).newState;
  assert(dblOut3BState.count.outs === 1, 'Double OUT_3B : 1 retrait');
  assert(dblOut3BState.awayScore === 1, 'Double OUT_3B : Coureur de 2B a marqué le point (+1)');
  assert(dblOut3BState.runners.second !== null, 'Batteur sauf en 2B');
  assert(dblOut3BState.runners.third === null, '3B vide car coureur de 1B a été retiré en 3B');
  assert(generateFFBSScoreSheet(dblOut3BState, 'away').controlFormula.isBalanced, 'Contrôle FFBS conforme après Double avec coureur retiré en 3B');

  // Test 23: Double (2B) avec retrait au marbre constituant le 3e retrait
  let dblThirdOutInit = createInitialGameState();
  dblThirdOutInit = processAction(dblThirdOutInit, 'STRIKEOUT').newState; // 1 out
  dblThirdOutInit = processAction(dblThirdOutInit, 'STRIKEOUT').newState; // 2 outs
  dblThirdOutInit = processAction(dblThirdOutInit, 'WALK').newState; // Coureur en 1B
  let dblEndHalfState = processAction(dblThirdOutInit, 'DOUBLE', undefined, { doubleVariant: 'OUT_HOME' }).newState;
  assert(!dblEndHalfState.isTop, '3e retrait sur relais marbre sur Double -> Fin de demi-manche (isTop = false)');
  assert(dblEndHalfState.count.outs === 0, 'Outs réinitialisés à 0 pour la manche suivante');
  assert(dblEndHalfState.runners.second === null, 'Bases vidées pour le changement de côté');

  // Test 24: GROUNDOUT avec runnerResolution (Roulant, batteur out 1B, 2B avance en 3B, 3B marque)
  let goResInit = createInitialGameState();
  goResInit = processAction(goResInit, 'WALK').newState; // 1B
  goResInit = processAction(goResInit, 'DOUBLE').newState; // 2B et 3B
  let goResState = processAction(goResInit, 'GROUNDOUT', undefined, {
    runnerResolution: {
      batterDestination: 'out_first',
      runner3BDestination: 'score',
      runner2BDestination: 'third',
    },
  }).newState;
  assert(goResState.count.outs === 1, 'Roulant avec résolution : 1 retrait (en 1B)');
  assert(goResState.awayScore === 1, 'Roulant avec résolution : 3B marque le point (+1, RBI)');
  assert(goResState.runners.third !== null, 'Roulant avec résolution : 2B avance en 3B');
  assert(goResState.runners.first === null && goResState.runners.second === null, '1B et 2B vides');
  assert(generateFFBSScoreSheet(goResState, 'away').controlFormula.isBalanced, 'Contrôle FFBS conforme après Roulant avec résolution');

  // Test 25: GROUNDOUT avec choix défensif au marbre (3B retiré au marbre, batteur sauf en 1B)
  let goFcHomeState = processAction(goResInit, 'GROUNDOUT', undefined, {
    runnerResolution: {
      batterDestination: 'first',
      runner3BDestination: 'out_home',
      runner2BDestination: 'third',
    },
  }).newState;
  assert(goFcHomeState.count.outs === 1, 'Choix défensif marbre : 1 retrait');
  assert(goFcHomeState.awayScore === 0, 'Choix défensif marbre : 0 point marqué');
  assert(goFcHomeState.runners.first !== null, 'Batteur sauf en 1B');
  assert(goFcHomeState.runners.third !== null, '2B avance en 3B');
  assert(generateFFBSScoreSheet(goFcHomeState, 'away').controlFormula.isBalanced, 'Contrôle FFBS conforme après FC marbre');

  // Test 26: SINGLE avec coureur retiré en 3B sur relais (9-5)
  let sglTagState = processAction(goResInit, 'SINGLE', undefined, {
    runnerResolution: {
      batterDestination: 'first',
      runner3BDestination: 'score',
      runner2BDestination: 'out_third',
    },
  }).newState;
  assert(sglTagState.count.outs === 1, 'Single avec retrait en 3B : 1 retrait');
  assert(sglTagState.awayScore === 1, 'Single avec retrait en 3B : 3B a marqué');
  assert(sglTagState.runners.first !== null, 'Batteur sauf en 1B');
  assert(sglTagState.runners.third === null, '3B vide car coureur retiré en 3B');
  assert(generateFFBSScoreSheet(sglTagState, 'away').controlFormula.isBalanced, 'Contrôle FFBS conforme après Single avec retrait en 3B');

  // Test 27: FLYOUT avec sacrifice (3B marque après prise de volée)
  let foSacState = processAction(goResInit, 'FLYOUT', undefined, {
    runnerResolution: {
      batterDestination: 'out_air',
      runner3BDestination: 'score',
      runner2BDestination: 'hold',
    },
  }).newState;
  assert(foSacState.count.outs === 1, 'Flyout sacrifice : 1 retrait de volée');
  assert(foSacState.awayScore === 1, 'Flyout sacrifice : 3B marque (+1 point)');
  assert(foSacState.runners.second !== null, '2B est resté en 2B');
  assert(generateFFBSScoreSheet(foSacState, 'away').controlFormula.isBalanced, 'Contrôle FFBS conforme après Flyout sacrifice');

  // Test 28: ERROR avec avancement de 2 bases et point
  let errState = processAction(goResInit, 'ERROR', undefined, {
    runnerResolution: {
      batterDestination: 'second',
      runner3BDestination: 'score',
      runner2BDestination: 'score',
    },
  }).newState;
  assert(errState.count.outs === 0, 'Erreur : 0 retrait');
  assert(errState.awayScore === 2, 'Erreur : 2 points marqués');
  assert(errState.runners.second !== null, 'Batteur en 2B sur erreur');
  assert(errState.homeErrors === 1, '1 erreur enregistrée pour la défense');
  assert(generateFFBSScoreSheet(errState, 'away').controlFormula.isBalanced, 'Contrôle FFBS conforme après Erreur avec points');

  // Test 29: TRIPLE avec runnerResolution (Coureurs marquent au marbre et batteur en 3B)
  let tripleInit = createInitialGameState();
  tripleInit = processAction(tripleInit, 'WALK').newState; // 1B
  tripleInit = processAction(tripleInit, 'DOUBLE').newState; // 2B et 3B
  const { getCurrentBatterSlot } = await import('./gameEngine');
  const batterName = getCurrentBatterSlot(tripleInit).player.name;
  let tripleState = processAction(tripleInit, 'TRIPLE', undefined, {
    runnerResolution: {
      batterDestination: 'third',
      runner3BDestination: 'score',
      runner2BDestination: 'score',
    },
  }).newState;
  assert(tripleState.count.outs === 0, 'Triple : 0 retrait');
  assert(tripleState.awayScore === 2, 'Triple : 2 points marqués au marbre');
  assert(tripleState.runners.third !== null, 'Batteur placé en 3B');
  assert(tripleState.runners.third?.name === batterName, 'Le coureur en 3B est bien le frappeur du triple');
  assert(tripleState.runners.first === null && tripleState.runners.second === null, '1B et 2B vides');
  // Test 30: Simple au champ gauche (hitZone: 7) bases vides
  let sglDirInit = createInitialGameState();
  const sglRes = processAction(sglDirInit, 'SINGLE', undefined, { hitZone: 7 });
  assert(sglRes.playRecord.ffbsCode === '-7', 'Single zone 7 : code FFBS est -7');
  assert(sglRes.playRecord.zone === 7, 'Single zone 7 : zone enregistrée est 7');
  assert(sglRes.playRecord.description.includes('au champ gauche'), 'Single zone 7 : description mentionne le champ gauche');
  assert(generateFFBSScoreSheet(sglRes.newState, 'away').controlFormula.isBalanced, 'Contrôle FFBS conforme après Single zone 7');

  // Test 31: Double au champ droit (hitZone: 9) bases vides
  let dblDirInit = createInitialGameState();
  const dblRes = processAction(dblDirInit, 'DOUBLE', undefined, { hitZone: 9 });
  assert(dblRes.playRecord.ffbsCode === '≠9', 'Double zone 9 : code FFBS est ≠9');
  assert(dblRes.playRecord.zone === 9, 'Double zone 9 : zone enregistrée est 9');
  assert(dblRes.playRecord.description.includes('au champ droit'), 'Double zone 9 : description mentionne le champ droit');
  assert(generateFFBSScoreSheet(dblRes.newState, 'away').controlFormula.isBalanced, 'Contrôle FFBS conforme après Double zone 9');

  // Test 32: Triple au champ centre (hitZone: 8) bases vides
  let trplDirInit = createInitialGameState();
  const trplRes = processAction(trplDirInit, 'TRIPLE', undefined, { hitZone: 8 });
  assert(trplRes.playRecord.ffbsCode === '≡8', 'Triple zone 8 : code FFBS est ≡8');
  assert(trplRes.playRecord.zone === 8, 'Triple zone 8 : zone enregistrée est 8');
  assert(trplRes.playRecord.description.includes('au champ centre'), 'Triple zone 8 : description mentionne le champ centre');
  assert(generateFFBSScoreSheet(trplRes.newState, 'away').controlFormula.isBalanced, 'Contrôle FFBS conforme après Triple zone 8');

  // Test 33: Home Run au champ gauche (hitZone: 7)
  let hrDirInit = createInitialGameState();
  const hrRes = processAction(hrDirInit, 'HOMERUN', undefined, { hitZone: 7 });
  assert(hrRes.playRecord.ffbsCode === 'HR7', 'Home Run zone 7 : code FFBS est HR7');
  assert(hrRes.playRecord.zone === 7, 'Home Run zone 7 : zone enregistrée est 7');
  assert(hrRes.playRecord.description.includes('au champ gauche'), 'Home Run zone 7 : description mentionne le champ gauche');
  assert(generateFFBSScoreSheet(hrRes.newState, 'away').controlFormula.isBalanced, 'Contrôle FFBS conforme après Home Run zone 7');

  // Test 34: Roulant vers l'arrêt-court (hitZone: 6)
  let goDirInit = createInitialGameState();
  const goRes = processAction(goDirInit, 'GROUNDOUT', undefined, { hitZone: 6 });
  assert(goRes.playRecord.ffbsCode === '63', 'Roulant zone 6 : code FFBS est 63');
  assert(goRes.playRecord.zone === 6, 'Roulant zone 6 : zone enregistrée est 6');
  assert(goRes.playRecord.description.includes("vers l'arrêt-court"), 'Roulant zone 6 : description mentionne l arrêt-court');
  assert(generateFFBSScoreSheet(goRes.newState, 'away').controlFormula.isBalanced, 'Contrôle FFBS conforme après Roulant zone 6');

  // Test 35: Balle en volée au champ gauche (hitZone: 7)
  let foDirInit = createInitialGameState();
  const foRes = processAction(foDirInit, 'FLYOUT', undefined, { hitZone: 7 });
  assert(foRes.playRecord.ffbsCode === 'F7', 'Flyout zone 7 : code FFBS est F7');
  assert(foRes.playRecord.zone === 7, 'Flyout zone 7 : zone enregistrée est 7');
  assert(foRes.playRecord.description.includes('au champ gauche'), 'Flyout zone 7 : description mentionne le champ gauche');
  assert(generateFFBSScoreSheet(foRes.newState, 'away').controlFormula.isBalanced, 'Contrôle FFBS conforme après Flyout zone 7');

  // Test 36: Double avec runnerResolution et hitZone: 9
  let dblResState = processAction(goResInit, 'DOUBLE', undefined, {
    runnerResolution: {
      batterDestination: 'second',
      runner3BDestination: 'score',
      runner2BDestination: 'score',
      hitZone: 9,
    },
  });
  assert(dblResState.playRecord.ffbsCode === '≠9', 'Double avec runnerResolution et zone 9 : code FFBS est ≠9');
  assert(dblResState.playRecord.zone === 9, 'Double avec runnerResolution et zone 9 : zone est 9');
  assert(dblResState.playRecord.description.includes('au champ droit'), 'Double avec runnerResolution et zone 9 : description mentionne le champ droit');
  assert(generateFFBSScoreSheet(dblResState.newState, 'away').controlFormula.isBalanced, 'Contrôle FFBS conforme après Double runnerResolution');

  console.log(`\n🏁 Tests Finished: ${failures === 0 ? 'ALL PASSED!' : `${failures} failures.`}`);
  if (failures > 0) process.exit(1);
}

runTests();
