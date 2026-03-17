# TEL — The Experience Layer

> *"Babel a dispersé les langages. TEL rassemble les vécus."*

TEL est un système de **Narrative Intelligence Cross-Culturelle**. Il ne croise pas des informations — il croise des **vécus humains** documentés pour révéler la sagesse collective invisible.

---

## SOUFFLE — Architecture IA à 3 niveaux

TEL utilise le système **SOUFFLE** : trois niveaux de présence IA, activés progressivement selon la profondeur du croisement requis.

```
NIVEAU 1 — L'ÉCOUTE      → Mistral local via Ollama  (gratuit, souverain)
NIVEAU 2 — LA TRAVERSÉE  → Mistral API               (croisements profonds)
NIVEAU 3 — LA RÉVÉLATION → Claude Anthropic           (l'indicible, cas premium)
```

L'utilisateur ne voit jamais "Mistral" ou "Claude". Il voit **LOGOS** — et un indicateur de profondeur (•, ••, •••).

---

## Installation

### Prérequis

- Node.js ≥ 20 (via nvm recommandé)
- Au moins un niveau SOUFFLE configuré (voir ci-dessous)

### Cloner et installer

```bash
git clone https://github.com/votrecompte/the-experience-layer.git
cd the-experience-layer
npm install
cp .env.example .env.local
```

---

## Configurer SOUFFLE

### NIVEAU 1 — L'Écoute (recommandé pour commencer)

Ollama tourne localement sur votre machine. **Gratuit. Souverain. Aucune donnée envoyée à l'extérieur.**

```bash
# Installer Ollama
brew install ollama
# ou télécharger depuis https://ollama.com

# Démarrer Ollama
ollama serve

# Tirer le modèle Mistral (une seule fois, ~4.1 Go)
ollama pull mistral
```

Ollama démarre automatiquement sur `http://localhost:11434`.

### NIVEAU 2 — La Traversée

Pour les croisements profonds (3+ sources, contextes culturels complexes).

1. Créez un compte sur [console.mistral.ai](https://console.mistral.ai)
2. Générez une clé API
3. Ajoutez dans `.env.local` :
```
MISTRAL_API_KEY=votre-clé-ici
```

### NIVEAU 3 — La Révélation

Pour les cas premium : langues en danger, vécus traumatiques, décisions institutionnelles.

1. Créez un compte sur [console.anthropic.com](https://console.anthropic.com)
2. Générez une clé API
3. Ajoutez dans `.env.local` :
```
ANTHROPIC_API_KEY=sk-ant-votre-clé-ici
```

---

## Vérifier la configuration

```bash
npm run check-souffle
```

Exemple de sortie :
```
TEL — SOUFFLE System Check
═══════════════════════════════

NIVEAU 1 — L'ÉCOUTE (Ollama local — gratuit, souverain)
  ✓ Ollama actif — http://localhost:11434
  ✓ Modèle mistral disponible — mistral:latest

NIVEAU 2 — LA TRAVERSÉE (Mistral API — croisements profonds)
  ✓ MISTRAL_API_KEY valide

NIVEAU 3 — LA RÉVÉLATION (Claude Anthropic — l'indicible)
  ✓ ANTHROPIC_API_KEY valide

═══════════════════════════════
SOUFFLE complet (3/3 niveaux actifs)
TEL peut croiser des vécus à tous les niveaux de profondeur.
```

---

## Lancer en développement

```bash
npm run dev
# Ouvrez http://localhost:3000
```

---

## Logique de routage SOUFFLE

```
2 sources + exploration          → NIVEAU 1 (gratuit, local)
3+ sources ou culturel_profond   → NIVEAU 1 + 2
institutionnel / langue_en_danger / vecu_traumatique → NIVEAU 1 + 2 + 3
```

**Fallback intelligent** :
- Ollama indisponible → Mistral API
- Mistral API indisponible → Claude
- Tout indisponible → message honnête : *"TEL nécessite au moins un modèle actif"*

---

## L'Insight Card — 9 sections

Chaque croisement produit une carte à 9 sections :

1. **Thème du croisement**
2. **Sources croisées** — type, contexte géographique, niveau de confiance
3. **Le pattern révélé** — ce qu'aucune source ne voit seule
4. **Zones de convergence** — ce qui se ressemble
5. **Zones de divergence irréductible** — ce qui ne peut pas être réconcilié
6. **Niveau de confiance global**
7. **Représentativité géographique** — les silences aussi
8. **L'indicible** — ce que le croisement ne peut pas capturer
9. **La question que personne n'a encore posée**

---

## Sources supportées

| Type | Extraction |
|------|-----------|
| YouTube | Transcription automatique (ou métadonnées si désactivée) |
| Wikipedia | API REST Wikipedia |
| Articles | Cheerio — extraction du contenu principal |
| Instagram | Open Graph tags (accès limité) |
| PDFs | Métadonnées et contenu textuel |
| Autres | Extraction HTML générique |

---

## Déploiement (Coolify / Hetzner Helsinki)

```bash
npm run build
npm start
```

Variables d'environnement requises sur le serveur :
```
ANTHROPIC_API_KEY=
MISTRAL_API_KEY=
NEXT_PUBLIC_APP_URL=https://theexperiencelayer.org
```

Note : Le Niveau 1 (Ollama local) n'est pas disponible en production serverless. Configurez au minimum le Niveau 2 pour les déploiements distants.

---

## Philosophie

> *"Les limites de mon langage sont les limites de mon monde."*
> — Wittgenstein

TEL ne produit pas de vérités universelles. Il produit des **cartographies honnêtes** de différences et ressemblances.

Les silences (zones sans données) sont affichés, pas cachés. Ce que TEL ne peut pas capturer est toujours nommé. La diversité géographique est toujours indiquée.

**Avant d'être une donnée pour un algorithme, une personne est un être humain. TEL est construit sur ce principe. Ou il ne vaut rien.**

---

## Phase 2 (à venir)

- Persistance des croisements via Supabase
- Recherche sémantique via pgvector
- Living Map en temps réel (Supabase Realtime)
- Croisement de groupes entiers de sources
- API publique TEL

---

*Helsinki · Hetzner · Infrastructure éthique — pas AWS, pas Google Cloud.*
