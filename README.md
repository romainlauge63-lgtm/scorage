# ⚾ Scorage - PWA Baseball & Softball France

Application Web Progressive (PWA) de scorage en direct pour le **Baseball** et le **Softball**, conçue sur mesure pour les **scoreurs de clubs** et les **coachs** en France (conforme aux règlements FFBS / WBSC).

---

## 🚀 Démarrage Rapide

Dans le terminal, lancez :

```bash
# Démarrer le serveur de développement local
npm run dev

# Exécuter les tests unitaires des règles de jeu
npm test

# Compiler pour la production et générer le Service Worker PWA
npm run build
```

Ouvrez l'URL affichée par Vite (généralement `http://localhost:5173`) sur votre navigateur ou directement sur tablette / smartphone.

---

## 📱 Installation en PWA (Mode 100% Hors-Ligne)

1. Ouvrez l'application sur **Chrome** (Android / PC / Mac) ou **Safari** (iPad / iPhone).
2. Cliquez sur **"Installer l'application"** ou **"Ajouter à l'écran d'accueil"**.
3. L'application est installée comme une application native.
4. **Offline-First** : Même en coupant le Wi-Fi et les données mobiles (4G/5G) au milieu du terrain, tous les scores sont persistés en continu dans le stockage local du navigateur.

---

## 🌟 Fonctionnalités Implémentées

### 1. Configuration d'Avant-Match (`Équipes & Line-ups`)
- Choix de la discipline : **Baseball (9 manches)** ou **Softball (7 manches)**.
- Saisie des deux équipes (Visiteurs et Locaux).
- **Line-up des 9 titulaires** :
  - Ordre au bâton (1 à 9).
  - Nom & prénom du joueur.
  - Numéro de maillot.
  - Position défensive (1 à 9 et 10: DH) :
    - `1` : Lanceur (P)
    - `2` : Receveur (C)
    - `3` : 1ère Base (1B)
    - `4` : 2ème Base (2B)
    - `5` : 3ème Base (3B)
    - `6` : Arrêt-court (SS)
    - `7` : Champ Gauche (LF)
    - `8` : Champ Centre (CF)
    - `9` : Champ Droit (RF)
    - `10` : Frappeur Désigné (DH)
- **Gestion du banc & des remplaçants** : ajout et suppression dynamique de réservistes.
- **Bouton Match Démo** : charge instantanément une rencontre d'exemple (*Paris Université Club (PUC)* vs *Huskies de Rouen 76*).

### 2. Interface de Scorage en Direct (`Direct`)
- **Tableau des manches (Line Score)** : R, H, E par manche avec mise en valeur de la demi-manche active (Haut ▲ / Bas ▼).
- **Compte B-S-O (Balles, Prises, Retraits)** : jauge visuelle à fort contraste (vert, jaune, rouge).
- **Losange interactif SVG** :
  - Visualisation des coureurs sur 1B, 2B, 3B avec badges des noms et maillots.
  - Menu contextuel tactile pour faire avancer un coureur (vol de but, balle passée, point marqué au marbre).
- **Duel en cours** : Fiche du batteur au bâton (stats du jour H/AB, RBI) vs Lanceur au monticule (décompte de lancers, retraits sur 3 prises, coups sûrs concédés).
- **Pavé tactile rapide** :
  - *Lancers* : Balle, Prise regardée (Called Strike), Prise balancée (Swinging Strike), Fausse balle (Foul).
  - *Frappes* : Simple (1B), Double (2B), Triple (3B), Coup de circuit (Home Run).
  - *Retraits* : Retrait sur 3 prises (K), Roulant (Groundout), Ballon (Flyout), Ligne (Lineout).
  - *Spéciaux* : But sur balles (BB), Mort sur balles (HBP), Erreur défensive (E), Sacrifices (SF / SH).
- **Undo / Redo instantané** : annulation sans limite de la moindre erreur de saisie.

### 3. Gestion des Changements (`Changements`)
- Enregistrement des substitutions en cours de partie :
  - Changement de lanceur (mise à jour automatique de la fiche lanceur).
  - Frappeur d'urgence (Pinch Hitter).
  - Coureur d'urgence (Pinch Runner).
  - Permutation défensive de position.
- Journal officiel des substitutions horodatées avec manche et demi-manche.

### 4. Feuille de Match & Box Score (`Feuille de Match`)
- Tableau d'attaque complet par équipe : AB, R, H, RBI, BB, SO, HR, AVG.
- Tableau des lanceurs : IP (Manches lancées ex: 4.1), H, R, ER, BB, SO, Nombre de lancers.
- **Export & Impression** :
  - Bouton **"Imprimer / PDF"** configuré avec feuille de style print dédiée pour générer la feuille de match officielle.
  - Bouton **"Exporter JSON"** pour sauvegarder ou synchroniser avec un serveur externe.

---

## 🛠️ Architecture Technique

```
src/
├── types/
│   └── baseball.ts          # Définitions TypeScript complètes
├── engine/
│   ├── gameEngine.ts        # Machine à états (avancée des coureurs, règles des 3 outs)
│   ├── gameEngine.test.ts   # Suite de tests unitaires automatisés
│   ├── statsEngine.ts       # Calcul des statistiques offensives et défensives
│   └── sampleData.ts        # Roster de test réaliste
├── store/
│   └── useGameStore.ts      # Store Zustand + persistance localStorage
├── components/
│   ├── common/              # Barre de navigation & Undo/Redo
│   ├── live/                # Scoreboard, B-S-O, Diamond SVG, ActionPad, PlaysTimeline
│   ├── setup/               # Configuration 9 titulaires, postes 1-9, banc
│   ├── substitutions/       # Modale de changement en cours de match
│   └── boxscore/            # Box Score officiel et impression PDF
└── App.tsx                  # Orchestration principale
```
