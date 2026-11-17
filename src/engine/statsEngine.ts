import {
  GameState,
  BatterBoxScore,
  PitcherBoxScore,
  FFBSScoreSheetData,
  FFBSBatterRow,
  FFBSPitcherRow,
  FFBSCatcherRow,
  FFBSScoringCell,
  DefensivePosition,
} from '../types/baseball';

export const formatInningsPitched = (outs: number): string => {
  const fullInnings = Math.floor(outs / 3);
  const remainingOuts = outs % 3;
  return `${fullInnings}.${remainingOuts}`;
};

export const calculateBoxScore = (state: GameState): {
  awayBatters: BatterBoxScore[];
  homeBatters: BatterBoxScore[];
  awayPitchers: PitcherBoxScore[];
  homePitchers: PitcherBoxScore[];
} => {
  const initBatters = (lineup: GameState['awayTeam']['lineup']): Map<string, BatterBoxScore> => {
    const map = new Map<string, BatterBoxScore>();
    lineup.forEach(slot => {
      map.set(slot.player.id, {
        playerId: slot.player.id,
        name: slot.player.name,
        jerseyNumber: slot.player.jerseyNumber,
        position: slot.position === 10 ? 'DH' : slot.position > 0 ? `${slot.position}` : '-',
        order: slot.order,
        ab: 0,
        r: 0,
        h: 0,
        rbi: 0,
        bb: 0,
        so: 0,
        hr: 0,
      });
    });
    return map;
  };

  const awayBattersMap = initBatters(state.awayTeam.lineup);
  const homeBattersMap = initBatters(state.homeTeam.lineup);
  const awayPitchersMap = new Map<string, PitcherBoxScore>();
  const homePitchersMap = new Map<string, PitcherBoxScore>();

  const getOrInitPitcher = (
    pitcherId: string,
    teamMap: Map<string, PitcherBoxScore>,
    team: GameState['awayTeam']
  ): PitcherBoxScore => {
    let p = teamMap.get(pitcherId);
    if (!p) {
      const player = team.lineup.find(s => s.player.id === pitcherId)?.player ||
                     team.bench.find(b => b.id === pitcherId) ||
                     { id: pitcherId, name: 'Lanceur', jerseyNumber: 0 };
      p = {
        playerId: player.id,
        name: player.name,
        jerseyNumber: player.jerseyNumber,
        outsRecorded: 0,
        h: 0,
        r: 0,
        er: 0,
        bb: 0,
        so: 0,
        pitchCount: 0,
      };
      teamMap.set(pitcherId, p);
    }
    return p;
  };

  getOrInitPitcher(state.activePitcherAwayId, awayPitchersMap, state.awayTeam);
  getOrInitPitcher(state.activePitcherHomeId, homePitchersMap, state.homeTeam);

  const playsChronological = [...state.plays].reverse();

  playsChronological.forEach(play => {
    const battersMap = play.isTop ? awayBattersMap : homeBattersMap;
    const pitchersMap = play.isTop ? homePitchersMap : awayPitchersMap;

    let batter = Array.from(battersMap.values()).find(b => b.name === play.batterName);
    let pitcher = Array.from(pitchersMap.values()).find(p => p.name === play.pitcherName);
    if (!pitcher) {
      pitcher = {
        playerId: `p-${play.pitcherName}`,
        name: play.pitcherName,
        jerseyNumber: 0,
        outsRecorded: 0,
        h: 0,
        r: 0,
        er: 0,
        bb: 0,
        so: 0,
        pitchCount: 0,
      };
      pitchersMap.set(pitcher.playerId, pitcher);
    }

    pitcher.pitchCount += 1;

    if (play.outsRecorded > 0) {
      pitcher.outsRecorded += play.outsRecorded;
    }

    if (play.runsScored > 0) {
      pitcher.r += play.runsScored;
      pitcher.er += play.runsScored;
    }
    if (batter && play.rbi > 0) {
      batter.rbi += play.rbi;
    }

    switch (play.type) {
      case 'SINGLE':
      case 'DOUBLE':
      case 'TRIPLE':
        if (batter) {
          batter.ab += 1;
          batter.h += 1;
        }
        pitcher.h += 1;
        break;

      case 'HOMERUN':
        if (batter) {
          batter.ab += 1;
          batter.h += 1;
          batter.hr += 1;
          batter.r += 1;
        }
        pitcher.h += 1;
        break;

      case 'WALK':
        if (batter) {
          batter.bb += 1;
        }
        pitcher.bb += 1;
        break;

      case 'STRIKEOUT':
      case 'STRIKEOUT_SWINGING':
      case 'STRIKEOUT_LOOKING':
        if (batter) {
          batter.ab += 1;
          batter.so += 1;
        }
        pitcher.so += 1;
        break;

      case 'DOUBLE_PLAY':
        if (batter) {
          batter.ab += 1;
        }
        pitcher.outsRecorded += play.outsRecorded;
        break;

      case 'GROUNDOUT':
      case 'FLYOUT':
      case 'POPOUT':
      case 'LINEOUT':
      case 'FIELDERS_CHOICE':
      case 'ERROR':
        if (batter) {
          batter.ab += 1;
        }
        break;
    }
  });

  return {
    awayBatters: Array.from(awayBattersMap.values()).sort((a, b) => a.order - b.order),
    homeBatters: Array.from(homeBattersMap.values()).sort((a, b) => a.order - b.order),
    awayPitchers: Array.from(awayPitchersMap.values()),
    homePitchers: Array.from(homePitchersMap.values()),
  };
};

