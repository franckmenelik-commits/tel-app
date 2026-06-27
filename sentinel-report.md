# 🛡️ TEL Sentinel — Rapport de Santé Quotidien

> **Généré le :** 27/06/2026 13:55:45
> **Statut global :** 75% opérationnel • Diagnostic complété en 41ms

---

## 📊 Tableau de Bord des Tourmentes

| Composant surveillé | Statut | Risque identifié | Niveau de Confiance |
| :--- | :---: | :--- | :---: |
| **Transcription Whisper** | 🔴 INDISPONIBLE | fallback métadonnées silencieux | 30% |
| **Localisation & Qualité** | 🟢 SAIN | dérives et leaks en anglais | 95% |
| **Inférence Géographique** | 🟢 SAIN | fallback 'Indéterminé' | 90% |
| **Capture Vocale (Speech)** | 🟢 SAIN | pannes de micro silencieuses | 95% |

---

## 🔍 Diagnostics Détaillés

### 🎙️ 1. Agent Whisper
* **Endpoint configuré :** `http://127.0.0.1:9000`
* **Latence de réponse :** 38ms
* **Statut de diagnostic :** Le serveur ne répond pas correctement (HTTP Aucune réponse)
* **⚠️ Action requise :** Assurez-vous que le serveur Whisper local est démarré : run-whisper ou docker run -p 9000:9000.

### ✍️ 2. Agent Qualité & Localisation (SOUFFLE)
* **Instruction de langue FR :** 🟢 Active & Explicite
* **Niveaux SOUFFLE présents :**
  - **Niveau 1 (L'Écoute) :** ✓ OK
  - **Niveau 2 (La Traversée) :** ✓ OK
  - **Niveau 3 (La Révélation) :** ✓ OK
* **Leaks détectés :** Aucun leak détecté.

### 🌍 3. Agent Inférence Géographique
* **Taille du dictionnaire regex :** 39 pays et sous-continents modélisés
* **Inférence multi-couches :** active (Pays + Sous-région + Langue)
* **Couverture de l'Afrique :** 🟢 Assurée (Cameroun, Sénégal, Congo, Afrique de l'Ouest, Nord, Centrale)
* **Couverture du Sud Global :** 🟢 Assurée
* **✓ Statut :** Parfaite couverture.

### 🎤 4. Agent Capture Vocale Frontend
* **SpeechRecognition API :** 🟢 Correctement liée
* **Gestion anti-pannes silencieuses :** 🟢 Gérée avec retours utilisateur
* **✓ Statut :** Prêt à capter la parole.

---

## 💡 Plan d'Action Sentinel pour Franck
1. **Redémarrez le conteneur Whisper local** ou configurez un Whisper Cloud (OpenAI/Replicate) pour rétablir 100% de la qualité de croisement des vidéos YouTube.
2. Les prompts SOUFFLE sont parfaitement localisés.
3. La couverture géodécisionnelle est robuste.
4. L'interface vocale est sécurisée contre les échecs silencieux.

## 🔧 Auto-Healer — Correctifs en 1 clic

### 🎙️ Dépannage Whisper Local
Si ton conteneur Docker Whisper local s'est arrêté, lance cette commande dans ton terminal :
```bash
docker run -d -p 9000:9000 -v /tmp/whisper:/root/.cache/whisper companion-whisper-local
```

### ☁️ Patch Fallback Cloud (.env.local)
Pour passer automatiquement de Whisper Local au Cloud (OpenAI) sans interrompre le service, modifie ton fichier `.env.local` :
```diff
- WHISPER_API_URL="http://127.0.0.1:9000"
+ WHISPER_API_URL="https://api.openai.com/v1"
+ WHISPER_API_KEY="sk-proj-xxxx" # Insère ta clé OpenAI
```
