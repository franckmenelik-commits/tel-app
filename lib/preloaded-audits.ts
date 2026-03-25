// TEL — The Experience Layer
// lib/preloaded-audits.ts
// Audits pré-générés des CGU des plateformes majeures

import type { TransparencyReport } from '@/app/api/transparency/route'

export interface PreloadedAudit {
  id: string
  name: string
  subtitle: string
  icon: string
  report: TransparencyReport
}

export const PRELOADED_AUDITS: PreloadedAudit[] = [
  {
    id: 'instagram-cgu-2024',
    name: 'Instagram',
    subtitle: 'Conditions d\'utilisation & politique de données',
    icon: '◈',
    report: {
      documentType: 'Conditions d\'utilisation et politique de confidentialité',
      whatItSays:
        'Instagram affirme vous donner le contrôle de vos données et de votre vie privée. La politique présente le partage de données comme un service permettant de "personnaliser votre expérience". Le consentement est présenté comme un choix libre, et les utilisateurs sont informés qu\'ils peuvent "gérer leurs préférences" à tout moment.',
      whatItHides:
        'La plateforme collecte des données biométriques (reconnaissance faciale, analyse des expressions), les données de localisation précises même quand l\'app est fermée, et les habitudes de navigation sur des sites tiers via le pixel Meta. Le "consentement" est obtenu par des interfaces trompeuses (dark patterns) qui rendent le refus délibérément difficile. Les données sont partagées avec des milliers de partenaires commerciaux non nommés.',
      whatContradictsReferences:
        'Art. 12 DUDH : la collecte de données biométriques sans consentement explicite constitue une "immixtion arbitraire". RGPD Art. 7 : le consentement doit être "libre" — or, l\'utilisation de dark patterns invalide ce consentement. CDE Art. 16 : la plateforme est accessible aux mineurs dès 13 ans sans mécanisme de protection réel de leurs données comportementales.',
      theUnspeakable:
        'Ce document ne peut pas dire que le modèle économique entier repose sur la transformation de l\'attention humaine en marchandise. Il ne peut pas dire que vos insécurités, vos désirs et vos peurs sont les données les plus précieuses. Il ne peut pas nommer que la plateforme est conçue pour créer de la dépendance — c\'est son produit, pas un effet secondaire.',
      questionNoOneHasAsked:
        'Si Instagram devait payer chaque utilisateur pour chaque heure d\'attention capturée au prix du marché publicitaire, combien vous devrait-elle — et ce modèle survivrait-il ?',
      riskLevel: 'élevé',
      riskSummary:
        'Collecte de données biométriques, partage avec des tiers non identifiés, interfaces trompeuses invalidant le consentement RGPD, exposition des mineurs.',
    },
  },
  {
    id: 'tiktok-cgu-2024',
    name: 'TikTok',
    subtitle: 'Politique de confidentialité & conditions de service',
    icon: '◉',
    report: {
      documentType: 'Politique de confidentialité et conditions de service',
      whatItSays:
        'TikTok déclare protéger la vie privée des utilisateurs et respecter les réglementations locales. La politique présente la collecte de données comme nécessaire au "fonctionnement du service" et à la "sécurité". L\'accès aux données personnelles est décrit comme limité au personnel autorisé avec des "contrôles stricts".',
      whatItHides:
        'TikTok collecte les données du presse-papiers, les informations biométriques (visage et voix), la liste de contacts, les métadonnées de chaque vidéo regardée, les patterns d\'utilisation précis. La société mère ByteDance est soumise à la loi chinoise sur la sécurité nationale, qui peut contraindre toute entreprise chinoise à fournir des données aux services de renseignement. Le "mode restreint" pour mineurs est facilement contournable.',
      whatContradictsReferences:
        'RGPD Art. 6 : la base légale du traitement des données est ambiguë — le "service" comme justification couvre quasi tout. UNESCO IA Art. 24 : l\'algorithme de recommandation optimise pour l\'engagement maximal, pas pour le bien-être des enfants, contredisant directement les principes d\'IA éthique. CDE Art. 17 : l\'exposition à des contenus extrêmes ou dangereux pour les mineurs est documentée.',
      theUnspeakable:
        'Ce document ne peut pas dire que TikTok a construit le moteur de manipulation cognitivo-émotionnelle le plus efficace jamais créé. Il ne peut pas nommer que son algorithme sait mieux que vous ce que vous ne voulez pas savoir — et vous le montre quand même. Il ne peut pas dire que vos 3h de scroll quotidien sont une décision commerciale, pas un choix.',
      questionNoOneHasAsked:
        'Si l\'algorithme de TikTok était soumis aux mêmes régulations que les essais cliniques médicaux — puisqu\'il modifie le comportement humain à l\'échelle de milliards de personnes — quels résultats révélerait l\'audit de sécurité ?',
      riskLevel: 'critique',
      riskSummary:
        'Accès potentiel aux données par des services de renseignement étrangers, collecte biométrique massive, manipulation algorithmique des mineurs, opacité sur les transferts de données.',
    },
  },
  {
    id: 'chatgpt-cgu-2024',
    name: 'ChatGPT',
    subtitle: 'Conditions d\'utilisation OpenAI & politique de confidentialité',
    icon: '◇',
    report: {
      documentType: 'Conditions d\'utilisation et politique de confidentialité OpenAI',
      whatItSays:
        'OpenAI déclare utiliser les conversations pour améliorer ses modèles, avec la possibilité pour les utilisateurs de désactiver cette option. La politique affirme que les données sont protégées par des "mesures de sécurité appropriées" et que les utilisateurs contrôlent leurs informations. Les conversations peuvent être revues par des employés "dans un cadre limité" à des fins de sécurité.',
      whatItHides:
        'Toute information partagée dans une conversation — secrets professionnels, informations médicales, données personnelles, stratégies d\'entreprise — devient potentiellement une donnée d\'entraînement. L\'option "désactiver l\'entraînement" ne s\'applique pas à toutes les données collectées. Les conversations peuvent être stockées pendant 30 jours même après suppression. Le modèle peut retenir des patterns de vos inputs sans que vous en ayez conscience.',
      whatContradictsReferences:
        'RGPD Art. 13 : la finalité exacte du traitement des données conversationnelles reste floue — "améliorer nos services" est une base trop générale. RGPD Art. 17 : le "droit à l\'oubli" est techniquement impossible avec des LLMs — un modèle entraîné sur vos données ne peut pas les "oublier" après déploiement. UNESCO IA Art. 24 : le principe de transparence algorithmique est violé — l\'utilisateur ne sait pas comment ses données influencent le modèle.',
      theUnspeakable:
        'Ce document ne peut pas dire que vous entraînez gratuitement un modèle commercial en lui posant vos questions. Il ne peut pas nommer que vos angoisses du dimanche soir, vos secrets professionnels, vos doutes les plus intimes — tout cela contribue à un actif valorisé à plusieurs milliards de dollars dont vous ne verrez jamais un centime.',
      questionNoOneHasAsked:
        'Si les utilisateurs de ChatGPT étaient rémunérés proportionnellement à la valeur que leurs conversations ont apportée à l\'entraînement du modèle, quel serait le redistribution juste — et pourquoi ce débat n\'existe-t-il pas encore ?',
      riskLevel: 'modéré',
      riskSummary:
        'Utilisation des conversations comme données d\'entraînement, droit à l\'oubli techniquement impossible avec les LLMs, opacité sur la durée et la portée du stockage.',
    },
  },
]