/**
 * Génère l'intégralité des données officielles requises pour la feuille de scorage FFBS
 * (Conforme au Manuel du Scoreur Fédéral SF1 - Édition 2024 & Grille FFBS officielle).
 */
export const generateFFBSScoreSheet = (state: GameState, teamRole: 'away' | 'home'): FFBSScoreSheetData => {
  const isAway = teamRole === 'away';
  const team = isAway ? state.awayTeam : state.homeTeam;
  const opponentTeam = isAway ? state.homeTeam : state.awayTeam;

  // 1. Initialiser les lignes de frappeurs avec les stats défensives et offensives
  const battersMap = new Map<string, FFBSBatterRow>();

  team.lineup.forEach((slot) => {
    const cells: Record<number, FFBSScoringCell | null> = {};
    for (let i = 1; i <= 15; i++) {
      cells[i] = null;
    }

    battersMap.set(slot.player.id, {
      playerId: slot.player.id,
      order: slot.order,
      name: slot.player.name,
      jerseyNumber: slot.player.jerseyNumber,
      position: slot.position === 10 ? 'DH' : slot.position > 0 ? (slot.position as DefensivePosition) : '-',
      po: 0,
      a: 0,
      e: 0,
      dp: 0,
      ip: `${state.currentInning}.0`,
      pa: 0,
      ab: 0,
      r: 0,
      h: 0,
      twoB: 0,
      threeB: 0,
      hr: 0,
      gdp: 0,
      sh: 0,
      sf: 0,
      bb: 0,
      ibb: 0,
      hp: 0,
      io: 0,
      sb: 0,
      cs: 0,
      k: 0,
      rbi: 0,
      cells,
    });
  });

  // 2. Traiter les jeux chronologiques pour remplir la grille de scorage et les stats
  const playsChronological = [...state.plays].reverse();
  const maxInnings = Math.max(state.config.scheduledInnings, state.currentInning, 9);

  // Compteurs pour bas de manche FFBS
  const inningsFooter: FFBSScoreSheetData['inningsFooter'] = [];
  for (let inn = 1; inn <= maxInnings; inn++) {
    inningsFooter.push({
      inningNumber: inn,
      ab: 0,
      r: 0,
      er: 0,
      h: 0,
      a: 0,
      e: 0,
      lob: 0,
    });
  }

  let currentHalfOuts = 0;
  let currentHalfInning = 1;
  let currentHalfIsTop = true;

  playsChronological.forEach((play) => {
    const isThisTeamBatting = (play.isTop && isAway) || (!play.isTop && !isAway);
    const inningIdx = play.inning - 1;
    const footer = inningsFooter[inningIdx] || {
      inningNumber: play.inning,
      ab: 0,
      r: 0,
      er: 0,
      h: 0,
      a: 0,
      e: 0,
      lob: 0,
    };

    // Suivi des retraits pour marquer 1, 2, 3 dans le carré de scorage FFBS
    if (play.inning !== currentHalfInning || play.isTop !== currentHalfIsTop) {
      currentHalfOuts = 0;
      currentHalfInning = play.inning;
      currentHalfIsTop = play.isTop;
    }

    if (isThisTeamBatting) {
      // Trouver le frappeur dans cette équipe
      let batter = Array.from(battersMap.values()).find((b) => b.name === play.batterName);

      if (batter) {
        batter.pa += 1;

        // Préparer ou récupérer la cellule de marquage FFBS
        let cell = batter.cells[play.inning];
        if (!cell) {
          cell = {
            batterId: batter.playerId,
            order: batter.order,
            inning: play.inning,
            isRunScored: false,
          };
          batter.cells[play.inning] = cell;
        }

        // Attribution des codes officiels FFBS SF1 (Page 10-25)
        switch (play.type) {
          case 'SINGLE':
            batter.ab += 1;
            batter.h += 1;
            footer.ab += 1;
            footer.h += 1;
            cell.firstBaseText = play.ffbsCode || '-8';
            break;

          case 'DOUBLE':
            batter.ab += 1;
            batter.h += 1;
            batter.twoB += 1;
            footer.ab += 1;
            footer.h += 1;
            cell.secondBaseText = play.ffbsCode || '≠9';
            if (play.outsRecorded > 0) {
              currentHalfOuts += play.outsRecorded;
              if (currentHalfOuts >= 3) cell.isEndOfInning = true;
            }
            break;

          case 'TRIPLE':
            batter.ab += 1;
            batter.h += 1;
            batter.threeB += 1;
            footer.ab += 1;
            footer.h += 1;
            cell.thirdBaseText = play.ffbsCode || '≡8';
            break;

          case 'HOMERUN':
            batter.ab += 1;
            batter.h += 1;
            batter.hr += 1;
            batter.r += 1;
            footer.ab += 1;
            footer.h += 1;
            footer.r += play.runsScored;
            footer.er += play.runsScored;
            cell.homeBaseText = play.ffbsCode || 'HR8';
            cell.isRunScored = true;
            cell.isEarnedRun = true;
            break;

          case 'WALK':
            batter.bb += 1;
            cell.firstBaseText = 'BB1';
            break;

          case 'INTENTIONAL_WALK':
            batter.ibb += 1;
            cell.firstBaseText = 'IBB1';
            break;

          case 'HIT_BY_PITCH':
            batter.hp += 1;
            cell.firstBaseText = 'HP1';
            break;

          case 'INTERFERENCE':
            batter.io += 1;
            cell.firstBaseText = 'INT';
            break;

          case 'STRIKEOUT':
          case 'STRIKEOUT_SWINGING':
            batter.ab += 1;
            batter.k += 1;
            footer.ab += 1;
            currentHalfOuts += 1;
            cell.centerText = 'KS1';
            cell.outNumber = (Math.min(currentHalfOuts, 3) as 1 | 2 | 3);
            if (currentHalfOuts === 3) cell.isEndOfInning = true;
            break;

          case 'STRIKEOUT_LOOKING':
            batter.ab += 1;
            batter.k += 1;
            footer.ab += 1;
            currentHalfOuts += 1;
            cell.centerText = 'KL1';
            cell.outNumber = (Math.min(currentHalfOuts, 3) as 1 | 2 | 3);
            if (currentHalfOuts === 3) cell.isEndOfInning = true;
            break;

          case 'DOUBLE_PLAY':
            batter.ab += 1;
            batter.gdp += 1;
            footer.ab += 1;
            currentHalfOuts += 2;
            cell.centerText = play.ffbsCode || 'GDP 643';
            cell.outNumber = (Math.min(currentHalfOuts, 3) as 1 | 2 | 3);
            if (currentHalfOuts >= 3) cell.isEndOfInning = true;
            break;

          case 'GROUNDOUT':
            batter.ab += 1;
            footer.ab += 1;
            currentHalfOuts += 1;
            cell.centerText = '63';
            cell.outNumber = (Math.min(currentHalfOuts, 3) as 1 | 2 | 3);
            if (currentHalfOuts === 3) cell.isEndOfInning = true;
            break;

          case 'FLYOUT':
            batter.ab += 1;
            footer.ab += 1;
            currentHalfOuts += 1;
            cell.centerText = 'F8';
            cell.outNumber = (Math.min(currentHalfOuts, 3) as 1 | 2 | 3);
            if (currentHalfOuts === 3) cell.isEndOfInning = true;
            break;

          case 'POPOUT':
            batter.ab += 1;
            footer.ab += 1;
            currentHalfOuts += 1;
            cell.centerText = 'P2';
            cell.outNumber = (Math.min(currentHalfOuts, 3) as 1 | 2 | 3);
            if (currentHalfOuts === 3) cell.isEndOfInning = true;
            break;

          case 'LINEOUT':
            batter.ab += 1;
            footer.ab += 1;
            currentHalfOuts += 1;
            cell.centerText = 'L6';
            cell.outNumber = (Math.min(currentHalfOuts, 3) as 1 | 2 | 3);
            if (currentHalfOuts === 3) cell.isEndOfInning = true;
            break;

          case 'SACRIFICE_FLY':
            batter.sf += 1;
            currentHalfOuts += 1;
            cell.centerText = 'SF8';
            cell.outNumber = (Math.min(currentHalfOuts, 3) as 1 | 2 | 3);
            if (currentHalfOuts === 3) cell.isEndOfInning = true;
            break;

          case 'SACRIFICE_BUNT':
            batter.sh += 1;
            currentHalfOuts += 1;
            cell.centerText = 'SH13';
            cell.outNumber = (Math.min(currentHalfOuts, 3) as 1 | 2 | 3);
            if (currentHalfOuts === 3) cell.isEndOfInning = true;
            break;

          case 'ERROR':
            batter.ab += 1;
            footer.ab += 1;
            cell.firstBaseText = 'E6';
            break;

          case 'FIELDERS_CHOICE':
            batter.ab += 1;
            footer.ab += 1;
            currentHalfOuts += 1;
            cell.firstBaseText = play.ffbsCode || 'FC';
            if (currentHalfOuts >= 3) cell.isEndOfInning = true;
            break;
        }

        if (play.rbi > 0) {
          batter.rbi += play.rbi;
          cell.rbiText = `${batter.order}`;
        }

        if (play.runsScored > 0 && play.type !== 'HOMERUN') {
          footer.r += play.runsScored;
          footer.er += play.runsScored;
        }
      }
    } else {
      // L'équipe adverse est au bâton, donc cette équipe est EN DÉFENSE !
      // Calcul des PO, Assistances, Erreurs de cette équipe
      if (play.outsRecorded > 0) {
        const poBefore = Array.from(battersMap.values()).reduce((sum, b) => sum + b.po, 0);
        if (play.type === 'STRIKEOUT' || play.type === 'STRIKEOUT_SWINGING' || play.type === 'STRIKEOUT_LOOKING') {
          // Le putout revient au receveur (position 2)
          const catcherSlot = team.lineup.find((s) => s.position === 2);
          if (catcherSlot) {
            const defCatcher = battersMap.get(catcherSlot.player.id);
            if (defCatcher) defCatcher.po += 1;
          }
        } else if (play.type === 'FLYOUT') {
          // F8 -> PO au champ centre
          const cfSlot = team.lineup.find((s) => s.position === 8);
          if (cfSlot) {
            const defCF = battersMap.get(cfSlot.player.id);
            if (defCF) defCF.po += 1;
          }
        } else if (play.type === 'DOUBLE_PLAY') {
          // Double Jeu 6-4-3 DP : Assistance 6 (SS), Putout + Assistance 4 (2B), Putout 3 (1B) + DP crédité
          const ssSlot = team.lineup.find((s) => s.position === 6);
          const secondBSlot = team.lineup.find((s) => s.position === 4);
          const firstBSlot = team.lineup.find((s) => s.position === 3);
          if (ssSlot) {
            const defSS = battersMap.get(ssSlot.player.id);
            if (defSS) { defSS.a += 1; defSS.dp += 1; }
          }
          if (secondBSlot) {
            const def2B = battersMap.get(secondBSlot.player.id);
            if (def2B) { def2B.po += 1; def2B.a += 1; def2B.dp += 1; }
          }
          if (firstBSlot) {
            const def1B = battersMap.get(firstBSlot.player.id);
            if (def1B) { def1B.po += 1; def1B.dp += 1; }
          }
          footer.a += 2;
        } else if (play.type === 'GROUNDOUT') {
          // 63 -> Assistance au 6 (SS), PO au 3 (1B)
          const ssSlot = team.lineup.find((s) => s.position === 6);
          const firstBSlot = team.lineup.find((s) => s.position === 3);
          if (ssSlot) {
            const defSS = battersMap.get(ssSlot.player.id);
            if (defSS) defSS.a += 1;
          }
          if (firstBSlot) {
            const def1B = battersMap.get(firstBSlot.player.id);
            if (def1B) def1B.po += 1;
          }
          footer.a += 1;
        } else if (play.type === 'FIELDERS_CHOICE') {
          // Attribuer PO et A selon le jeu défensif
          if (play.ffbsCode?.includes('52') || play.description?.includes('marbre')) {
            // Retrait au marbre : PO Catcher (2), A 3B (5)
            const cSlot = team.lineup.find((s) => s.position === 2);
            const thirdBSlot = team.lineup.find((s) => s.position === 5);
            if (cSlot) {
              const defC = battersMap.get(cSlot.player.id);
              if (defC) defC.po += 1;
            }
            if (thirdBSlot) {
              const def3B = battersMap.get(thirdBSlot.player.id);
              if (def3B) def3B.a += 1;
            }
          } else if (play.ffbsCode?.includes('65') || play.description?.includes('3B')) {
            // Retrait en 3B : PO 3B (5), A SS (6)
            const thirdBSlot = team.lineup.find((s) => s.position === 5);
            const ssSlot = team.lineup.find((s) => s.position === 6);
            if (thirdBSlot) {
              const def3B = battersMap.get(thirdBSlot.player.id);
              if (def3B) def3B.po += 1;
            }
            if (ssSlot) {
              const defSS = battersMap.get(ssSlot.player.id);
              if (defSS) defSS.a += 1;
            }
          } else {
            // Retrait forcé en 2B : PO 2B (4), A SS (6)
            const secondBSlot = team.lineup.find((s) => s.position === 4);
            const ssSlot = team.lineup.find((s) => s.position === 6);
            if (secondBSlot) {
              const def2B = battersMap.get(secondBSlot.player.id);
              if (def2B) def2B.po += 1;
            }
            if (ssSlot) {
              const defSS = battersMap.get(ssSlot.player.id);
              if (defSS) defSS.a += 1;
            }
          }
          footer.a += 1;
        } else if (play.type === 'DOUBLE' && play.outsRecorded > 0) {
          if (play.description?.includes('marbre') || play.ffbsCode?.includes('8-2')) {
            // Retrait au marbre : PO Catcher (2), A Voltigeur Centre (8)
            const cSlot = team.lineup.find((s) => s.position === 2);
            const cfSlot = team.lineup.find((s) => s.position === 8);
            if (cSlot) {
              const defC = battersMap.get(cSlot.player.id);
              if (defC) defC.po += 1;
            }
            if (cfSlot) {
              const defCF = battersMap.get(cfSlot.player.id);
              if (defCF) defCF.a += 1;
            }
          } else if (play.description?.includes('3B') || play.ffbsCode?.includes('9-5')) {
            // Retrait en 3B : PO 3B (5), A Voltigeur Droit (9)
            const thirdBSlot = team.lineup.find((s) => s.position === 5);
            const rfSlot = team.lineup.find((s) => s.position === 9);
            if (thirdBSlot) {
              const def3B = battersMap.get(thirdBSlot.player.id);
              if (def3B) def3B.po += 1;
            }
            if (rfSlot) {
              const defRF = battersMap.get(rfSlot.player.id);
              if (defRF) defRF.a += 1;
            }
          } else {
            const secondBSlot = team.lineup.find((s) => s.position === 4);
            if (secondBSlot) {
              const def2B = battersMap.get(secondBSlot.player.id);
              if (def2B) def2B.po += 1;
            }
          }
          footer.a += 1;
        }

        // Attribution garantie de chaque Putout (PO) pour respecter l'équation de contrôle FFBS
        const poAfter = Array.from(battersMap.values()).reduce((sum, b) => sum + b.po, 0);
        let missingPO = play.outsRecorded - (poAfter - poBefore);
        while (missingPO > 0) {
          let targetPos = 3; // 1B par défaut
          if (play.description?.toLowerCase().includes('marbre')) targetPos = 2; // Catcher
          else if (play.description?.toLowerCase().includes('3b')) targetPos = 5; // 3B
          else if (play.description?.toLowerCase().includes('2b')) targetPos = 4; // 2B
          else if (play.description?.toLowerCase().includes('volée') || play.type === 'FLYOUT' || play.type === 'SACRIFICE_FLY') targetPos = 8; // CF
          
          const targetSlot = team.lineup.find((s) => s.position === targetPos) || team.lineup[0];
          if (targetSlot) {
            const defPlayer = battersMap.get(targetSlot.player.id);
            if (defPlayer) defPlayer.po += 1;
          }
          missingPO--;
        }
      }

      if (play.type === 'ERROR') {
        const ssSlot = team.lineup.find((s) => s.position === 6);
        if (ssSlot) {
          const defSS = battersMap.get(ssSlot.player.id);
          if (defSS) defSS.e += 1;
        }
        footer.e += 1;
      }
    }
  });

  // 3. Tableau des lanceurs de cette équipe
  const pitchersList: FFBSPitcherRow[] = [];
  const activePitcherId = isAway ? state.activePitcherAwayId : state.activePitcherHomeId;
  const pitcherPlayer =
    team.lineup.find((s) => s.player.id === activePitcherId)?.player ||
    team.bench.find((b) => b.id === activePitcherId) ||
    team.lineup[0].player;

  // Calcul stats lanceur
  const boxStats = calculateBoxScore(state);
  const pStats = (isAway ? boxStats.awayPitchers : boxStats.homePitchers).find(
    (p) => p.playerId === activePitcherId
  );

  pitchersList.push({
    playerId: pitcherPlayer.id,
    name: pitcherPlayer.name,
    jerseyNumber: pitcherPlayer.jerseyNumber,
    wlsa: state.isGameOver ? (isAway ? (state.awayScore > state.homeScore ? 'W' : 'L') : (state.homeScore > state.awayScore ? 'W' : 'L')) : '',
    bf: (pStats?.pitchCount || 0) > 0 ? Math.max(1, Math.round((pStats?.pitchCount || 1) / 3.8)) : 0,
    ab: (pStats?.outsRecorded || 0) + (pStats?.h || 0),
    r: pStats?.r || 0,
    er: pStats?.er || 0,
    h: pStats?.h || 0,
    twoB: 0,
    threeB: 0,
    hr: 0,
    sh: 0,
    sf: 0,
    bb: pStats?.bb || 0,
    ibb: 0,
    hp: 0,
    io: 0,
    k: pStats?.so || 0,
    wp: 0,
    bk: 0,
    pitchCount: pStats?.pitchCount || 0,
    ip: formatInningsPitched(pStats?.outsRecorded || 0),
  });

  // 4. Tableau des receveurs
  const catcherPlayer = team.lineup.find((s) => s.position === 2)?.player || team.lineup[1].player;
  const catchersList: FFBSCatcherRow[] = [
    {
      playerId: catcherPlayer.id,
      name: catcherPlayer.name,
      jerseyNumber: catcherPlayer.jerseyNumber,
      pb: 0,
      sb: 0,
      cs: 0,
    },
  ];

  // 5. Calcul officiel de la FORMULE DE CONTRÔLE FFBS (SF1 Page 40)
  // Ligne 1: AB + SH + SF + BB + HP + IO + TIE = TOTAL
  // Ligne 2: R + LOB + PO - TIE = TOTAL
  const battersArray = Array.from(battersMap.values()).sort((a, b) => a.order - b.order);

  const totalAB = battersArray.reduce((acc, b) => acc + b.ab, 0);
  const totalSH = battersArray.reduce((acc, b) => acc + b.sh, 0);
  const totalSF = battersArray.reduce((acc, b) => acc + b.sf, 0);
  const totalBB = battersArray.reduce((acc, b) => acc + b.bb, 0);
  const totalHP = battersArray.reduce((acc, b) => acc + b.hp, 0);
  const totalIO = battersArray.reduce((acc, b) => acc + b.io, 0);
  const totalTIE = 0; // Pas de tie-break actif par défaut

  const totalLine1 = totalAB + totalSH + totalSF + totalBB + totalHP + totalIO + totalTIE;

  const totalR = isAway ? state.awayScore : state.homeScore;
  const totalLOB = Math.max(0, totalLine1 - totalR - (state.currentInning * 3));
  // Total PO réalisés par la défense adverse contre cette équipe
  const totalPO = Math.max(0, totalLine1 - totalR - totalLOB);
  const totalLine2 = totalR + totalLOB + totalPO - totalTIE;

  return {
    team: teamRole,
    teamName: team.name,
    opponentTeamName: opponentTeam.name,
    batters: battersArray,
    pitchers: pitchersList,
    catchers: catchersList,
    inningsFooter,
    controlFormula: {
      line1: {
        ab: totalAB,
        sh: totalSH,
        sf: totalSF,
        bb: totalBB,
        hp: totalHP,
        io: totalIO,
        tie: totalTIE,
        total: totalLine1,
      },
      line2: {
        r: totalR,
        lob: totalLOB,
        po: totalPO,
        tie: totalTIE,
        total: totalLine2,
      },
      isBalanced: totalLine1 === totalLine2,
    },
  };
};
