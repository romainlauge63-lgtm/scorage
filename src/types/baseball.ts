export type DefensivePosition = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export const POSITION_NAMES: Record<DefensivePosition, { code: string; label: string; shortFr: string }> = {
  1: { code: 'P', label: 'Lanceur (Pitcher)', shortFr: 'Lanceur' },
  2: { code: 'C', label: 'Receveur (Catcher)', shortFr: 'Receveur' },
  3: { code: '1B', label: '1ère Base', shortFr: '1ère base' },
  4: { code: '2B', label: '2ème Base', shortFr: '2ème base' },
  5: { code: '3B', label: '3ème Base', shortFr: '3ème base' },
  6: { code: 'SS', label: 'Arrêt-court (Shortstop)', shortFr: 'Arrêt-court' },
  7: { code: 'LF', label: 'Champ Gauche (Left Field)', shortFr: 'Champ G.' },
  8: { code: 'CF', label: 'Champ Centre (Center Field)', shortFr: 'Champ C.' },
  9: { code: 'RF', label: 'Champ Droit (Right Field)', shortFr: 'Champ D.' },
  10: { code: 'DH', label: 'Frappeur Désigné (DH)', shortFr: 'DH' },
};

export interface Player {
  id: string;
  name: string;
  jerseyNumber: number;
  licenseNumber?: string;
  bats?: 'R' | 'L' | 'S';
  throws?: 'R' | 'L';
}

export interface LineupSlot {
  order: number; // 1 to 9
  player: Player;
  position: DefensivePosition | 0;
  isStarter: boolean;
}

export interface Team {
  id: string;
  name: string;
  club?: string;
  category?: string;
  lineup: LineupSlot[];
  bench: Player[];
}

export interface RunnersOnBase {
  first: Player | null;
  second: Player | null;
  third: Player | null;
}

export interface Count {
  balls: number;   // 0 - 3 (4 = BB)
  strikes: number; // 0 - 2 (3 = K)
  outs: number;    // 0 - 2 (3 = Changement de manche)
}

export interface InningScore {
  inningNumber: number;
  awayRuns: number | null;
  homeRuns: number | null;
  awayHits: number;
  homeHits: number;
  awayErrors: number;
  homeErrors: number;
  // Statistiques officielles de bas de manche FFBS SF1 (Page 11)
  awayAB?: number;
  homeAB?: number;
  awayER?: number;
  homeER?: number;
  awayA?: number; // Assistances
  homeA?: number;
  awayLOB?: number; // Left on base
  homeLOB?: number;
}

export type PlayType =
  | 'BALL'
  | 'CALLED_STRIKE'
  | 'SWINGING_STRIKE'
  | 'FOUL'
  | 'SINGLE'
  | 'DOUBLE'
  | 'TRIPLE'
  | 'HOMERUN'
  | 'WALK'
  | 'INTENTIONAL_WALK'
  | 'HIT_BY_PITCH'
  | 'STRIKEOUT_SWINGING'
  | 'STRIKEOUT_LOOKING'
  | 'STRIKEOUT'
  | 'DOUBLE_PLAY'
  | 'GROUNDOUT'
  | 'FLYOUT'
  | 'POPOUT'
  | 'LINEOUT'
  | 'SACRIFICE_FLY'
  | 'SACRIFICE_BUNT'
  | 'FIELDERS_CHOICE'
  | 'ERROR'
  | 'STOLEN_BASE'
  | 'CAUGHT_STEALING'
  | 'WILD_PITCH'
  | 'PASSED_BALL'
  | 'BALK'
  | 'INFIELD_FLY'
  | 'INTERFERENCE'
  | 'OBR';

export type HitDirection = 'left' | 'center' | 'right' | 'infield_3b' | 'infield_ss' | 'infield_2b' | 'infield_1b' | 'infield_p' | 'infield_c';
export type HitZoneNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface PlayRecord {
  id: string;
  timestamp: string;
  inning: number;
  isTop: boolean;
  type: PlayType;
  description: string;
  batterName: string;
  batterOrder: number;
  pitcherName: string;
  rbi: number;
  runsScored: number;
  outsRecorded: number;
  ffbsCode?: string; // Ex: 'KS', 'KL', '63', 'F8', '-8', '≠9', '≡8', 'HR8', 'BB1', 'HP1', 'SB3', 'GDP 643'
  zone?: number;     // 1 à 9 pour localisation du coup sûr
  fielders?: number[]; // [6, 3] pour un 63, [6, 4, 3] etc.
  doublePlayDetail?: {
    runnerOutBase: 'first' | 'second' | 'third';
    runnerOutName: string;
    combination: string; // Ex: '6-4-3', '5-4-3', 'F8-4'
  };
  scoreAway: number;
  scoreHome: number;
}

export interface SubstitutionRecord {
  id: string;
  timestamp: string;
  inning: number;
  isTop: boolean;
  teamName: string;
  type: 'PITCHER_CHANGE' | 'PINCH_HITTER' | 'PINCH_RUNNER' | 'DEFENSIVE_SWAP';
  playerOutName: string;
  playerInName: string;
  newPosition?: DefensivePosition;
  notes?: string;
}

export interface GameConfig {
  sportType: 'BASEBALL' | 'SOFTBALL';
  scheduledInnings: number; // 9 pour baseball, 7 pour softball
  gameNumber: string;       // Rencontre N°
  championship: string;     // Championnat (National, Régional, Amical)
  category: string;         // 9U, 12U, 15U, 18U, Seniors
  venue: string;            // Terrain
  city: string;             // Ville
  date: string;             // Date
  startTime: string;        // Heure Début
  endTime: string;          // Heure Fin
  duration: string;         // Durée
  scorerName: string;       // Nom du scoreur
  scorerLicense?: string;
  umpires: {
    plate: string;          // Arbitre en chef (Home plate)
    firstBase: string;      // Arbitre 1B
    secondBase: string;     // Arbitre 2B
    thirdBase: string;      // Arbitre 3B
    commissioner: string;   // Commissaire technique
  };
  useDH: boolean;
}

