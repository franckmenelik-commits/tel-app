/**
 * TEL — The Experience Layer
 * lib/shield-templates.ts — Bouclier RGPD : templates d'emails juridiques
 * 
 * Law Zero : la machine qui protège l'humain contre la machine.
 */

export interface ShieldTarget {
  name: string
  email_dpo: string
  email_privacy: string
  data_export_url?: string
  disable_training_path?: string
  known_violations: string[]
}

export const SHIELD_TARGETS: Record<string, ShieldTarget> = {
  openai: {
    name: 'OpenAI (ChatGPT)',
    email_dpo: 'dsar@openai.com',
    email_privacy: 'privacy@openai.com',
    data_export_url: 'https://chatgpt.com/#settings/DataControls',
    disable_training_path: 'Paramètres → Contrôle de données → Améliorer le modèle pour tous → Désactiver',
    known_violations: [
      'Amende de 15M€ en Italie (annulée en appel mars 2026)',
      'Violation confirmée par le Canada (mai 2026, sans sanction)',
      'Collecte de données de navigation sans consentement explicite',
    ],
  },
  meta: {
    name: 'Meta (Facebook, Instagram, WhatsApp)',
    email_dpo: 'dpo@fb.com',
    email_privacy: 'privacy@fb.com',
    data_export_url: 'https://www.facebook.com/dyi',
    known_violations: [
      'Amende RGPD de 1,2 milliard € (mai 2023)',
      'Transferts de données UE→US sans base légale',
      'Entraînement IA sur les posts publics sans opt-in',
    ],
  },
  google: {
    name: 'Google (Gmail, YouTube, Search, Gemini)',
    email_dpo: 'data-protection-office@google.com',
    email_privacy: 'privacy@google.com',
    data_export_url: 'https://takeout.google.com',
    known_violations: [
      'Amende CNIL de 150M€ (cookies, 2022)',
      'Collecte de données de localisation sans consentement',
      'Utilisation des emails Gmail pour le ciblage publicitaire',
    ],
  },
  x_twitter: {
    name: 'X (ex-Twitter)',
    email_dpo: 'dpo@x.com',
    email_privacy: 'privacy@x.com',
    data_export_url: 'https://x.com/settings/download_your_data',
    known_violations: [
      'Entraînement de Grok sur les tweets sans consentement opt-in',
      'Partage de données avec des tiers sans transparence',
    ],
  },
  tiktok: {
    name: 'TikTok (ByteDance)',
    email_dpo: 'dpo@tiktok.com',
    email_privacy: 'privacy@tiktok.com',
    data_export_url: 'https://www.tiktok.com/setting/download-your-data',
    known_violations: [
      'Amende RGPD de 345M€ pour traitement de données de mineurs (2023)',
      'Transferts de données vers la Chine sans base légale',
    ],
  },
  amazon: {
    name: 'Amazon (AWS, Alexa, Prime)',
    email_dpo: 'eu-privacy@amazon.com',
    email_privacy: 'privacy@amazon.com',
    data_export_url: 'https://www.amazon.com/gp/privacycentral/dsar/preview.html',
    known_violations: [
      'Amende RGPD de 746M€ au Luxembourg (2021)',
      'Collecte de données vocales Alexa sans consentement clair',
    ],
  },
  microsoft: {
    name: 'Microsoft (Outlook, Copilot, LinkedIn)',
    email_dpo: 'DPO@microsoft.com',
    email_privacy: 'privacy@microsoft.com',
    data_export_url: 'https://account.microsoft.com/privacy/download-data',
    known_violations: [
      'Utilisation des données Office 365 pour entraîner Copilot',
      'Enquêtes CNIL en cours sur Bing Chat / Copilot',
    ],
  },
  apple: {
    name: 'Apple (iCloud, Siri, App Store)',
    email_dpo: 'dpo@apple.com',
    email_privacy: 'privacy@apple.com',
    data_export_url: 'https://privacy.apple.com',
    known_violations: [
      'Écoute des conversations Siri par des sous-traitants (2019)',
      'Données App Store partagées avec des régies pub',
    ],
  },
  spotify: {
    name: 'Spotify',
    email_dpo: 'privacy@spotify.com',
    email_privacy: 'privacy@spotify.com',
    data_export_url: 'https://www.spotify.com/account/privacy/',
    known_violations: [
      'Profilage comportemental intensif via les habitudes d\'écoute',
      'Partage de données avec des annonceurs tiers',
    ],
  },
  linkedin: {
    name: 'LinkedIn (Microsoft)',
    email_dpo: 'DPO@microsoft.com',
    email_privacy: 'privacy@linkedin.com',
    data_export_url: 'https://www.linkedin.com/mypreferences/d/download-my-data',
    known_violations: [
      'Utilisation des données professionnelles pour l\'entraînement IA',
      'Opt-out difficile à trouver pour le training IA',
    ],
  },
}

