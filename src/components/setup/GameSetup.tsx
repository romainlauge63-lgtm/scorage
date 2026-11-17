import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { DefensivePosition, POSITION_NAMES, Player } from '../../types/baseball';
import { Users, Plus, Trash2, MapPin, Calendar, Award, RotateCcw, CheckCircle2 } from 'lucide-react';

export const GameSetup: React.FC = () => {
  const { gameState, updateConfig, updateTeamName, updateLineupSlot, addBenchPlayer, removeBenchPlayer } = useGameStore();
  const [activeTeamTab, setActiveTeamTab] = useState<'away' | 'home'>('away');

  const [newSubName, setNewSubName] = useState('');
  const [newSubNumber, setNewSubNumber] = useState('');

  const currentTeam = activeTeamTab === 'away' ? gameState.awayTeam : gameState.homeTeam;
  const assignedCount = currentTeam.lineup.filter((s) => s.position > 0).length;

  const handleClearPositions = () => {
    currentTeam.lineup.forEach((slot) => {
      updateLineupSlot(activeTeamTab, slot.order, { position: 0 });
    });
  };

  const handleResetDefaultPositions = () => {
    const defaultPositions: DefensivePosition[] = [8, 4, 6, 3, 7, 5, 9, 2, 1];
    currentTeam.lineup.forEach((slot, index) => {
      updateLineupSlot(activeTeamTab, slot.order, { position: defaultPositions[index] });
    });
  };

  const handleAddBench = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;

    const newPlayer: Player = {
      id: `sub-${Date.now()}`,
      name: newSubName.trim(),
      jerseyNumber: parseInt(newSubNumber, 10) || 0,
      bats: 'R',
      throws: 'R',
    };

    addBenchPlayer(activeTeamTab, newPlayer);
    setNewSubName('');
    setNewSubNumber('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* 1. PARAMÈTRES GÉNÉRAUX DU MATCH */}
      <div className="bg-white border border-slate-300 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="mb-5 border-b border-slate-200 pb-4">
          <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-red-600" />
            Configuration d'Avant-Match (Règlement Officiel FFBS)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Saisie des renseignements de la feuille de match et composition des 9 titulaires et réservistes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs sm:text-sm">
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">Discipline</label>
            <select
              value={gameState.config.sportType}
              onChange={(e) => {
                const sport = e.target.value as 'BASEBALL' | 'SOFTBALL';
                updateConfig({
                  sportType: sport,
                  scheduledInnings: sport === 'BASEBALL' ? 9 : 7,
                });
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold focus:ring-2 focus:ring-red-500 outline-none"
            >
              <option value="BASEBALL">Baseball (9 Manches)</option>
              <option value="SOFTBALL">Softball Fastpitch (7 Manches)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1.5">Manches réglementaires</label>
            <input
              type="number"
              min="3"
              max="15"
              value={gameState.config.scheduledInnings}
              onChange={(e) => updateConfig({ scheduledInnings: parseInt(e.target.value, 10) || 9 })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold focus:ring-2 focus:ring-red-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-500" /> Date du match
            </label>
            <input
              type="date"
              value={gameState.config.date}
              onChange={(e) => updateConfig({ date: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold focus:ring-2 focus:ring-red-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-500" /> Terrain / Ville
            </label>
            <input
              type="text"
              value={gameState.config.venue}
              placeholder="Ex: Terrain Pierre Rolland, Rouen"
              onChange={(e) => updateConfig({ venue: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold focus:ring-2 focus:ring-red-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* 2. ÉDITION DES ALIGNEMENTS (LINE-UPS) */}
      <div className="bg-white border border-slate-300 rounded-2xl p-5 sm:p-6 shadow-sm">
        {/* Sélecteur d'équipe (Visiteurs / Locaux) */}
        <div className="flex border-b border-slate-200 mb-6 gap-2">
          <button
            onClick={() => setActiveTeamTab('away')}
            className={`py-3 px-5 font-black text-sm sm:text-base border-b-2 transition flex items-center gap-2 rounded-t-xl ${
              activeTeamTab === 'away'
                ? 'border-red-600 text-red-600 bg-red-50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span className="w-3 h-3 rounded-full bg-blue-600"></span>
            Équipe Visiteuse : {gameState.awayTeam.name}
          </button>

          <button
            onClick={() => setActiveTeamTab('home')}
            className={`py-3 px-5 font-black text-sm sm:text-base border-b-2 transition flex items-center gap-2 rounded-t-xl ${
              activeTeamTab === 'home'
                ? 'border-red-600 text-red-600 bg-red-50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span className="w-3 h-3 rounded-full bg-red-600"></span>
            Équipe Locale : {gameState.homeTeam.name}
          </button>
        </div>

        {/* Nom de l'équipe sélectionnée */}
        <div className="mb-5">
          <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
            Nom du Club / Équipe ({activeTeamTab === 'away' ? 'Visiteur' : 'Local'})
          </label>
          <input
            type="text"
            value={currentTeam.name}
            onChange={(e) => updateTeamName(activeTeamTab, e.target.value)}
            className="w-full sm:w-96 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 font-black text-base focus:ring-2 focus:ring-red-500 outline-none"
          />
        </div>

        {/* Grille des 9 Frappeurs Titulaires (Line-up) */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between mb-3 gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-red-600" />
                Line-Up des 9 Titulaires (Ordre au bâton & Postes défensifs)
              </h3>
              {assignedCount === 9 ? (
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-black border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  9/9 postes assignés
                </span>
              ) : (
                <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-black border border-amber-300 animate-pulse">
                  {assignedCount}/9 postes ({9 - assignedCount} restant{9 - assignedCount > 1 ? 's' : ''})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearPositions}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black border border-slate-300 transition active:scale-95 shadow-sm"
                title="Vider tous les postes de cette équipe pour les sélectionner un par un"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                <span>Vider les postes (Saisie 1 par 1)</span>
              </button>
              <button
                type="button"
                onClick={handleResetDefaultPositions}
                className="px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200 transition"
                title="Rétablir les 9 postes standards automatiquement"
              >
                Postes 1-9 auto
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-100 text-slate-700 font-black border-b border-slate-300 uppercase text-xs">
                <tr>
                  <th className="py-2.5 px-3 w-14 text-center">Ordre</th>
                  <th className="py-2.5 px-4">Nom & Prénom du Joueur</th>
                  <th className="py-2.5 px-3 w-24 text-center">N° Maillot</th>
                  <th className="py-2.5 px-4 w-64">Position Défensive (1 à 9 / DH)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {currentTeam.lineup.map((slot) => {
                  // Postes déjà pris par les autres joueurs de la même équipe
                  const otherAssignedPositions = new Set(
                    currentTeam.lineup
                      .filter((s) => s.order !== slot.order && s.position > 0)
                      .map((s) => s.position)
                  );

                  // Postes disponibles pour ce slot :
                  // Le poste actuel du joueur + les postes non encore assignés aux autres
                  const availablePositions = (Object.keys(POSITION_NAMES) as unknown as DefensivePosition[])
                    .map(Number)
                    .filter((num) => num === slot.position || !otherAssignedPositions.has(num as DefensivePosition));

                  return (
                    <tr key={slot.order} className="hover:bg-slate-50 transition">
                      <td className="py-2 px-3 font-mono font-black text-red-600 text-center text-base">
                        #{slot.order}
                      </td>
                      <td className="py-2 px-4">
                        <input
                          type="text"
                          value={slot.player.name}
                          onChange={(e) =>
                            updateLineupSlot(activeTeamTab, slot.order, {
                              player: { ...slot.player, name: e.target.value },
                            })
                          }
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-bold focus:border-red-500 outline-none"
                          placeholder={`Joueur ${slot.order}`}
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          value={slot.player.jerseyNumber || ''}
                          onChange={(e) =>
                            updateLineupSlot(activeTeamTab, slot.order, {
                              player: { ...slot.player, jerseyNumber: parseInt(e.target.value, 10) || 0 },
                            })
                          }
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-2 text-center text-slate-900 font-mono font-black focus:border-red-500 outline-none"
                          placeholder="N°"
                        />
                      </td>
                      <td className="py-2 px-4">
                        <select
                          value={slot.position || 0}
                          onChange={(e) =>
                            updateLineupSlot(activeTeamTab, slot.order, {
                              position: parseInt(e.target.value, 10) as DefensivePosition | 0,
                            })
                          }
                          className={`w-full border rounded-lg px-3 py-2 font-bold outline-none transition ${
                            slot.position > 0
                              ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-red-500'
                              : 'bg-amber-50 border-amber-300 text-amber-900 focus:border-amber-500 font-semibold'
                          }`}
                        >
                          <option value={0}>-- Choisir un poste --</option>
                          {availablePositions.map((num) => {
                            const info = POSITION_NAMES[num as DefensivePosition];
                            return (
                              <option key={num} value={num}>
                                {num} - {info.label}
                              </option>
                            );
                          })}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Alerte / Sélecteur Frappeur Désigné (DH) */}
          {currentTeam.lineup.some(slot => slot.position === 10) && (
            <div className="mt-3 p-3.5 rounded-xl bg-purple-50 border-2 border-purple-200 text-xs sm:text-sm text-purple-950 space-y-2">
              <div className="flex items-center gap-2 font-black text-purple-950">
                <span className="px-2 py-0.5 rounded bg-purple-600 text-white text-xs font-mono">10 - DH</span>
                <span>Règle du Frappeur Désigné (DH) active pour cette équipe</span>
              </div>
              <p className="text-xs text-purple-800 font-medium">
                Le joueur #{currentTeam.lineup.find(s => s.position === 10)?.order} ({currentTeam.lineup.find(s => s.position === 10)?.player.name || 'DH'}) frappe dans l'alignement offensif à la place du Lanceur. Le lanceur partant joue uniquement en défense (au monticule).
              </p>
              <div className="flex flex-wrap items-center gap-2.5 pt-1.5 border-t border-purple-200">
                <span className="text-xs font-bold text-purple-900">⚾ Lanceur partant au monticule :</span>
                <select
                  value={activeTeamTab === 'away' ? gameState.activePitcherAwayId : gameState.activePitcherHomeId}
                  onChange={(e) => {
                    const newPitcherId = e.target.value;
                    useGameStore.setState((s) => ({
                      gameState: {
                        ...s.gameState,
                        [activeTeamTab === 'away' ? 'activePitcherAwayId' : 'activePitcherHomeId']: newPitcherId,
                      }
                    }));
                  }}
                  className="bg-white border border-purple-300 rounded-lg px-2.5 py-1 text-xs font-bold text-purple-950 outline-none focus:border-purple-500 shadow-sm"
                >
                  {currentTeam.bench.map(p => (
                    <option key={p.id} value={p.id}>
                      #{p.jerseyNumber} {p.name} (Banc / Roster)
                    </option>
                  ))}
                  {currentTeam.lineup.map(s => (
                    <option key={s.player.id} value={s.player.id}>
                      #{s.player.jerseyNumber} {s.player.name} (Frappeur #{s.order})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* 3. GESTION DES REMPLAÇANTS / BANC */}
        <div className="pt-5 border-t border-slate-200">
          <h3 className="text-sm sm:text-base font-black text-slate-900 mb-3 flex items-center gap-2">
            <span>Remplaçants & Réserves (Banc de touche)</span>
            <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-bold border border-slate-200">
              {currentTeam.bench.length} joueur{currentTeam.bench.length > 1 ? 's' : ''}
            </span>
          </h3>

          {/* Formulaire ajout remplaçant */}
          <form onSubmit={handleAddBench} className="flex flex-wrap items-center gap-2.5 mb-4">
            <input
              type="text"
              value={newSubName}
              onChange={(e) => setNewSubName(e.target.value)}
              placeholder="Nom du remplaçant (ex: Thomas Dubois)"
              className="flex-1 min-w-[220px] bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-sm text-slate-900 font-bold outline-none focus:border-red-500"
            />
            <input
              type="number"
              value={newSubNumber}
              onChange={(e) => setNewSubNumber(e.target.value)}
              placeholder="N° maillot"
              className="w-28 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-black outline-none focus:border-red-500 text-center font-mono"
            />
            <button
              type="submit"
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-black px-4 py-2 rounded-xl text-sm transition active:scale-95 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Ajouter au banc
            </button>
          </form>

          {/* Liste des remplaçants actuels */}
          {currentTeam.bench.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {currentTeam.bench.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm shadow-sm"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="w-7 h-7 rounded-lg bg-slate-200 text-slate-900 font-mono font-black flex items-center justify-center text-xs shrink-0">
                      #{player.jerseyNumber}
                    </span>
                    <span className="font-bold text-slate-900 truncate">{player.name}</span>
                  </div>
                  <button
                    onClick={() => removeBenchPlayer(activeTeamTab, player.id)}
                    className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition"
                    title="Retirer du banc"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-slate-500 italic">
              Aucun remplaçant saisi pour cette équipe.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