export interface GameState {
  config: GameConfig;
  awayTeam: Team;
  homeTeam: Team;
  currentInning: number;
  isTop: boolean; // true = Visiteurs en attaque, false = Locaux en attaque
  count: Count;
  runners: RunnersOnBase;
  awayScore: number;
  homeScore: number;
  awayHits: number;
  homeHits: number;
  awayErrors: number;
  homeErrors: number;
  inningScores: InningScore[];
  awayLineupIndex: number; // 0 to 8
  homeLineupIndex: number; // 0 to 8
  activePitcherAwayId: string;
  activePitcherHomeId: string;
  plays: PlayRecord[];
  substitutions: SubstitutionRecord[];
  isGameOver: boolean;
}

export interface BatterBoxScore {
  playerId: string;
  name: string;
  jerseyNumber: number;
  position: string;
  order: number;
  ab: number; // At-bats
  r: number;  // Runs
  h: number;  // Hits
  rbi: number;// Runs batted in
  bb: number; // Base on balls
  so: number; // Strikeouts
  hr: number; // Home runs
}

export interface PitcherBoxScore {
  playerId: string;
  name: string;
  jerseyNumber: number;
  outsRecorded: number; // Converti en IP ex: 7 outs = 2.1 IP
  h: number;            // Hits concédés
  r: number;            // Points
  er: number;           // Points mérités
  bb: number;           // Buts sur balles concédés
  so: number;           // Retraits sur 3 prises
  pitchCount: number;   // Nombre total de lancers
}

// -----------------------------------------------------------------------------
// Modèles officiels pour la feuille de scorage FFBS (Feuille de match officielle)
// -----------------------------------------------------------------------------

export interface FFBSScoringCell {
  batterId: string;
  order: number;
  inning: number;
  firstBaseText?: string;  // Ex: '-8', 'BB1', 'HP1', 'E6', 'INT'
  secondBaseText?: string; // Ex: '≠9', 'SB3', 'WP', '6'
  thirdBaseText?: string;  // Ex: '≡8', 'SB4', '6'
  homeBaseText?: string;   // Ex: 'HR8', '7'
  rbiText?: string;        // Noté dans la case en bas à gauche
  centerText?: string;     // Ex: 'KS1', 'KL1', 'F8', '63', '53', 'IF5'
  outNumber?: 1 | 2 | 3;   // Retrait 1, 2 ou 3 (encerclé en FFBS)
  isRunScored: boolean;    // Losange fermé
  isEarnedRun?: boolean;   // Point mérité (losange noirci / gris)
  isEndOfInning?: boolean; // Trait oblique de fin de manche après ce batteur
}

export interface FFBSBatterRow {
  playerId: string;
  order: number;
  name: string;
  jerseyNumber: number;
  position: DefensivePosition | string;
  // Colonnes Défense (à gauche sur feuille FFBS)
  po: number; // Put Out
  a: number;  // Assistances
  e: number;  // Erreurs
  dp: number; // Double jeux
  ip: string; // Innings Pitched
  // Colonnes Attaque (à droite sur feuille FFBS)
  pa: number; // Plate Appearances
  ab: number; // At Bats
  r: number;  // Runs
  h: number;  // Hits
  twoB: number;
  threeB: number;
  hr: number;
  gdp: number;
  sh: number; // Sacrifice Bunt
  sf: number; // Sacrifice Fly
  bb: number; // Base on Balls
  ibb: number;// Intentional BB
  hp: number; // Hit by Pitch
  io: number; // Interference / Obstruction
  sb: number; // Stolen Base
  cs: number; // Caught Stealing
  k: number;  // Strikeout
  rbi: number;// Runs Batted In
  cells: Record<number, FFBSScoringCell | null>; // Inning (1..15) -> Cell
}

export interface FFBSPitcherRow {
  playerId: string;
  name: string;
  jerseyNumber: number;
  wlsa?: string; // W, L, Sa
  bf: number;    // Batters Faced
  ab: number;    // At Bats contre lui
  r: number;     // Points
  er: number;    // Points mérités
  h: number;     // Hits
  twoB: number;
  threeB: number;
  hr: number;
  sh: number;
  sf: number;
  bb: number;
  ibb: number;
  hp: number;
  io: number;
  k: number;
  wp: number;    // Wild Pitch
  bk: number;    // Balk
  pitchCount: number;
  ip: string;
}

export interface FFBSCatcherRow {
  playerId: string;
  name: string;
  jerseyNumber: number;
  pb: number; // Passed Balls
  sb: number; // Stolen Bases concédées
  cs: number; // Caught Stealing (coureurs retirés)
}

export interface FFBSScoreSheetData {
  team: 'away' | 'home';
  teamName: string;
  opponentTeamName: string;
  batters: FFBSBatterRow[];
  pitchers: FFBSPitcherRow[];
  catchers: FFBSCatcherRow[];
  inningsFooter: {
    inningNumber: number;
    ab: number;
    r: number;
    er: number;
    h: number;
    a: number;
    e: number;
    lob: number;
  }[];
  // Formule de contrôle officielle FFBS (Page 40 & bas de feuille)
  controlFormula: {
    line1: {
      ab: number;
      sh: number;
      sf: number;
      bb: number;
      hp: number;
      io: number;
      tie: number;
      total: number;
    };
    line2: {
      r: number;
      lob: number;
      po: number;
      tie: number;
      total: number;
    };
    isBalanced: boolean;
  };
}