export function generateRGPDEmail(
  targetKey: string,
  userName: string,
  userEmail: string
): { subject: string; to: string; cc: string; body: string } {
  const target = SHIELD_TARGETS[targetKey]
  if (!target) throw new Error(`Plateforme inconnue : ${targetKey}`)

  const today = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const subject = `Exercice des droits RGPD — Articles 15, 17 et 21 — ${userName}`

  const body = `Objet : Exercice de mes droits au titre du Règlement Général sur la Protection des Données (RGPD)

Madame, Monsieur,

Je soussigné(e) ${userName}, utilisateur/utilisatrice de vos services ${target.name}, vous adresse la présente demande en vertu du Règlement (UE) 2016/679 du 27 avril 2016 relatif à la protection des personnes physiques à l'égard du traitement des données à caractère personnel (RGPD).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. DROIT D'ACCÈS (Article 15 du RGPD)

Je vous demande de me fournir, dans un format structuré, couramment utilisé et lisible par machine :
• L'intégralité des données à caractère personnel que vous détenez me concernant
• Les finalités du traitement de ces données
• Les catégories de données traitées
• Les destinataires ou catégories de destinataires auxquels ces données ont été ou seront communiquées
• La durée de conservation envisagée ou les critères utilisés pour déterminer cette durée
• L'existence d'une prise de décision automatisée, y compris le profilage (Article 22)
• Les garanties appropriées en cas de transfert vers un pays tiers (Article 46)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2. DROIT À L'EFFACEMENT (Article 17 du RGPD)

Je demande la suppression totale et irréversible de l'ensemble de mes données à caractère personnel, y compris mais sans s'y limiter :
• Mes données de compte et d'identification
• Mon historique d'utilisation et de conversations
• Mes données comportementales et de profilage
• Toute donnée utilisée pour l'entraînement de modèles d'intelligence artificielle
• Les métadonnées associées à mon utilisation de vos services
• Toute copie, sauvegarde ou réplication de ces données

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3. DROIT D'OPPOSITION (Article 21 du RGPD)

Je m'oppose formellement et sans réserve à :
• Tout traitement futur de mes données à des fins de profilage
• Toute utilisation de mes données pour l'entraînement de modèles d'intelligence artificielle
• Tout transfert de mes données vers des pays tiers ne bénéficiant pas d'une décision d'adéquation
• Tout partage de mes données avec des tiers à des fins commerciales

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ATTESTATION REQUISE

Conformément à l'article 12 du RGPD, je vous demande de me fournir une attestation écrite confirmant :
• La réception de cette demande
• L'exécution complète de la suppression de mes données
• La confirmation qu'aucune copie n'a été conservée
• La liste des tiers auxquels mes données ont été communiquées et la confirmation de la suppression auprès de ces tiers

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DÉLAI DE RÉPONSE

Conformément à l'article 12(3) du RGPD, vous disposez d'un délai d'un mois à compter de la réception de cette demande pour y répondre. En l'absence de réponse satisfaisante dans ce délai, je me réserve le droit de saisir l'autorité de contrôle compétente (CNIL — Commission nationale de l'informatique et des libertés) conformément à l'article 77 du RGPD.

Date : ${today}
Email associé au compte : ${userEmail}

Cordialement,
${userName}

---
Ce document a été généré par TEL — The Experience Layer (theexperiencelayer.org)
Infrastructure souveraine pour la dignité humaine.`

  return {
    subject,
    to: target.email_dpo,
    cc: target.email_privacy,
    body,
  }
}
