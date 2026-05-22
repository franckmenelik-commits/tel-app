// TEL — Specialized Geo & Context Sentinel
// Audits geographic context inference coverage and recommends regex updates.

import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync, readFileSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '../..')

export interface GeoReport {
  dictionarySize: number
  hasAfricanCoverage: boolean
  hasGlobalSouthCoverage: boolean
  redundantPatterns: string[]
  message: string
  recommendations: string[]
}

export async function auditGeoContext(): Promise<GeoReport> {
  const recommendations: string[] = []
  const redundant: string[] = []
  let dictSize = 0
  let hasAfrica = false
  let hasGlobalSouth = false

  const soufflePath = join(ROOT, 'lib/souffle.ts')
  if (existsSync(soufflePath)) {
    const content = readFileSync(soufflePath, 'utf-8')
    
    // Parse how many countryPatterns we have by matching array lines
    const lines = content.split('\n')
    const patternLines = lines.filter(line => line.includes('pattern:') && line.includes('country:'))
    dictSize = patternLines.length
    
    if (dictSize > 0) {
      const patternText = patternLines.join('\n').toLowerCase()
      
      // Check for regions
      if (patternText.includes('afrique') || patternText.includes('cameroun') || patternText.includes('sénégal')) {
        hasAfrica = true
      }
      if (patternText.includes('vietnam') || patternText.includes('haïti') || patternText.includes('colombie')) {
        hasGlobalSouth = true
      }
    } else {
      recommendations.push("Le dictionnaire d'inférence géographique n'a pas pu être lu depuis lib/souffle.ts.")
    }
  } else {
    recommendations.push("Fichier lib/souffle.ts introuvable.")
  }

  // Generate automated suggestions if dictionary is too small
  if (dictSize < 20) {
    recommendations.push("Le dictionnaire géographique est restreint. Pensez à l'enrichir pour éviter le fallback 'Indéterminé'.")
  }
  if (!hasAfrica) {
    recommendations.push("Aucune règle de détection pour l'Afrique n'a été détectée. Ajoutez des patterns pour le Sénégal, Cameroun, RDC, Côte d'Ivoire.")
  }
  if (!hasGlobalSouth) {
    recommendations.push("Les perspectives du Sud Global (Caraïbes, Amérique Latine, Asie du Sud-Est) manquent de précision dans les regex.")
  }

  return {
    dictionarySize: dictSize,
    hasAfricanCoverage: hasAfrica,
    hasGlobalSouthCoverage: hasGlobalSouth,
    redundantPatterns: redundant,
    message: dictSize > 25 
      ? `Couverture géographique solide : ${dictSize} pays et régions modélisés avec inférence multi-couches.`
      : `Dictionnaire géographique partiel (${dictSize} règles).`,
    recommendations
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  auditGeoContext().then(report => {
    console.log(JSON.stringify(report, null, 2))
  })
}
