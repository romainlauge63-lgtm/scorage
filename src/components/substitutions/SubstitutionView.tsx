import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { DefensivePosition, POSITION_NAMES, SubstitutionRecord } from '../../types/baseball';
import { UserCheck, Shuffle, ArrowRightLeft, Clock } from 'lucide-react';

export const SubstitutionView: React.FC = () => {
  const { gameState, makeSubstitution } = useGameStore();

  const [selectedTeam, setSelectedTeam] = useState<'away' | 'home'>('away');
  const [subType, setSubType] = useState<SubstitutionRecord['type']>('PITCHER_CHANGE');
  const [playerOutId, setPlayerOutId] = useState('');
  const [playerInId, setPlayerInId] = useState('');
  const [newPosition, setNewPosition] = useState<DefensivePosition>(1);
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const team = selectedTeam === 'away' ? gameState.awayTeam : gameState.homeTeam;
  const activePitcherId = selectedTeam === 'away' ? gameState.activePitcherAwayId : gameState.activePitcherHomeId;
  const activePitcher = team.lineup.find(s => s.player.id === activePitcherId)?.player ||
    team.bench.find(p => p.id === activePitcherId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerOutId || !playerInId) {
      alert('Veuillez sélectionner le joueur sortant et le joueur entrant.');
      return;
    }

    makeSubstitution({
      team: selectedTeam,
      type: subType,
      playerOutId,
      playerInId,
      newPosition: subType === 'PITCHER_CHANGE' ? 1 : newPosition,
      notes,
    });

    setMessage(`Changement effectué avec succès pour ${team.name} !`);
    setTimeout(() => setMessage(null), 4000);
    setPlayerOutId('');
    setPlayerInId('');
    setNotes('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* 1. FORMULAIRE DE CHANGEMENT EN DIRECT */}
      <div className="bg-white border border-slate-300 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5 border-b border-slate-200 pb-4">
          <ArrowRightLeft className="w-6 h-6 text-red-600" />
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              Enregistrer un Changement en Cours de Match
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Changement de lanceur, frappeur/coureur d'urgence ou substitution défensive (Manche {gameState.currentInning} {gameState.isTop ? '▲' : '▼'}).
            </p>
          </div>
        </div>

        {message && (
          <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-sm font-bold flex items-center gap-2.5">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm font-medium">
          {/* Sélection de l'équipe et type de changement */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Équipe concernée</label>
              <select
                value={selectedTeam}
                onChange={(e) => {
                  setSelectedTeam(e.target.value as 'away' | 'home');
                  setPlayerOutId('');
                  setPlayerInId('');
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold focus:ring-2 focus:ring-red-500 outline-none"
              >
                <option value="away">Visiteur : {gameState.awayTeam.name}</option>
                <option value="home">Local : {gameState.homeTeam.name}</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Type de changement</label>
              <select
                value={subType}
                onChange={(e) => setSubType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold focus:ring-2 focus:ring-red-500 outline-none"
              >
                <option value="PITCHER_CHANGE">⚾ Changement de Lanceur (Pitching Change)</option>
                <option value="PINCH_HITTER">🏏 Frappeur d'urgence (Pinch Hitter)</option>
                <option value="PINCH_RUNNER">🏃 Coureur d'urgence (Pinch Runner)</option>
                <option value="DEFENSIVE_SWAP">🛡️ Substitution défensive de position</option>
              </select>
            </div>
          </div>

          {/* Joueur sortant vs Joueur entrant */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold mb-1.5 text-rose-700">
                🔴 Joueur Sortant (Sur le terrain / Line-up)
              </label>
              <select
                value={playerOutId}
                onChange={(e) => setPlayerOutId(e.target.value)}
                required
                className="w-full bg-rose-50/50 border border-rose-300 rounded-xl px-3.5 py-2.5 text-rose-950 font-bold focus:ring-2 focus:ring-rose-500 outline-none"
              >
                <option value="">-- Choisir le joueur sortant --</option>
                {subType === 'PITCHER_CHANGE' && activePitcher && !team.lineup.some(s => s.player.id === activePitcher.id) && (
                  <option value={activePitcher.id}>
                    ⚾ #{activePitcher.jerseyNumber} {activePitcher.name} [Lanceur actif (DH)]
                  </option>
                )}
                {team.lineup.map((slot) => {
                  const pos = slot.position > 0 ? POSITION_NAMES[slot.position as DefensivePosition] : undefined;
                  return (
                    <option key={slot.player.id} value={slot.player.id}>
                      #{slot.order} - {slot.player.name} (#{slot.player.jerseyNumber}) [{pos?.shortFr || pos?.code || '-'}]
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block font-bold mb-1.5 text-emerald-700">
                🟢 Joueur Entrant (Depuis le banc / Réserve)
              </label>
              <select
                value={playerInId}
                onChange={(e) => setPlayerInId(e.target.value)}
                required
                className="w-full bg-emerald-50/50 border border-emerald-300 rounded-xl px-3.5 py-2.5 text-emerald-950 font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="">-- Choisir le joueur entrant --</option>
                {team.bench.length > 0 ? (
                  team.bench.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (#{p.jerseyNumber})
                    </option>
                  ))
                ) : (
                  <option disabled value="">
                    Aucun joueur disponible sur le banc
                  </option>
                )}
              </select>
            </div>
          </div>

          {/* Nouvelle position défensive (si pas changement de lanceur pur) */}
          {subType !== 'PITCHER_CHANGE' && (
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Poste défensif attribué au joueur entrant
              </label>
              <select
                value={newPosition}
                onChange={(e) => setNewPosition(parseInt(e.target.value, 10) as DefensivePosition)}
                className="w-full sm:w-80 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold focus:ring-2 focus:ring-red-500 outline-none"
              >
                {(Object.keys(POSITION_NAMES) as unknown as DefensivePosition[]).map((posKey) => {
                  const num = Number(posKey) as DefensivePosition;
                  return (
                    <option key={num} value={num}>
                      {num} - {POSITION_NAMES[num].label}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-bold mb-1.5">Notes / Raison (optionnel)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Blessure au coude, choix tactique..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-black px-5 py-3 rounded-xl text-sm sm:text-base transition active:scale-95 shadow-sm"
          >
            <Shuffle className="w-5 h-5" />
            Valider la substitution
          </button>
        </form>
      </div>

      {/* 2. HISTORIQUE DES CHANGEMENTS EFFECTUÉS */}
      <div className="bg-white border border-slate-300 rounded-2xl p-5 sm:p-6 shadow-sm">
        <h3 className="text-base sm:text-lg font-black text-slate-900 mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-red-600" />
            Journal Officiel des Substitutions du Match
          </span>
          <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold border border-slate-200">
            {gameState.substitutions.length} changement{gameState.substitutions.length > 1 ? 's' : ''}
          </span>
        </h3>

        {gameState.substitutions.length === 0 ? (
          <p className="text-sm text-slate-500 italic py-6 text-center">
            Aucun remplacement effectué pour le moment dans cette partie.
          </p>
        ) : (
          <div className="space-y-2.5">
            {gameState.substitutions.map((sub) => (
              <div
                key={sub.id}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs sm:text-sm"
              >
                <div>
                  <div className="flex items-center gap-2 font-black text-slate-900">
                    <span className="text-red-600">
                      M{sub.inning} {sub.isTop ? '▲' : '▼'}
                    </span>
                    <span>•</span>
                    <span className="text-slate-700">{sub.teamName}</span>
                    <span>•</span>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-slate-300 text-xs font-bold text-slate-800">
                      {sub.type === 'PITCHER_CHANGE'
                        ? 'Changement de lanceur'
                        : sub.type === 'PINCH_HITTER'
                        ? "Frappeur d'urgence"
                        : sub.type === 'PINCH_RUNNER'
                        ? "Coureur d'urgence"
                        : 'Substitution de poste'}
                    </span>
                  </div>

                  <div className="mt-1.5 flex items-center gap-2 text-slate-800 font-bold">
                    <span className="text-rose-700">{sub.playerOutName}</span>
                    <span>➔</span>
                    <span className="text-emerald-700">{sub.playerInName}</span>
                    {sub.newPosition && (
                      <span className="text-slate-600 text-xs font-semibold">
                        (Poste: {POSITION_NAMES[sub.newPosition]?.shortFr || sub.newPosition})
                      </span>
                    )}
                  </div>

                  {sub.notes && (
                    <div className="text-xs text-slate-500 italic mt-1 font-medium">
                      Note: {sub.notes}
                    </div>
                  )}
                </div>

                <div className="text-xs text-slate-500 font-mono font-bold shrink-0">
                  {sub.timestamp}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
