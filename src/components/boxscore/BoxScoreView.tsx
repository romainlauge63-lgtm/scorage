import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { calculateBoxScore, formatInningsPitched } from '../../engine/statsEngine';
import { Printer, Award, FileText } from 'lucide-react';

export const BoxScoreView: React.FC = () => {
  const { gameState } = useGameStore();
  const boxScore = calculateBoxScore(gameState);

  const handlePrint = () => {
    window.print();
  };

  const renderBattingTable = (teamName: string, batters: typeof boxScore.awayBatters) => {
    const totalAB = batters.reduce((acc, b) => acc + b.ab, 0);
    const totalR = batters.reduce((acc, b) => acc + b.r, 0);
    const totalH = batters.reduce((acc, b) => acc + b.h, 0);
    const totalRBI = batters.reduce((acc, b) => acc + b.rbi, 0);
    const totalBB = batters.reduce((acc, b) => acc + b.bb, 0);
    const totalSO = batters.reduce((acc, b) => acc + b.so, 0);
    const totalHR = batters.reduce((acc, b) => acc + b.hr, 0);

    return (
      <div className="border border-slate-300 rounded-xl overflow-hidden mb-6 bg-white shadow-sm">
        <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-300 font-black text-sm sm:text-base text-slate-800 flex items-center justify-between">
          <span>Attaque : {teamName}</span>
          <span className="text-slate-600 font-mono text-xs sm:text-sm">{totalH} Coups sûrs • {totalR} Points</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm font-mono">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-xs uppercase">
              <tr>
                <th className="py-2 px-3 font-sans w-12 text-center">Ordre</th>
                <th className="py-2 px-3 font-sans">Frappeur</th>
                <th className="py-2 px-2 text-center w-14 font-sans">Pos</th>
                <th className="py-2 px-2 text-center w-12">AB</th>
                <th className="py-2 px-2 text-center w-12">R</th>
                <th className="py-2 px-2 text-center w-12">H</th>
                <th className="py-2 px-2 text-center w-12">RBI</th>
                <th className="py-2 px-2 text-center w-12">BB</th>
                <th className="py-2 px-2 text-center w-12">SO</th>
                <th className="py-2 px-2 text-center w-12">HR</th>
                <th className="py-2 px-4 text-right w-16">AVG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {batters.map((b) => {
                const avg = b.ab > 0 ? (b.h / b.ab).toFixed(3).replace('0.', '.') : '.000';
                return (
                  <tr key={b.playerId} className="hover:bg-slate-50 transition">
                    <td className="py-2 px-3 text-center text-slate-500 font-black">#{b.order}</td>
                    <td className="py-2 px-3 font-sans font-bold text-slate-900">
                      #{b.jerseyNumber} {b.name}
                    </td>
                    <td className="py-2 px-2 text-center text-slate-600 font-sans font-bold">{b.position}</td>
                    <td className="py-2 px-2 text-center font-bold text-slate-900">{b.ab}</td>
                    <td className="py-2 px-2 text-center text-red-600 font-black">{b.r}</td>
                    <td className="py-2 px-2 text-center text-emerald-700 font-black">{b.h}</td>
                    <td className="py-2 px-2 text-center font-bold text-slate-800">{b.rbi}</td>
                    <td className="py-2 px-2 text-center font-bold text-slate-700">{b.bb}</td>
                    <td className="py-2 px-2 text-center text-rose-700 font-bold">{b.so}</td>
                    <td className="py-2 px-2 text-center text-amber-700 font-black">{b.hr}</td>
                    <td className="py-2 px-4 text-right font-black text-slate-900">{avg}</td>
                  </tr>
                );
              })}
              {/* TOTAUX ÉQUIPE */}
              <tr className="bg-slate-100 font-black border-t-2 border-slate-300 text-slate-900">
                <td colSpan={3} className="py-2.5 px-3 text-right font-sans uppercase text-xs text-slate-700">
                  Totaux de l'équipe
                </td>
                <td className="py-2.5 px-2 text-center">{totalAB}</td>
                <td className="py-2.5 px-2 text-center text-red-600">{totalR}</td>
                <td className="py-2.5 px-2 text-center text-emerald-700">{totalH}</td>
                <td className="py-2.5 px-2 text-center">{totalRBI}</td>
                <td className="py-2.5 px-2 text-center">{totalBB}</td>
                <td className="py-2.5 px-2 text-center text-rose-700">{totalSO}</td>
                <td className="py-2.5 px-2 text-center text-amber-700">{totalHR}</td>
                <td className="py-2.5 px-4 text-right font-mono">
                  {totalAB > 0 ? (totalH / totalAB).toFixed(3).replace('0.', '.') : '.000'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPitchingTable = (teamName: string, pitchers: typeof boxScore.awayPitchers) => {
    return (
      <div className="border border-slate-300 rounded-xl overflow-hidden mb-6 bg-white shadow-sm">
        <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-300 font-black text-sm sm:text-base text-slate-800">
          Lanceurs : {teamName}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm font-mono">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-xs uppercase">
              <tr>
                <th className="py-2 px-3 font-sans">Lanceur</th>
                <th className="py-2 px-2 text-center w-16">IP</th>
                <th className="py-2 px-2 text-center w-14">H</th>
                <th className="py-2 px-2 text-center w-14">R</th>
                <th className="py-2 px-2 text-center w-14">ER</th>
                <th className="py-2 px-2 text-center w-14">BB</th>
                <th className="py-2 px-2 text-center w-14">SO</th>
                <th className="py-2 px-4 text-right w-20">Lancers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {pitchers.map((p) => (
                <tr key={p.playerId} className="hover:bg-slate-50 transition">
                  <td className="py-2 px-3 font-sans font-bold text-slate-900">
                    {p.name} {p.jerseyNumber > 0 ? `(#${p.jerseyNumber})` : ''}
                  </td>
                  <td className="py-2 px-2 text-center text-slate-900 font-black">
                    {formatInningsPitched(p.outsRecorded)}
                  </td>
                  <td className="py-2 px-2 text-center text-slate-800 font-bold">{p.h}</td>
                  <td className="py-2 px-2 text-center text-red-600 font-black">{p.r}</td>
                  <td className="py-2 px-2 text-center text-red-700 font-black">{p.er}</td>
                  <td className="py-2 px-2 text-center text-slate-800 font-bold">{p.bb}</td>
                  <td className="py-2 px-2 text-center text-emerald-700 font-black">{p.so}</td>
                  <td className="py-2 px-4 text-right text-blue-700 font-black">{p.pitchCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 print:p-0 print:space-y-4 print:text-black">
      {/* BARRE D'ACTIONS ET EXPORT (Cachée à l'impression) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-300 p-4 sm:p-5 rounded-2xl shadow-sm print:hidden">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-red-600" />
            Synthèse Box Score
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Récapitulatif statistique officiel des frappeurs et lanceurs de la rencontre.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-black px-4 py-2.5 rounded-xl text-xs sm:text-sm transition active:scale-95 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Imprimer / PDF
          </button>
        </div>
      </div>

      {/* CONTENU IMPRIMABLE */}
      <div className="bg-white border border-slate-300 rounded-2xl p-6 shadow-sm print:border-none print:shadow-none print:p-0">
        {/* EN-TÊTE DU MATCH */}
        <div className="border-b border-slate-200 pb-5 mb-6 text-center sm:text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase font-black text-red-600 tracking-wider flex items-center gap-1.5 justify-center sm:justify-start">
              <Award className="w-4 h-4" />
              {gameState.config.sportType} • {gameState.config.scheduledInnings} Manches
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {gameState.awayTeam.name} <span className="text-slate-400 font-normal">@</span> {gameState.homeTeam.name}
            </h1>
            <div className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
              Lieu : <strong>{gameState.config.venue}</strong> • Date : <strong>{gameState.config.date}</strong>
            </div>
          </div>

          <div className="bg-slate-50 px-5 py-3 rounded-2xl border border-slate-200 text-center shrink-0">
            <div className="text-xs text-slate-500 uppercase font-bold">Score Final</div>
            <div className="text-3xl sm:text-4xl font-black text-red-600 font-mono">
              {gameState.awayScore} - {gameState.homeScore}
            </div>
            <div className="text-xs text-slate-600 font-bold mt-0.5">
              {gameState.currentInning} manches jouées
            </div>
          </div>
        </div>

        {/* STATISTIQUES AU BÂTON */}
        <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wider mb-3">
          Statistiques Offensives (Frappeurs)
        </h3>
        {renderBattingTable(gameState.awayTeam.name, boxScore.awayBatters)}
        {renderBattingTable(gameState.homeTeam.name, boxScore.homeBatters)}

        {/* STATISTIQUES DES LANCEURS */}
        <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wider mb-3 mt-8">
          Statistiques des Lanceurs (Pitching)
        </h3>
        {renderPitchingTable(gameState.awayTeam.name, boxScore.awayPitchers)}
        {renderPitchingTable(gameState.homeTeam.name, boxScore.homePitchers)}
      </div>
    </div>
  );
};
