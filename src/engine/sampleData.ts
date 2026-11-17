import { GameState, Team, DefensivePosition } from '../types/baseball';

export const createDefaultTeams = (): { awayTeam: Team; homeTeam: Team } => {
  const defaultPositions: DefensivePosition[] = [8, 4, 6, 3, 7, 5, 9, 2, 1]; // CF, 2B, SS, 1B, LF, 3B, RF, C, P

  const awayTeam: Team = {
    id: 'team-away',
    name: 'Équipe Visiteuse',
    club: '',
    category: '',
    lineup: Array.from({ length: 9 }, (_, i) => ({
      order: i + 1,
      player: {
        id: `visiteur-${i + 1}`,
        name: `Joueur V${i + 1}`,
        jerseyNumber: i + 1,
        bats: 'R',
        throws: 'R',
      },
      position: defaultPositions[i],
      isStarter: true,
    })),
    bench: [],
  };

  const homeTeam: Team = {
    id: 'team-home',
    name: 'Équipe Locale',
    club: '',
    category: '',
    lineup: Array.from({ length: 9 }, (_, i) => ({
      order: i + 1,
      player: {
        id: `local-${i + 1}`,
        name: `Joueur L${i + 1}`,
        jerseyNumber: i + 1,
        bats: 'R',
        throws: 'R',
      },
      position: defaultPositions[i],
      isStarter: true,
    })),
    bench: [],
  };

  return { awayTeam, homeTeam };
};

export const createInitialGameState = (): GameState => {
  const { awayTeam, homeTeam } = createDefaultTeams();

  const awayPitcher = awayTeam.lineup.find(s => s.position === 1)?.player.id || awayTeam.lineup[8].player.id;
  const homePitcher = homeTeam.lineup.find(s => s.position === 1)?.player.id || homeTeam.lineup[8].player.id;

  const scheduledInnings = 9;
  const initialInningScores = Array.from({ length: scheduledInnings }, (_, i) => ({
    inningNumber: i + 1,
    awayRuns: i === 0 ? 0 : null,
    homeRuns: null,
    awayHits: 0,
    homeHits: 0,
    awayErrors: 0,
    homeErrors: 0,
  }));

  return {
    config: {
      sportType: 'BASEBALL',
      scheduledInnings: 9,
      gameNumber: '',
      championship: '',
      category: '',
      venue: '',
      city: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '',
      endTime: '',
      duration: '',
      scorerName: '',
      scorerLicense: '',
      umpires: {
        plate: '',
        firstBase: '',
        secondBase: '',
        thirdBase: '',
        commissioner: '',
      },
      useDH: false,
    },
    awayTeam,
    homeTeam,
    currentInning: 1,
    isTop: true,
    count: { balls: 0, strikes: 0, outs: 0 },
    runners: { first: null, second: null, third: null },
    awayScore: 0,
    homeScore: 0,
    awayHits: 0,
    homeHits: 0,
    awayErrors: 0,
    homeErrors: 0,
    inningScores: initialInningScores,
    awayLineupIndex: 0,
    homeLineupIndex: 0,
    activePitcherAwayId: awayPitcher,
    activePitcherHomeId: homePitcher,
    plays: [],
    substitutions: [],
    isGameOver: false,
  };
};
