// TEL — Specialized Vocal API Sentinel
// Audits speech recognition bindings on the frontend, fallbacks, and UI components.

import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync, readFileSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '../..')

export interface VocalReport {
  speechBindingsValid: boolean
  hasRichErrorHandling: boolean
  hasBrowserDiagnostics: boolean
  message: string
  recommendations: string[]
}

export async function auditVocalSpeech(): Promise<VocalReport> {
  const recommendations: string[] = []
  let speechBindingsValid = false
  let hasRichErrorHandling = false
  let hasBrowserDiagnostics = false

  const sourceInputPath = join(ROOT, 'components/SourceInput.tsx')
  if (existsSync(sourceInputPath)) {
    const content = readFileSync(sourceInputPath, 'utf-8')
    
    // Check SpeechRecognition constructor
    if (content.includes('SpeechRecognitionCtor') || content.includes('webkitSpeechRecognition')) {
      speechBindingsValid = true
    }
    
    // Check error handling
    if (content.includes('not-allowed') || content.includes('no-speech') || content.includes('audio-capture')) {
      hasRichErrorHandling = true
    }

    if (content.includes('setError') && content.includes('webkitSpeechRecognition')) {
      hasBrowserDiagnostics = true
    }
  } else {
    recommendations.push("Composant SourceInput.tsx introuvable.")
  }

  if (!speechBindingsValid) {
    recommendations.push("Le constructeur SpeechRecognition ou webkitSpeechRecognition est manquant dans SourceInput.")
  }
  if (!hasRichErrorHandling) {
    recommendations.push("Le bouton vocal échoue silencieusement car les pièges d'erreurs (microphone bloqué, absent) ne sont pas gérés.")
  }

  return {
    speechBindingsValid,
    hasRichErrorHandling,
    hasBrowserDiagnostics,
    message: hasRichErrorHandling 
      ? "L'interface vocale dispose d'un système robuste de diagnostics et d'alertes en cas d'erreur de périphérique."
      : "Vulnérabilités de l'interface vocale détectées : les erreurs de capture échouent en silence.",
    recommendations
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  auditVocalSpeech().then(report => {
    console.log(JSON.stringify(report, null, 2))
  })
}
