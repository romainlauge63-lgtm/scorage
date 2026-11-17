import React from 'react';
import { X, HelpCircle, Flame, ShieldAlert, Sparkles, CheckCircle2, RotateCcw } from 'lucide-react';

interface ScoringHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScoringHelpModal: React.FC<ScoringHelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
      <div className="bg-white border border-slate-300 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-900">
        
        {/* En-tête de la modale */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-black shadow-sm">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                Guide des Boutons & Aide au Scorage
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold">
                Règles officielles FFBS (Manuel du Scoreur Fédéral SF1)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Contenu avec défilement */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-sm leading-relaxed">
          
          {/* 1. LANCERS & COMPTE */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              1. Boutons de Lancers & Gestion du Compte (B-S-O)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <div className="font-black text-emerald-900 flex items-center gap-1.5 mb-1">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-xs">BALL</span>
                  Balle hors zone (Ball)
                </div>
                <p className="text-slate-700 font-medium">
                  Ajoute 1 balle au compte (0 à 3). À la <strong>4ᵉ balle</strong>, déclenche automatiquement un <strong>But sur Balles (BB)</strong> : le frappeur avance en 1B et fait avancer les coureurs forcés.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200">
                <div className="font-black text-amber-950 flex items-center gap-1.5 mb-1">
                  <span className="px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 text-xs">Strike Looking</span>
                  Strike regardé (Called Strike - KL)
                </div>
                <p className="text-slate-700 font-medium">
                  Le frappeur ne s'élance pas mais la balle traverse la zone de prise de l'arbitre. À 2 strikes, enregistre un <strong>Strikeout Looking (noté KL)</strong>.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200">
                <div className="font-black text-amber-950 flex items-center gap-1.5 mb-1">
                  <span className="px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 text-xs">Strike Swinging</span>
                  Strike balancé (Swinging Strike - KS)
                </div>
                <p className="text-slate-700 font-medium">
                  Le frappeur effectue un élan dans le vide sans toucher la balle. À 2 strikes, enregistre un <strong>Strikeout Swinging (noté KS)</strong>.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-100 border border-slate-300">
                <div className="font-black text-slate-900 flex items-center gap-1.5 mb-1">
                  <span className="px-1.5 py-0.5 rounded bg-slate-700 text-white text-xs">FOUL BALL</span>
                  Fausse balle (Foul Ball)
                </div>
                <p className="text-slate-700 font-medium">
                  Balle touchée par la batte atterrissant hors limites. Ajoute 1 strike s'il y a 0 ou 1 strike. <strong>À 2 strikes, le compte reste bloqué à 2</strong> (pas d'élimination sur foul).
                </p>
              </div>
            </div>
          </div>

          {/* 2. FRAPPES EN JEU (HITS) */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              2. Coups Sûrs (Hits)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200">
                <span className="font-black text-blue-900">1B (Coup sûr simple) :</span> Le batteur gagne la 1ère base. Les coureurs <strong>forcés</strong> avancent obligatoirement (ex: si bases pleines, le coureur de 3B marque de façon forcée au marbre). Si un coureur est <strong>non forcé</strong> (ex: coureur en 2B ou 3B avec 1B libre), une fenêtre tactile permet de choisir s'il marque, avance ou reste prudent sur sa base.
              </div>
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200">
                <span className="font-black text-blue-900">2B (Double) :</span> Le frappeur gagne la 2ème base. Les coureurs en 2B et 3B marquent (+ points produits RBI).
              </div>
              <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200">
                <span className="font-black text-indigo-900">3B (Triple) :</span> Frappe profonde permettant au frappeur d'atteindre la 3B. Tous les coureurs sur base marquent.
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-red-50 to-amber-50 border border-red-300">
                <span className="font-black text-red-700 flex items-center gap-1">
                  HR (Coup de Circuit / Home Run) <Flame className="w-3.5 h-3.5" /> :
                </span>
                La balle sort du terrain. Le frappeur et tous les coureurs marquent (Solo, 2-points, 3-points, ou <strong>Grand Chelem</strong> avec 4 points si bases pleines).
              </div>
            </div>
          </div>

          {/* 3. RETRAITS DEFÉNSIFS (OUTS) */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-600"></span>
              3. Retraits Défensifs (Outs)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200">
                <span className="font-black text-rose-950">K (Retrait sur 3 strikes) :</span> Le frappeur accumule 3 strikes. Enregistre 1 retrait au marbre (noté KS ou KL).
              </div>
              <div className="p-3 rounded-xl bg-slate-100 border border-slate-300">
                <span className="font-black text-slate-900">GO (Roulant / Groundout) :</span> Balle au sol captée en champ intérieur et relayée en 1ère base avant le coureur (noté 63, 53, 43...).
              </div>
              <div className="p-3 rounded-xl bg-slate-100 border border-slate-300">
                <span className="font-black text-slate-900">FO (Balle en volée / Flyout) :</span> Balle en chandelle haute captée de volée par un voltigeur (noté F7, F8, F9).
              </div>
              <div className="p-3 rounded-xl bg-slate-100 border border-slate-300">
                <span className="font-black text-slate-900">LO (Balle en ligne / Lineout) :</span> Balle vive et tendue captée directement de volée sans toucher le sol (noté L6, L1, L4...).
              </div>
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 sm:col-span-2">
                <span className="font-black text-amber-950">FC (Choix Défensif / Fielder's Choice) :</span> Sur une balle en jeu avec coureur(s) sur base, la défense choisit de ne pas éliminer le frappeur en 1B, mais d'effectuer le retrait sur un coureur avancé : <strong>au Marbre</strong> (pour bloquer le point), <strong>en 3B</strong> ou <strong>en 2B</strong>. Le frappeur est sauf en 1B (noté FC sur la feuille officielle).
              </div>
            </div>

            {/* Encadré Double Jeu */}
            <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-950 space-y-2">
              <div className="font-black flex items-center justify-between text-xs sm:text-sm">
                <span className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-mono text-xs">DP</span>
                  Double Jeu Défensif (2 Retraits d'un coup)
                </span>
                <span className="text-xs font-mono font-bold text-rose-700 bg-white px-2 py-0.5 rounded border border-rose-200">
                  SF1 p.22 & 40
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                Apparaît automatiquement dès qu'il y a <strong>au moins 1 coureur sur base</strong> et <strong>moins de 2 retraits</strong>. 
                Avec <strong>deux coureurs sur base (1B et 2B)</strong>, l'application vous propose les 3 combinaisons officielles possibles en 1 clic :
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                <div className="bg-white p-2.5 rounded-xl border border-rose-200">
                  <strong className="text-emerald-900 block mb-0.5">1. 2B + 1B (Classique 6-4-3)</strong>
                  <span className="text-slate-600">Retrait en 2B + retrait du batteur en 1B. Le coureur de 2B avance en 3B.</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-rose-200">
                  <strong className="text-amber-900 block mb-0.5">2. 3B + 1B (Roulant 5-3)</strong>
                  <span className="text-slate-600">Retrait forcé en 3B + retrait du batteur en 1B. Le coureur de 1B avance en 2B.</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-rose-200">
                  <strong className="text-blue-900 block mb-0.5">3. 3B + 2B (Éliminations 5-4)</strong>
                  <span className="text-slate-600">Retraits en 3B et 2B. Le batteur atteint la 1B en choix défensif (Option / FC).</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500 font-semibold italic">
              ⚡ Règle FFBS : Dès que le 3ᵉ retrait est atteint, la demi-manche se termine automatiquement (changement attaque/défense, remise à zéro des coureurs et du compte).
            </p>
          </div>

          {/* 4. ACTIONS SPÉCIALES */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              4. Actions Spéciales & Avancées
            </h3>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex items-start gap-2">
                <strong className="text-slate-900 w-16 shrink-0">BB / HBP :</strong>
                <span>But sur balles direct ou Batteur touché par un lancer (Hit By Pitch). Le batteur va automatiquement en 1ère base.</span>
              </div>
              <div className="flex items-start gap-2">
                <strong className="text-slate-900 w-16 shrink-0">E (Erreur) :</strong>
                <span>Mauvais attrapé ou mauvais relais d'un défenseur permettant au frappeur d'atteindre une base indemne.</span>
              </div>
              <div className="flex items-start gap-2">
                <strong className="text-slate-900 w-16 shrink-0">SF / SH :</strong>
                <span>Balle sacrifice (Sacrifice Fly) ou Amorti sacrifice (Sacrifice Bunt) : l'attaquant accepte de se faire éliminer pour faire marquer ou progresser un coéquipier sans pénaliser sa moyenne au bâton.</span>
              </div>
            </div>
          </div>

          {/* 5. LE LOSANGE INTERACTIF DES BASES */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 space-y-2 text-xs sm:text-sm">
            <h4 className="font-black text-amber-950 flex items-center gap-2">
              ⚾ Losange des Coureurs (1B, 2B, 3B)
            </h4>
            <p className="text-slate-700 font-medium">
              Lorsqu'un coureur est sur base (losange rouge), <strong>touchez simplement la base sur l'écran</strong> pour ouvrir le menu d'avancement manuel :
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-800 font-semibold pl-2">
              <li><strong>Avancer en 2B ou 3B</strong> : lors d'un vol de but (SB), d'une balle passée (PB) ou d'un mauvais lancer (WP).</li>
              <li><strong>Marquer au marbre</strong> : crédite immédiatement +1 point à l'équipe.</li>
              <li><strong>Retrait sur base</strong> : en cas de tentative de vol ratée (CS) ou de pickoff du lanceur (PO).</li>
            </ul>
          </div>

          {/* 6. UNDO / REDO */}
          <div className="p-4 rounded-2xl bg-slate-100 border border-slate-300 flex items-start gap-3 text-xs sm:text-sm">
            <RotateCcw className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-black text-slate-900">Bouton « Annuler » (Undo) sans limite</h4>
              <p className="text-slate-700 font-medium">
                Une mauvaise touche sur le terrain ? Cliquez à tout moment sur <strong>Annuler</strong> en haut à droite. L'état exact du match (compte, coureurs, points, statistiques) est instantanément restauré en arrière.
              </p>
            </div>
          </div>

        </div>

        {/* Pied de modale */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-sm shadow transition active:scale-95"
          >
            J'ai compris, retour au match
          </button>
        </div>

      </div>
    </div>
  );
};
