/**
 * TEL — The Experience Layer
 * lib/export.ts — Génération de rapports pour la Dignité Humaine (ONG/Activistes)
 */

import { LogosInsightResponse } from './types'

interface ReportSource {
  title: string
  geographicContext?: string
  content?: string
}

export function generateDignityReport(
  insight: LogosInsightResponse,
  sources: ReportSource[]
): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const sourcesList = sources
    .map((s, i) => `[${i + 1}] ${s.title} (${s.geographicContext || 'Souverain'})`)
    .join('\n')

  return `
# 🛡️ RAPPORT POUR LA DIGNITÉ HUMAINE
**Généré par TEL — The Experience Layer**
**Date :** ${date}
**Référence :** tel-${Date.now()}

---

## 🏛️ THÈME : ${insight.theme}

### 🔍 LE PATTERN RÉVÉLÉ
${insight.revealedPattern}

---

## ⚖️ ANALYSE DES TENSIONS

### 🤝 Zones de Convergence
${insight.convergenceZones.map(z => `- ${z}`).join('\n')}

### ⚡ Zones de Divergence Irréductible
${insight.divergenceZones.map(z => `- ${z}`).join('\n')}

### 🛡️ Tension de Souveraineté (L'Irréconciliable)
> ${insight.irreconcilable}

---

## 🌑 L'INDICIBLE & L'ANGLE MORT
**L'Indicible :** ${insight.theUnspeakable}

**La Question que personne n'a encore posée :** 
${insight.questionNoOneHasAsked}

---

## 🚀 PISTES D'ACTION

#### 👤 Pour l'Individu
${insight.actionables?.individu ?? 'Non disponible'}

#### 🔬 Pour le Chercheur / Praticien
${insight.actionables?.chercheur ?? 'Non disponible'}

#### 🏛️ Pour l'Institution / ONG
${insight.actionables?.institution ?? 'Non disponible'}

---

## 📚 SOURCES CROISÉES
${sourcesList}

---
*Ce rapport est un outil de protection et de valorisation du vécu humain. Il a été généré dans un cadre de souveraineté technologique (Law Zero).*
`.trim()
}

export function downloadFile(content: string, filename: string, contentType: string) {
  const blob = new Blob([content], { type: contentType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
