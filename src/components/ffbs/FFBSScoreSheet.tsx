import React, { useState, useRef } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { generateFFBSScoreSheet } from '../../engine/statsEngine';
import { Printer, CheckCircle, AlertCircle, Maximize2, X, ZoomIn, ZoomOut, RotateCcw, Move } from 'lucide-react';

export const FFBSScoreSheet: React.FC = () => {
  const { gameState } = useGameStore();
  const [selectedTeam, setSelectedTeam] = useState<'away' | 'home'>('away');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1.0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || !scrollContainerRef.current) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      scrollLeft: scrollContainerRef.current.scrollLeft,
      scrollTop: scrollContainerRef.current.scrollTop,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    scrollContainerRef.current.scrollLeft = dragStart.scrollLeft - dx;
    scrollContainerRef.current.scrollTop = dragStart.scrollTop - dy;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      setZoomScale((z) => Math.min(2.5, Math.max(0.4, +(z + delta).toFixed(2))));
    } else if (scrollContainerRef.current) {
      if (e.shiftKey) {
        scrollContainerRef.current.scrollLeft += e.deltaY;
      } else {
        scrollContainerRef.current.scrollTop += e.deltaY;
        if (e.deltaX) {
          scrollContainerRef.current.scrollLeft += e.deltaX;
        }
      }
    }
  };

  const sheetData = generateFFBSScoreSheet(gameState, selectedTeam);
  const inningsList = Array.from({ length: 9 }, (_, i) => i + 1);

  const handlePrint = () => {
    window.print();
  };

  // Rendu de la grille et des données de la feuille officielle FFBS
  const renderOfficialTable = () => {
    return (
      <div className="min-w-[1060px] max-w-[1200px] mx-auto font-sans print:min-w-0 print:max-w-none print:w-full text-slate-900 bg-white">
        {/* A. EN-TÊTE OFFICIEL DE LA FEUILLE DE SCORE */}
        <div className="border border-slate-400 bg-slate-50 p-2 sm:p-2.5 rounded-t-lg mb-1 print:bg-white print:border-black print:p-1.5 print:rounded-none">
          <div className="grid grid-cols-12 gap-2 items-center text-xs print:text-[7pt] print:gap-1">
            {/* Logo & Titre FFBS */}
            <div className="col-span-3 flex items-center gap-2 border-r border-slate-300 pr-2 print:border-black">
              <div className="w-9 h-9 rounded bg-red-600 text-white font-black flex items-center justify-center text-base print:border print:border-black print:w-7 print:h-7 print:text-xs">
                FFBS
              </div>
              <div>
                <div className="text-[11px] font-black uppercase text-slate-900 leading-tight print:text-[7pt]">
                  Fédération Française
                </div>
                <div className="text-[9px] text-slate-600 font-bold uppercase print:text-[6pt]">
                  Baseball & Softball
                </div>
                <div className="text-[10px] text-red-600 font-black uppercase print:text-[7pt]">
                  {selectedTeam === 'away' ? 'FEUILLE ÉQUIPE VISITEUSE' : 'FEUILLE ÉQUIPE RECEVANTE'}
                </div>
              </div>
            </div>

            {/* Métadonnées Match (Partie Gauche) */}
            <div className="col-span-4 space-y-0.5 text-[11px] border-r border-slate-300 pr-2 print:border-black print:text-[7pt] print:space-y-0">
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Championnat :</span>
                <span className="font-black text-slate-900 truncate max-w-[160px]">{gameState.config.championship}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Catégorie :</span>
                <span className="font-bold text-slate-900">{gameState.config.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Date :</span>
                <span className="font-bold text-slate-900">{gameState.config.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Terrain / Ville :</span>
                <span className="font-bold text-slate-900 truncate max-w-[160px]">{gameState.config.venue} ({gameState.config.city})</span>
              </div>
            </div>

            {/* Métadonnées Match (Partie Droite : Arbitres, Scoreur, Horaires) */}
            <div className="col-span-5 space-y-0.5 text-[10px] print:text-[6.5pt] print:space-y-0">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-bold">Rencontre N° :</span>
                <span className="font-mono font-black text-red-600 bg-white px-1.5 py-0.2 rounded border border-slate-200 print:border-none">
                  {gameState.config.gameNumber}
                </span>
                <span className="text-slate-500 font-bold ml-1">Début :</span>
                <span className="font-bold text-slate-900">{gameState.config.startTime || '14:00'}</span>
                <span className="text-slate-500 font-bold ml-1">Fin :</span>
                <span className="font-bold text-slate-900">{gameState.config.endTime || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Arbitre en chef :</span>
                <span className="font-semibold text-slate-900 truncate max-w-[180px]">{gameState.config.umpires.plate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Scoreur Officiel :</span>
                <span className="font-black text-slate-900 truncate max-w-[180px]">
                  {gameState.config.scorerName} (Licence {gameState.config.scorerLicense})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* B. GRILLE PRINCIPALE (DÉFENSE | MANCHES 1-9 AVEC CARRÉS FFBS | ATTAQUE) */}
        <div className="border border-slate-400 rounded-b-lg overflow-hidden bg-white print:border-black print:rounded-none">
          <table className="w-full text-center border-collapse">
            <thead>
              {/* Ligne d'en-tête principale */}
              <tr className="bg-slate-100 border-b border-slate-400 text-[10px] uppercase font-black text-slate-800 print:text-[6.5pt] print:border-black">
                {/* DÉFENSE (Gauche) */}
                <th colSpan={5} className="py-1 px-1 border-r border-slate-400 print:border-black">DÉFENSE</th>
                <th className="py-1 px-0.5 w-7 border-r border-slate-400 print:border-black">Pos</th>
                <th className="py-1 px-2 text-left w-36 border-r border-slate-400 print:border-black">JOUEURS</th>
                <th className="py-1 px-0.5 w-8 border-r-2 border-slate-400 print:border-black">N°</th>

                {/* MANCHES (Centre) */}
                {inningsList.map((inn) => (
                  <th
                    key={inn}
                    className={`py-1 w-14 border-r border-slate-400 text-xs sm:text-sm font-black print:text-[7pt] print:border-black ${
                      inn === gameState.currentInning ? 'bg-amber-100 text-amber-950 font-black' : ''
                    }`}
                  >
                    {inn}
                  </th>
                ))}

                {/* ATTAQUE (Droite) */}
                <th colSpan={18} className="py-1 px-0.5 border-l-2 border-slate-400 print:border-black">
                  ATTAQUE
                </th>
              </tr>

              {/* Sous-colonnes */}
              <tr className="bg-slate-50 border-b border-slate-400 text-[9px] font-bold text-slate-600 print:text-[6pt] print:border-black">
                {/* Défense */}
                <th className="py-0.5 w-5 border-r border-slate-300 print:border-black" title="Put Out (Retraits)">PO</th>
                <th className="py-0.5 w-5 border-r border-slate-300 print:border-black" title="Assistances">A</th>
                <th className="py-0.5 w-5 border-r border-slate-300 print:border-black" title="Erreurs">E</th>
                <th className="py-0.5 w-5 border-r border-slate-300 print:border-black" title="Double Jeux">DP</th>
                <th className="py-0.5 w-6 border-r border-slate-400 print:border-black" title="Manches jouées en défense">IP</th>
                <th className="py-0.5 border-r border-slate-400 print:border-black"></th>
                <th className="py-0.5 border-r border-slate-400 print:border-black text-left px-2 font-bold">Ordre 1-9</th>
                <th className="py-0.5 border-r-2 border-slate-400 print:border-black"></th>

                {/* Manches */}
                {inningsList.map((inn) => (
                  <th key={inn} className="border-r border-slate-300 print:border-black"></th>
                ))}

                {/* Attaque */}
                <th className="py-0.5 w-5 border-l-2 border-slate-400 print:border-black" title="Présences au marbre">PA</th>
                <th className="py-0.5 w-5 border-r border-slate-300 print:border-black" title="Présences officielles à la batte">AB</th>
                <th className="py-0.5 w-5 border-r border-slate-300 print:border-black" title="Points marqués">R</th>
                <th className="py-0.5 w-5 border-r border-slate-300 print:border-black" title="Coups sûrs">H</th>
                <th className="py-0.5 w-4 border-r border-slate-300 print:border-black" title="Doubles">2B</th>
                <th className="py-0.5 w-4 border-r border-slate-300 print:border-black" title="Triples">3B</th>
                <th className="py-0.5 w-5 border-r border-slate-300 print:border-black" title="Circuits (Home Run)">HR</th>
                <th className="py-0.5 w-5 border-r border-slate-300 print:border-black" title="Double jeu au sol">GDP</th>
                <th className="py-0.5 w-4 border-r border-slate-300 print:border-black" title="Amorti sacrifice">SH</th>
                <th className="py-0.5 w-4 border-r border-slate-300 print:border-black" title="Chandelle sacrifice">SF</th>
                <th className="py-0.5 w-5 border-r border-slate-300 print:border-black" title="But sur balles">BB</th>
                <th className="py-0.5 w-4 border-r border-slate-300 print:border-black" title="But sur balles intentionnel">IBB</th>
                <th className="py-0.5 w-4 border-r border-slate-300 print:border-black" title="Touché par un lancer">HP</th>
                <th className="py-0.5 w-4 border-r border-slate-300 print:border-black" title="Interférence receveur">IO</th>
                <th className="py-0.5 w-4 border-r border-slate-300 print:border-black" title="Bases volées">SB</th>
                <th className="py-0.5 w-4 border-r border-slate-300 print:border-black" title="Pris sur vol">CS</th>
                <th className="py-0.5 w-4 border-r border-slate-300 print:border-black" title="Retraits au bâton (K)">K</th>
                <th className="py-0.5 w-5 print:border-black" title="Points produits">RBI</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-300 text-[10px] font-mono print:text-[6.5pt] print:divide-black">
              {sheetData.batters.map((b) => (
                <tr key={b.playerId} className="hover:bg-slate-50 transition print:bg-white">
                  {/* Colonnes DÉFENSE */}
                  <td className="py-0.5 px-0.5 border-r border-slate-300 text-slate-800 print:text-black print:border-black">{b.po || ''}</td>
                  <td className="py-0.5 px-0.5 border-r border-slate-300 text-slate-800 print:text-black print:border-black">{b.a || ''}</td>
                  <td className="py-0.5 px-0.5 border-r border-slate-300 text-red-600 font-bold print:text-black print:border-black">{b.e || ''}</td>
                  <td className="py-0.5 px-0.5 border-r border-slate-300 text-slate-600 print:text-black print:border-black">{b.dp || ''}</td>
                  <td className="py-0.5 px-0.5 border-r border-slate-400 text-slate-700 font-bold print:text-black print:border-black">{b.ip}</td>

                  {/* Position, Nom, Numéro */}
                  <td className="py-0.5 px-1 border-r border-slate-400 font-sans font-black text-red-600 print:text-black print:border-black">
                    {b.position === 10 || b.position === '10' ? 'DH' : b.position || '-'}
                  </td>
                  <td className="py-0.5 px-2 border-r border-slate-400 font-sans font-bold text-slate-900 text-left truncate print:text-black print:border-black">
                    #{b.order} {b.name}
                  </td>
                  <td className="py-0.5 px-1 border-r-2 border-slate-400 text-slate-900 font-black print:text-black print:border-black">
                    {b.jerseyNumber}
                  </td>

                  {/* GRILLE CENTRALE DE SCORAGE : LE CARRÉ DE MARQUAGE OFFICIEL FFBS SF1 */}
                  {inningsList.map((inn) => {
                    const cell = b.cells[inn];
                    return (
                      <td
                        key={inn}
                        className="p-0 border-r border-slate-300 align-middle w-14 h-12 print:h-9 relative print:border-black"
                      >
                        <div className="w-full h-full relative border border-slate-200 print:border-gray-300">
                          {/* Losange central (pointillé) */}
                          <svg viewBox="0 0 40 40" className="w-full h-full absolute inset-0 pointer-events-none">
                            <polygon
                              points="20,6 34,20 20,34 6,20"
                              fill={cell?.isRunScored ? (cell?.isEarnedRun ? '#fef08a' : '#bfdbfe') : 'none'}
                              fillOpacity={cell?.isRunScored ? 0.75 : 0}
                              stroke={cell?.isRunScored ? '#ca8a04' : '#94a3b8'}
                              strokeWidth="1.2"
                              strokeDasharray={cell?.isRunScored ? 'none' : '1.5 1.5'}
                            />
                          </svg>

                          {/* 1ère Base (Coin bas-droit) */}
                          {cell?.firstBaseText && (
                            <span className="absolute bottom-0.5 right-1 text-[8px] print:text-[6pt] font-black text-emerald-800 print:text-black leading-none">
                              {cell.firstBaseText}
                            </span>
                          )}

                          {/* 2ème Base (Coin haut-droit) */}
                          {cell?.secondBaseText && (
                            <span className="absolute top-0.5 right-1 text-[8px] print:text-[6pt] font-black text-blue-800 print:text-black leading-none">
                              {cell.secondBaseText}
                            </span>
                          )}

                          {/* 3ème Base (Coin haut-gauche) */}
                          {cell?.thirdBaseText && (
                            <span className="absolute top-0.5 left-1 text-[8px] print:text-[6pt] font-black text-indigo-800 print:text-black leading-none">
                              {cell.thirdBaseText}
                            </span>
                          )}

                          {/* Marbre / RBI (Coin bas-gauche) */}
                          {cell?.rbiText && (
                            <span className="absolute bottom-0.5 left-1 text-[8px] print:text-[6pt] font-black text-red-600 print:text-black leading-none" title="Point Produit (RBI)">
                              {cell.rbiText}
                            </span>
                          )}

                          {/* Centre : Retrait encerclé (KS, KL, 63, F8, IF5) */}
                          {cell?.centerText && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="border border-red-600 rounded-full px-1 py-0.2 bg-red-50 print:bg-white print:border-black flex items-center gap-0.5 shadow-sm">
                                <span className="text-[8px] print:text-[6pt] font-black text-red-700 print:text-black leading-none">
                                  {cell.centerText}
                                </span>
                                {cell.outNumber && (
                                  <span className="text-[7px] print:text-[5pt] font-mono font-bold text-white print:text-black bg-red-600 print:border print:border-black rounded-full w-2.5 h-2.5 flex items-center justify-center">
                                    {cell.outNumber}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Trait oblique de fin de manche */}
                          {cell?.isEndOfInning && (
                            <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-red-600 print:bg-black"></div>
                          )}
                        </div>
                      </td>
                    );
                  })}

                  {/* Colonnes ATTAQUE */}
                  <td className="py-0.5 px-0.5 border-l-2 border-slate-400 font-bold text-slate-800 print:text-black print:border-black">{b.pa}</td>
                  <td className="py-0.5 px-0.5 border-r border-slate-300 font-black text-slate-900 print:text-black print:border-black">{b.ab}</td>
                  <td className="py-0.5 px-0.5 border-r border-slate-300 font-black text-red-600 print:text-black print:border-black">{b.r}</td>
                  <td className="py-0.5 px-0.5 border-r border-slate-300 font-black text-emerald-700 print:text-black print:border-black">{b.h}</td>
                  <td className="py-0.5 px-0.5 border-r border-slate-300 text-slate-600 print:text-black print:border-black">{b.twoB || ''}</td>
                  <td className="py-0.5 px-0.5 border-r border-slate-300 text-slate-600 print:text-black print:border-black">{b.threeB || ''}</td>
                  <td className="py-0.5 px-0.5 border-r border-slate-300 font-bold text-red-600 print:text-black print:border-black">{b.hr || ''}</td>
                  <td className="py-0.5 px-0.5 border-r border-slate-300 text-slate-500 print:text-black print:border-black">{b.gdp || ''}</td>
                  <td className="py-0.5 px-0.5 border-r border-slate-300 text-slate-600 print:text-black print:border-black">{b.sh || ''}</td>
                  <td className="py-0.5 px-0.5 border-r border-slate-300 text-slate-600 print:text-black print:border-black">{b.sf || ''}</td>
                  <td className="py-0.5 px-0.5 border-r border-slate-300 text-slate-800 print:text-black print:border-black">{b.bb || ''}</td>
                  <td className="py-0.5 px-0.5 border-r border-slate-300 text-slate-500 print:text-black print:border-black">{b.ibb || ''}</td>
                  <td className="py-0.5 px-0.5 border-r border-slate-300 text-slate-600 print:text-black print:border-black">{b.hp || ''}</td>
                  <td className="py-0.5 px-0.5 border-r border-slate-300 text-slate-500 print:text-black print:border-black">{b.io || ''}</td>
                  <td className="py-0.5 px-0.5 border-r border-slate-300 text-blue-700 print:text-black print:border-black">{b.sb || ''}</td>
                  <td className="py-0.5 px-0.5 border-r border-slate-300 text-rose-700 print:text-black print:border-black">{b.cs || ''}</td>
                  <td className="py-0.5 px-0.5 border-r border-slate-300 text-rose-700 print:text-black print:border-black">{b.k || ''}</td>
                  <td className="py-0.5 px-0.5 font-black text-red-600 print:text-black">{b.rbi}</td>
                </tr>
              ))}

              {/* C. LIGNES DE BAS DE MANCHE FFBS SF1 */}
              {[
                { key: 'ab', label: 'AB (Présences off.)' },
                { key: 'r', label: 'R (Points marqués)' },
                { key: 'er', label: 'ER (Points mérités)' },
                { key: 'h', label: 'H (Coups sûrs)' },
                { key: 'a', label: 'A (Assistances)' },
                { key: 'e', label: 'E (Erreurs)' },
                { key: 'lob', label: 'LOB (Laissés s/ base)' },
              ].map((row, idx) => (
                <tr
                  key={row.key}
                  className={`text-[9px] font-bold ${
                    idx === 0 ? 'border-t-2 border-slate-400' : ''
                  } bg-slate-50 text-slate-700 print:bg-slate-100 print:text-[6pt] print:border-black`}
                >
                  <td colSpan={8} className="py-0.5 px-2 text-right font-sans border-r-2 border-slate-400 print:border-black font-bold">
                    {row.label}
                  </td>
                  {inningsList.map((inn) => {
                    const footer = sheetData.inningsFooter[inn - 1];
                    const val = (footer as any)?.[row.key];
                    return (
                      <td
                        key={inn}
                        className="py-0.5 border-r border-slate-300 text-center font-mono font-bold text-slate-900 print:text-black print:border-black"
                      >
                        {val !== undefined && val > 0 ? val : '-'}
                      </td>
                    );
                  })}
                  <td colSpan={18} className="border-l-2 border-slate-400 print:border-black"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* D. SECTION INFÉRIEURE : LANCEURS, RECEVEURS ET FORMULE DE CONTRÔLE FFBS */}
        <div className="grid grid-cols-12 gap-2 mt-2 print:gap-1">
          {/* TABLEAU DES LANCEURS */}
          <div className="col-span-6 border border-slate-400 rounded-lg p-2 bg-slate-50 print:bg-white print:border-black print:p-1">
            <div className="text-[10px] print:text-[6.5pt] uppercase font-black text-slate-800 mb-1 border-b border-slate-300 pb-0.5 flex justify-between print:text-black print:border-black">
              <span>LANCEURS (Équipe : {sheetData.teamName})</span>
              <span className="text-slate-500 font-semibold print:text-black">W/L/Sa • BF • AB • R • ER • H • BB • SO</span>
            </div>
            <table className="w-full text-center text-[9px] print:text-[6pt] font-mono">
              <thead>
                <tr className="text-slate-600 border-b border-slate-300 print:border-black print:text-black font-bold">
                  <th className="text-left font-sans py-0.5">Lanceur</th>
                  <th>W/L</th>
                  <th>BF</th>
                  <th>AB</th>
                  <th>R</th>
                  <th>ER</th>
                  <th>H</th>
                  <th>BB</th>
                  <th>SO</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 print:divide-black">
                {sheetData.pitchers.map((p) => (
                  <tr key={p.playerId} className="text-slate-900 print:text-black font-medium">
                    <td className="text-left font-sans font-bold py-0.5 truncate">{p.name} (#{p.jerseyNumber})</td>
                    <td>{p.wlsa || '-'}</td>
                    <td>{p.bf}</td>
                    <td>{p.ab}</td>
                    <td className="text-red-600 font-black print:text-black">{p.r}</td>
                    <td className="text-red-600 print:text-black">{p.er}</td>
                    <td>{p.h}</td>
                    <td>{p.bb}</td>
                    <td className="text-emerald-700 font-black print:text-black">{p.k}</td>
                    <td className="font-black text-slate-900 print:text-black">{p.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TABLEAU DES RECEVEURS */}
          <div className="col-span-2 border border-slate-400 rounded-lg p-2 bg-slate-50 print:bg-white print:border-black print:p-1">
            <div className="text-[10px] print:text-[6.5pt] uppercase font-black text-slate-800 mb-1 border-b border-slate-300 pb-0.5 print:text-black print:border-black">
              RECEVEURS
            </div>
            <table className="w-full text-center text-[9px] print:text-[6pt] font-mono">
              <thead>
                <tr className="text-slate-600 border-b border-slate-300 print:border-black print:text-black font-bold">
                  <th className="text-left font-sans py-0.5">Nom</th>
                  <th title="Balles passées">PB</th>
                  <th title="Bases volées">SB</th>
                  <th title="Pris sur vol">CS</th>
                </tr>
              </thead>
              <tbody>
                {sheetData.catchers.map((c) => (
                  <tr key={c.playerId} className="text-slate-900 print:text-black font-medium">
                    <td className="text-left font-sans font-bold py-0.5 truncate">{c.name.split(' ')[0]}</td>
                    <td>{c.pb}</td>
                    <td>{c.sb}</td>
                    <td>{c.cs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* FORMULE DE CONTRÔLE OFFICIELLE FFBS */}
          <div className="col-span-4 border border-slate-400 rounded-lg p-2 bg-slate-50 print:bg-white print:border-black print:p-1">
            <div className="text-[10px] print:text-[6.5pt] uppercase font-black text-slate-900 mb-1 flex items-center justify-between border-b border-slate-300 pb-0.5 print:text-black print:border-black">
              <span>CONTRÔLE OFFICIEL FFBS</span>
              <span className="text-[8px] print:text-[5.5pt] font-bold text-slate-500 print:text-black">Manuel SF1 Page 40</span>
            </div>

            {/* Ligne 1 : AB + SH + SF + BB + HP + IO + TIE = TOTAL */}
            <div className="text-[9px] print:text-[6pt] font-mono text-slate-800 mb-1 print:text-black">
              <div className="flex items-center justify-between text-[7.5px] print:text-[5.5pt] text-slate-500 uppercase print:text-black font-bold">
                <span>AB</span><span>+ SH</span><span>+ SF</span><span>+ BB</span><span>+ HP</span><span>+ IO</span><span>+ TIE</span><span>= TOTAL</span>
              </div>
              <div className="flex items-center justify-between font-bold text-slate-900 mt-0.5 print:text-black">
                <span className="w-3 text-center">{sheetData.controlFormula.line1.ab}</span>
                <span>+</span>
                <span className="w-3 text-center">{sheetData.controlFormula.line1.sh}</span>
                <span>+</span>
                <span className="w-3 text-center">{sheetData.controlFormula.line1.sf}</span>
                <span>+</span>
                <span className="w-3 text-center">{sheetData.controlFormula.line1.bb}</span>
                <span>+</span>
                <span className="w-3 text-center">{sheetData.controlFormula.line1.hp}</span>
                <span>+</span>
                <span className="w-3 text-center">{sheetData.controlFormula.line1.io}</span>
                <span>+</span>
                <span className="w-3 text-center">{sheetData.controlFormula.line1.tie}</span>
                <span>=</span>
                <span className="bg-white px-1.5 py-0.2 rounded font-black text-red-600 border border-slate-200 print:border-none print:text-black">
                  {sheetData.controlFormula.line1.total}
                </span>
              </div>
            </div>

            {/* Ligne 2 : R + LOB + PO - TIE = TOTAL */}
            <div className="text-[9px] print:text-[6pt] font-mono text-slate-800 pt-1 border-t border-slate-200 print:border-black print:text-black">
              <div className="flex items-center justify-between text-[7.5px] print:text-[5.5pt] text-slate-500 uppercase print:text-black font-bold">
                <span>R</span><span>+ LOB</span><span>+ PO</span><span>- TIE</span><span></span><span></span><span></span><span>= TOTAL</span>
              </div>
              <div className="flex items-center justify-between font-bold text-slate-900 mt-0.5 print:text-black">
                <span className="w-3 text-center text-red-600 print:text-black">{sheetData.controlFormula.line2.r}</span>
                <span>+</span>
                <span className="w-3 text-center">{sheetData.controlFormula.line2.lob}</span>
                <span>+</span>
                <span className="w-3 text-center">{sheetData.controlFormula.line2.po}</span>
                <span>-</span>
                <span className="w-3 text-center">{sheetData.controlFormula.line2.tie}</span>
                <span></span><span></span><span></span>
                <span>=</span>
                <span className="bg-white px-1.5 py-0.2 rounded font-black text-red-600 border border-slate-200 print:border-none print:text-black">
                  {sheetData.controlFormula.line2.total}
                </span>
              </div>
            </div>

            {/* Statut Égalité */}
            <div className="mt-1 text-center text-[9px] print:text-[6pt] font-black">
              {sheetData.controlFormula.isBalanced ? (
                <span className="text-emerald-700 print:text-black">
                  ✓ ÉGALITÉ PARFAITE DE SCORAGE VALIDÉE
                </span>
              ) : (
                <span className="text-amber-700 print:text-black">
                  Écart de contrôle ({sheetData.controlFormula.line1.total} vs {sheetData.controlFormula.line2.total})
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-4 pb-16 print:p-0 print:space-y-0 print:text-black print:m-0">
      {/* 1. BARRE D'OUTILS ET COMMUTATION (Masquée à l'impression) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-300 p-4 sm:p-5 rounded-2xl shadow-sm print:hidden">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-red-600 flex items-center justify-center text-white font-black text-2xl shadow-sm">
            ⚾
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              Feuille Officielle de Scorage FFBS (Édition 2024 - SF1)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Conforme au Manuel du Scoreur Fédéral Niveau 1 • Grille de scorage officielle WBSC / FFBS.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Commutateur Équipe Visiteuse / Recevante (Règle 2.2 du manuel) */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold">
            <button
              onClick={() => setSelectedTeam('away')}
              className={`px-3.5 py-2 rounded-lg transition flex items-center gap-2 ${
                selectedTeam === 'away'
                  ? 'bg-white text-slate-900 font-black shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              Visiteur : {gameState.awayTeam.name}
            </button>
            <button
              onClick={() => setSelectedTeam('home')}
              className={`px-3.5 py-2 rounded-lg transition flex items-center gap-2 ${
                selectedTeam === 'home'
                  ? 'bg-white text-slate-900 font-black shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
              Recevant : {gameState.homeTeam.name}
            </button>
          </div>

          {/* BOUTON AGRANDIR / APERÇU PDF */}
          <button
            onClick={() => {
              setZoomScale(1.0);
              setIsPreviewOpen(true);
            }}
            className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-900 font-black px-4 py-2.5 rounded-xl text-xs sm:text-sm border border-blue-300 transition active:scale-95 shadow-sm"
            title="Agrandir et prévisualiser la feuille en plein écran"
          >
            <Maximize2 className="w-4 h-4 text-blue-600" />
            <span>Agrandir / Prévisualisation PDF</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-black px-4 py-2.5 rounded-xl text-xs sm:text-sm transition active:scale-95 shadow-sm"
            title="Imprimer au format officiel A4 Paysage"
          >
            <Printer className="w-4 h-4" />
            Imprimer / PDF (A4)
          </button>
        </div>
      </div>

      {/* 2. BANDEAU DE VÉRIFICATION DU CONTRÔLE FFBS */}
      <div className="print:hidden">
        {sheetData.controlFormula.isBalanced ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs sm:text-sm shadow-sm gap-2">
            <div className="flex items-center gap-2 font-black">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                Contrôle FFBS Conforme (Équilibre Parfait) : Ligne 1 ({sheetData.controlFormula.line1.total}) = Ligne 2 ({sheetData.controlFormula.line2.total})
              </span>
            </div>
            <span className="font-mono bg-white px-2.5 py-1 rounded-lg border border-emerald-300 font-bold text-xs text-emerald-800 self-start sm:self-auto">
              AB({sheetData.controlFormula.line1.ab}) + BB({sheetData.controlFormula.line1.bb}) + HP({sheetData.controlFormula.line1.hp}) = R({sheetData.controlFormula.line2.r}) + LOB({sheetData.controlFormula.line2.lob}) + PO({sheetData.controlFormula.line2.po})
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs sm:text-sm shadow-sm">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span className="font-bold">
              Contrôle en cours de partie : Ligne 1 ({sheetData.controlFormula.line1.total}) / Ligne 2 ({sheetData.controlFormula.line2.total})
            </span>
          </div>
        )}
      </div>

      {/* 3. FEUILLE OFFICIELLE FFBS STANDARD */}
      <div className="ffbs-sheet-container bg-white border border-slate-300 rounded-2xl p-4 sm:p-5 shadow-sm overflow-x-auto print:border-none print:shadow-none print:p-0 print:m-0 print:w-full print:rounded-none">
        {renderOfficialTable()}
      </div>

      {/* 4. MODALE DE PRÉVISUALISATION PLEIN ÉCRAN / ZOOM PDF */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex flex-col animate-in fade-in">
          {/* Barre supérieure de la modale de zoom */}
          <div className="bg-slate-900 border-b border-slate-700 px-4 py-3 flex items-center justify-between text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-red-600 text-white font-black flex items-center justify-center text-sm">
                FFBS
              </div>
              <div>
                <h3 className="font-black text-sm sm:text-base leading-tight">
                  Prévisualisation PDF Officielle (Format A4 Paysage)
                </h3>
                <p className="text-xs text-slate-400">
                  Équipe : <strong>{sheetData.teamName}</strong> • {gameState.config.date}
                </p>
              </div>
            </div>

            {/* Guide d'utilisation souris */}
            <div className="hidden xl:flex items-center gap-2 text-xs text-slate-300 bg-slate-800/90 px-3.5 py-1.5 rounded-xl border border-slate-700">
              <Move className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                <strong>Molette :</strong> défiler • <strong>Shift + Molette :</strong> défiler horizontal • <strong>Ctrl + Molette :</strong> zoomer • <strong>Glisser :</strong> déplacer
              </span>
            </div>

            {/* Contrôles de Zoom */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-800 rounded-xl border border-slate-700 p-1 text-xs">
                <button
                  onClick={() => setZoomScale((z) => Math.max(0.6, +(z - 0.15).toFixed(2)))}
                  className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition"
                  title="Zoomer en arrière"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="px-2 font-mono font-bold text-amber-400 min-w-[50px] text-center">
                  {Math.round(zoomScale * 100)}%
                </span>
                <button
                  onClick={() => setZoomScale((z) => Math.min(2.5, +(z + 0.15).toFixed(2)))}
                  className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition"
                  title="Zoomer en avant"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoomScale(1.0)}
                  className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition ml-1"
                  title="Ajuster à 100%"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-black px-4 py-2 rounded-xl text-xs sm:text-sm transition active:scale-95 shadow"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer (A4)</span>
              </button>

              <button
                onClick={() => setIsPreviewOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition ml-2"
                title="Fermer l'aperçu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Espace de visualisation avec zoom et glisser-déplacer / scroll à la souris */}
          <div
            ref={scrollContainerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            className={`flex-1 overflow-auto p-4 sm:p-8 bg-slate-900/90 select-none ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            <div
              className="min-w-fit min-h-fit flex justify-center items-start mx-auto p-2 sm:p-6"
              style={{
                width: `${Math.max(1200, Math.round(1200 * zoomScale))}px`,
                minHeight: `${Math.max(800, Math.round(800 * zoomScale))}px`,
              }}
            >
              <div
                className="bg-white rounded-xl shadow-2xl p-6 transition-transform duration-100 origin-top"
                style={{
                  transform: `scale(${zoomScale})`,
                  width: '1150px',
                }}
              >
                {renderOfficialTable()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
