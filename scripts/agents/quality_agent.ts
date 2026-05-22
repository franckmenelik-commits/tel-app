// TEL — Specialized Quality & Localization Agent
// Validates SOUFFLE crossing prompts, translation consistency, and guards against language leaks.

import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync, readFileSync } from 'fs'
import { buildLangInstruction } from '../../lib/prompt'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '../..')

export interface QualityReport {
  promptStructureHealthy: boolean
  frInstructionValid: boolean
  potentialLeaks: string[]
  n1PromptCheck: string
  n2PromptCheck: string
  n3PromptCheck: string
  message: string
}

export async function checkQualityAndLocalization(): Promise<QualityReport> {
  const leaks: string[] = []
  let promptStructureHealthy = true

  // 1. Verify that buildLangInstruction actually returns French explicit rule when 'fr' is passed
  const frInstruction = buildLangInstruction('fr')
  const hasExplicitFR = frInstruction.includes('Réponds ENTIÈREMENT en français') || frInstruction.includes('français')
  
  if (!hasExplicitFR) {
    leaks.push("L'instruction de langue en français ('fr') n'est pas explicite ou a été écrasée.")
    promptStructureHealthy = false
  }

  // 2. Read prompt.ts template directly to check for hardcoded English defaults in fields
  const promptPath = join(ROOT, 'lib/prompt.ts')
  let promptContent = ''
  if (existsSync(promptPath)) {
    promptContent = readFileSync(promptPath, 'utf-8')
    // Check if the prompt has any suspicious strings suggesting the main question could default to English
    if (promptContent.includes('Respond in English unless requested otherwise')) {
      leaks.push("Le prompt contient une clause de secours par défaut en anglais qui peut court-circuiter l'instruction française.")
    }
  } else {
    leaks.push("Fichier lib/prompt.ts introuvable.")
    promptStructureHealthy = false
  }

  // 3. Simulates crossing structures of N1, N2, and N3
  const hasN1 = promptContent.includes('buildNiveau1CrossingPrompt')
  const hasN2 = promptContent.includes('buildNiveau2CrossingPrompt') || promptContent.includes('buildNiveau2EnrichmentPrompt')
  const hasN3 = promptContent.includes('buildNiveau3AnglesMortsPrompt') || promptContent.includes('buildNiveau3')

  return {
    promptStructureHealthy,
    frInstructionValid: hasExplicitFR,
    potentialLeaks: leaks,
    n1PromptCheck: hasN1 ? 'VALID' : 'MISSING',
    n2PromptCheck: hasN2 ? 'VALID' : 'MISSING',
    n3PromptCheck: hasN3 ? 'VALID' : 'MISSING',
    message: leaks.length === 0 
      ? 'La structure des prompts et la localisation française sont parfaitement configurées.'
      : `Vulnérabilités de qualité détectées : ${leaks.join(', ')}`
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  checkQualityAndLocalization().then(report => {
    console.log(JSON.stringify(report, null, 2))
  })
}
