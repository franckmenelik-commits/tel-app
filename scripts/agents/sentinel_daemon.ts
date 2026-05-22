// TEL — Sentinel Daemon & Orchestrator
// Runs all specialized health agents and writes the consolidated Daily Status Report to Obsidian Vault.

import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync, writeFileSync, mkdirSync } from 'fs'

// Import specialized check functions
import { checkWhisperHealth } from './whisper_agent'
import { checkQualityAndLocalization } from './quality_agent'
import { auditGeoContext } from './geo_sentinel'
import { auditVocalSpeech } from './vocal_sentinel'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '../..')
const OBSIDIAN_VAULT_PATH = '/Users/franckmenelikafaneeko/Desktop/Projets/Obsidian Vault'

async function runSentinel() {
  console.log('⚡ Démarrage du Sentinel Daemon...')
  
  const startTime = Date.now()

  // 1. Run checks in parallel
  const [whisper, quality, geo, vocal] = await Promise.all([
    checkWhisperHealth(),
    checkQualityAndLocalization(),
    auditGeoContext(),
    auditVocalSpeech()
  ])

  const durationMs = Date.now() - startTime

  // 2. Compute overall health
  const whisperHealthy = whisper.healthy
  const qualityHealthy = quality.promptStructureHealthy && quality.frInstructionValid
  const geoHealthy = geo.dictionarySize >= 20
  const vocalHealthy = vocal.speechBindingsValid && vocal.hasRichErrorHandling

  const activeCheckpoints = [whisperHealthy, qualityHealthy, geoHealthy, vocalHealthy]
  const successCount = activeCheckpoints.filter(Boolean).length
  const healthPercent = Math.round((successCount / activeCheckpoints.length) * 100)

  // 3. Construct premium report Markdown content
  const reportDate = new Date().toLocaleString('fr-FR', { timeZone: 'America/New_York' })
  const markdown = `# 🛡️ TEL Sentinel — Rapport de Santé Quotidien

> **Généré le :** ${reportDate}
> **Statut global :** ${healthPercent}% opérationnel • Diagnostic complété en ${durationMs}ms

---

## 📊 Tableau de Bord des Tourmentes

| Composant surveillé | Statut | Risque identifié | Niveau de Confiance |
| :--- | :---: | :--- | :---: |
| **Transcription Whisper** | ${whisperHealthy ? '🟢 SAIN' : '🔴 INDISPONIBLE'} | fallback métadonnées silencieux | ${whisperHealthy ? '98%' : '30%'} |
| **Localisation & Qualité** | ${qualityHealthy ? '🟢 SAIN' : '🟡 FRAGILE'} | dérives et leaks en anglais | ${qualityHealthy ? '95%' : '60%'} |
| **Inférence Géographique** | ${geoHealthy ? '🟢 SAIN' : '🟡 INCOMPLET'} | fallback 'Indéterminé' | ${geoHealthy ? '90%' : '50%'} |
| **Capture Vocale (Speech)** | ${vocalHealthy ? '🟢 SAIN' : '🔴 ERREUR'} | pannes de micro silencieuses | ${vocalHealthy ? '95%' : '40%'} |

---

## 🔍 Diagnostics Détaillés

### 🎙️ 1. Agent Whisper
* **Endpoint configuré :** \`${whisper.url}\`
* **Latence de réponse :** ${whisper.latencyMs}ms
* **Statut de diagnostic :** ${whisper.message}
${whisper.recommendation ? `* **⚠️ Action requise :** ${whisper.recommendation}` : '* **✓ Statut :** Parfaitement connecté. La transcription complète des vidéos YouTube sans sous-titres est pleinement opérationnelle.'}

### ✍️ 2. Agent Qualité & Localisation (SOUFFLE)
* **Instruction de langue FR :** ${quality.frInstructionValid ? '🟢 Active & Explicite' : '🔴 Manquante ou écrasée'}
* **Niveaux SOUFFLE présents :**
  - **Niveau 1 (L\'Écoute) :** ${quality.n1PromptCheck === 'VALID' ? '✓ OK' : '✗ Manquant'}
  - **Niveau 2 (La Traversée) :** ${quality.n2PromptCheck === 'VALID' ? '✓ OK' : '✗ Manquant'}
  - **Niveau 3 (La Révélation) :** ${quality.n3PromptCheck === 'VALID' ? '✓ OK' : '✗ Manquant'}
* **Leaks détectés :** ${quality.potentialLeaks.length === 0 ? 'Aucun leak détecté.' : quality.potentialLeaks.join(', ')}

### 🌍 3. Agent Inférence Géographique
* **Taille du dictionnaire regex :** ${geo.dictionarySize} pays et sous-continents modélisés
* **Inférence multi-couches :** active (Pays + Sous-région + Langue)
* **Couverture de l\'Afrique :** ${geo.hasAfricanCoverage ? '🟢 Assurée (Cameroun, Sénégal, Congo, Afrique de l\'Ouest, Nord, Centrale)' : '🔴 Manquante'}
* **Couverture du Sud Global :** ${geo.hasGlobalSouthCoverage ? '🟢 Assurée' : '🔴 Manquante'}
${geo.recommendations.length > 0 ? `* **Suggestions d'optimisation :**\n${geo.recommendations.map(r => `  - ${r}`).join('\n')}` : '* **✓ Statut :** Parfaite couverture.'}

### 🎤 4. Agent Capture Vocale Frontend
* **SpeechRecognition API :** ${vocal.speechBindingsValid ? '🟢 Correctement liée' : '🔴 Manquante ou brisée'}
* **Gestion anti-pannes silencieuses :** ${vocal.hasRichErrorHandling ? '🟢 Gérée avec retours utilisateur' : '🔴 Non gérée'}
${vocal.recommendations.length > 0 ? `* **⚠️ Action requise :**\n${vocal.recommendations.map(r => `  - ${r}`).join('\n')}` : '* **✓ Statut :** Prêt à capter la parole.'}

---

## 💡 Plan d'Action Sentinel pour Franck
${
  healthPercent === 100 
    ? '🎉 **Félicitations !** Toutes les tourmentes de TEL sont parfaitement maîtrisées. Le système est stable, souverain et prêt pour la production.'
    : `1. ${!whisperHealthy ? '**Redémarrez le conteneur Whisper local** ou configurez un Whisper Cloud (OpenAI/Replicate) pour rétablir 100% de la qualité de croisement des vidéos YouTube.' : 'Whisper est actif et opérationnel.'}
2. ${!qualityHealthy ? '**Réparez les instructions de langue dans \`lib/prompt.ts\`** pour éviter les leaks et le glissement vers l\'anglais.' : 'Les prompts SOUFFLE sont parfaitement localisés.'}
3. ${geo.recommendations.length > 0 ? '**Enrichissez les regex géographiques** de \`lib/souffle.ts\` selon les recommandations ci-dessus.' : 'La couverture géodécisionnelle est robuste.'}
4. ${!vocalHealthy ? '**Vérifiez les liaisons du micro** dans \`SourceInput.tsx\`.' : 'L\'interface vocale est sécurisée contre les échecs silencieux.'}`
}
`

  // Append Auto-Healer advice if whisper is down
  let autoHealerContent = '\n## 🔧 Auto-Healer — Correctifs en 1 clic\n'
  if (!whisperHealthy) {
    autoHealerContent += `
### 🎙️ Dépannage Whisper Local
Si ton conteneur Docker Whisper local s'est arrêté, lance cette commande dans ton terminal :
\`\`\`bash
docker run -d -p 9000:9000 -v /tmp/whisper:/root/.cache/whisper companion-whisper-local
\`\`\`

### ☁️ Patch Fallback Cloud (.env.local)
Pour passer automatiquement de Whisper Local au Cloud (OpenAI) sans interrompre le service, modifie ton fichier \`.env.local\` :
\`\`\`diff
- WHISPER_API_URL="http://127.0.0.1:9000"
+ WHISPER_API_URL="https://api.openai.com/v1"
+ WHISPER_API_KEY="sk-proj-xxxx" # Insère ta clé OpenAI
\`\`\`
`
  } else {
    autoHealerContent += '✓ Aucun correctif automatique requis pour Whisper.\n'
  }

  const finalMarkdown = markdown + autoHealerContent

  // 4. Write to Obsidian Vault directly
  const obsidianReportDir = join(OBSIDIAN_VAULT_PATH, 'wiki/analyses')
  const obsidianReportPath = join(obsidianReportDir, 'tel-agent-report.md')

  try {
    if (existsSync(OBSIDIAN_VAULT_PATH)) {
      if (!existsSync(obsidianReportDir)) {
        mkdirSync(obsidianReportDir, { recursive: true })
      }
      writeFileSync(obsidianReportPath, finalMarkdown, 'utf-8')
      console.log(`✓ Rapport Sentinel quotidien écrit avec succès dans Obsidian : ${obsidianReportPath}`)
    } else {
      console.log(`⚠️ Chemin Obsidian introuvable : ${OBSIDIAN_VAULT_PATH}. Écrit localement.`)
    }
  } catch (err: any) {
    console.error(`Erreur d'écriture dans l'Obsidian Vault : ${err.message}`)
  }

  // Also write locally to root for fallback
  const localReportPath = join(ROOT, 'sentinel-report.md')
  writeFileSync(localReportPath, finalMarkdown, 'utf-8')
  console.log(`✓ Rapport Sentinel écrit localement : ${localReportPath}`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runSentinel()
}
