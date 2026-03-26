// TEL — The Experience Layer
// lib/reference-texts.ts
// Extraits des textes de référence sur les droits fondamentaux
// Utilisés par le module TEL Transparence pour l'audit algorithmique

export interface ReferenceText {
  id: string
  label: string
  shortLabel: string
  source: string
  content: string
}

export const REFERENCE_TEXTS: ReferenceText[] = [
  {
    id: 'dudh-12',
    label: 'Déclaration universelle des droits de l\'homme — Article 12 (Vie privée)',
    shortLabel: 'DUDH — Art. 12 Vie privée',
    source: 'ONU, 1948',
    content: `Article 12 — DUDH (1948) :
Nul ne sera l'objet d'immixtions arbitraires dans sa vie privée, sa famille, son domicile ou sa correspondance, ni d'atteintes à son honneur et à sa réputation. Toute personne a droit à la protection de la loi contre de telles immixtions ou de telles atteintes.

Principe fondateur : La vie privée est un droit inaliénable, non un privilège commercial. Toute collecte de données personnelles sans consentement explicite constitue une "immixtion arbitraire" au sens de cet article.`,
  },
  {
    id: 'rgpd',
    label: 'RGPD — Règlement européen sur la protection des données',
    shortLabel: 'RGPD — Consentement & droits',
    source: 'Union Européenne, 2018',
    content: `RGPD — Règlement (UE) 2016/679 — Articles clés :

Article 6 — Licéité du traitement :
Le traitement n'est licite que si l'une des conditions suivantes est remplie : (a) la personne concernée a donné son consentement au traitement de ses données à caractère personnel pour une ou plusieurs finalités spécifiques. Ce consentement doit être libre, spécifique, éclairé et univoque.

Article 7 — Conditions applicables au consentement :
Le responsable du traitement est en mesure de démontrer que la personne concernée a donné son consentement. La demande de consentement doit être présentée sous une forme compréhensible et aisément accessible, en des termes clairs et simples. La personne concernée a le droit de retirer son consentement à tout moment.

Article 13 — Informations à fournir :
Lors de la collecte des données, le responsable fournit les finalités du traitement, la base juridique, la durée de conservation, le droit d'accès, de rectification, d'effacement, et d'opposition.

Article 17 — Droit à l'effacement ("droit à l'oubli") :
La personne concernée a le droit d'obtenir du responsable l'effacement de données à caractère personnel la concernant dans les meilleurs délais. Ce droit s'applique notamment lorsque les données ne sont plus nécessaires à la finalité pour laquelle elles ont été collectées.`,
  },
  {
    id: 'cde-16-17',
    label: 'Convention des droits de l\'enfant — Articles 16 & 17 (Protection mineurs)',
    shortLabel: 'CDE — Protection des mineurs',
    source: 'ONU, 1989',
    content: `Convention des droits de l'enfant (1989) :

Article 16 — Protection de la vie privée :
1. Nul enfant ne fera l'objet d'immixtions arbitraires ou illégales dans sa vie privée, sa famille, son domicile ou sa correspondance, ni d'atteintes illégales à son honneur et à sa réputation.
2. L'enfant a droit à la protection de la loi contre de telles immixtions ou de telles atteintes.

Article 17 — Accès à l'information appropriée :
Les États parties reconnaissent l'importance de la fonction remplie par les médias et veillent à ce que l'enfant ait accès à une information et à des matériels provenant de sources nationales et internationales diverses. Les États parties encouragent les médias à tenir particulièrement compte des besoins linguistiques des enfants autochtones et protègent l'enfant contre les informations et matériels nuisibles à son bien-être.

Note critique : Tout système collectant des données d'enfants sans consentement parental explicite viole cet article. La commercialisation des données comportementales des mineurs constitue une atteinte directe à cet article.`,
  },
  {
    id: 'yogyakarta',
    label: 'Principes de Yogyakarta — Droits LGBTQ+',
    shortLabel: 'Yogyakarta — Droits LGBTQ+',
    source: 'Commission internationale de juristes, 2006',
    content: `Principes de Yogyakarta (2006) — Principes sur l'application du droit international des droits humains en matière d'orientation sexuelle et d'identité de genre :

Principe 6 — Droit à la vie privée :
Toute personne a le droit de jouir de sa vie privée sans ingérence arbitraire ou illégale, notamment en ce qui concerne son orientation sexuelle et son identité de genre. Les États doivent : prendre toutes les mesures législatives, administratives et autres nécessaires pour assurer le droit à la vie privée sans discrimination fondée sur l'orientation sexuelle ou l'identité de genre.

Principe 3 — Reconnaissance devant la loi :
Chaque être humain a le droit d'être reconnu partout comme une personne juridique. L'orientation sexuelle ou l'identité de genre d'une personne ne peuvent être utilisées pour remettre en question sa capacité juridique.

Note : Tout système qui catégorise, infère ou divulgue l'orientation sexuelle ou l'identité de genre d'un utilisateur sans son consentement explicite viole ces principes.`,
  },
  {
    id: 'charte-africaine',
    label: 'Charte africaine des droits de l\'homme et des peuples',
    shortLabel: 'Charte africaine — Droits fondamentaux',
    source: 'Union Africaine, 1981',
    content: `Charte africaine des droits de l'homme et des peuples (1981) :

Article 4 — Inviolabilité de l'être humain :
La personne humaine est inviolable. Tout être humain a droit au respect de sa vie et à l'intégrité physique et morale de sa personne. Nul ne peut être privé arbitrairement de ce droit.

Article 5 — Dignité humaine :
Tout individu a droit au respect de la dignité inhérente à la personne humaine et à la reconnaissance de sa personnalité juridique. Toutes formes d'exploitation et d'avilissement de l'homme notamment l'esclavage, la traite des personnes, la torture physique ou morale, et les peines ou les traitements cruels, inhumains ou dégradants sont interdites.

Article 9 — Droit à l'information :
Toute personne a droit à l'information. Toute personne a le droit d'exprimer et de diffuser ses opinions dans le cadre des lois et règlements.

Note contextuelle : Appliqué aux technologies numériques, cet article implique que tout système numérique déployé en Afrique qui collecte des données sans information claire de l'utilisateur viole le droit à l'information (Art. 9) et peut constituer une forme d'avilissement numérique (Art. 5).`,
  },
  {
    id: 'charte-canadienne',
    label: 'Constitution canadienne — Charte des droits et libertés',
    shortLabel: 'Charte canadienne — Section 8',
    source: 'Canada, 1982',
    content: `Charte canadienne des droits et libertés (1982) :

Section 7 — Vie, liberté et sécurité :
Chacun a droit à la vie, à la liberté et à la sécurité de sa personne ; il ne peut être porté atteinte à ce droit qu'en conformité avec les principes de justice fondamentale.

Section 8 — Fouilles, perquisitions ou saisies :
Chacun a droit à la protection contre les fouilles, les perquisitions ou les saisies abusives. La Cour suprême du Canada a interprété cette section comme protégeant "l'attente raisonnable en matière de vie privée" — concept qui s'étend aux données numériques selon les décisions récentes.

Section 15 — Droits à l'égalité :
La loi ne fait acception de personne et s'applique également à tous, et tous ont droit à la même protection et au même bénéfice de la loi, indépendamment de toute discrimination, notamment des discriminations fondées sur la race, l'origine nationale ou ethnique, la couleur, la religion, le sexe, l'âge ou les déficiences mentales ou physiques.

Application numérique : La collecte automatisée de métadonnées ou de données comportementales sans mandat constitue une "saisie abusive" au sens de la Section 8, selon la jurisprudence récente (R. c. Spencer, 2014).`,
  },
  {
    id: 'unesco-ia-2021',
    label: 'Principes d\'éthique de l\'IA — UNESCO 2021',
    shortLabel: 'UNESCO — Éthique IA 2021',
    source: 'UNESCO, Recommandation sur l\'éthique de l\'IA, 2021',
    content: `Recommandation de l'UNESCO sur l'éthique de l'intelligence artificielle (2021) :

Proportionnalité et ne pas nuire :
Les systèmes d'IA ne doivent collecter et utiliser des données que dans la mesure strictement nécessaire à l'accomplissement de la finalité déclarée du traitement. Toute collecte excessive de données constitue une violation du principe de proportionnalité.

Transparence et explicabilité :
Les acteurs de l'IA doivent s'engager à garantir la transparence et l'explicabilité, dans la mesure du possible, de leurs systèmes d'IA. Cela signifie que les utilisateurs doivent pouvoir comprendre comment le système prend des décisions et pourquoi leurs données sont utilisées.

Responsabilité et imputabilité :
Des mécanismes doivent être mis en place pour garantir la responsabilité et l'imputabilité des systèmes d'IA et de leurs impacts tout au long de leur cycle de vie. Des mécanismes de recours doivent être accessibles pour les personnes lésées.

Protection des données et vie privée :
La vie privée doit être protégée et promue tout au long du cycle de vie de l'IA. Les gouvernements et les entreprises doivent garantir que les données personnelles ne soient pas utilisées pour profiler, manipuler ou discriminer des individus.

Inclusion et équité :
Les systèmes d'IA doivent être conçus pour éviter de perpétuer ou d'amplifier des biais discriminatoires. Une attention particulière doit être portée aux groupes vulnérables, notamment les enfants, les minorités et les populations marginalisées.`,
  },
  {
    id: 'cedaw-12',
    label: 'CEDAW — Convention sur l\'élimination de toutes les formes de discrimination à l\'égard des femmes',
    shortLabel: 'CEDAW — Droits des femmes ONU 1979',
    source: 'ONU, 1979',
    content: `Convention sur l'élimination de toutes les formes de discrimination à l'égard des femmes (CEDAW) — ONU, 1979 :

Article 12 — Soins de santé :
1. Les États parties prennent toutes les mesures appropriées pour éliminer la discrimination à l'égard des femmes dans le domaine des soins de santé, en vue de leur assurer, sur la base de l'égalité de l'homme et de la femme, les moyens d'accéder aux services médicaux, y compris ceux qui concernent la planification de la famille.
2. Nonobstant les dispositions du paragraphe 1 ci-dessus, les États parties fournissent aux femmes pendant la grossesse, pendant l'accouchement et après l'accouchement, des services appropriés et, au besoin, gratuits, ainsi qu'une nutrition adéquate pendant la grossesse et l'allaitement.

Article 11 — Emploi et conditions de travail :
Les États parties prennent toutes les mesures appropriées pour éliminer la discrimination à l'égard des femmes dans le domaine de l'emploi, afin d'assurer, sur la base de l'égalité de l'homme et de la femme, les mêmes droits, notamment le droit au travail, le droit aux mêmes possibilités d'emploi, le droit à la sécurité de l'emploi et le droit à une rémunération égale pour un travail d'égale valeur.

Article 16 — Mariage et vie de famille :
Les États parties prennent toutes les mesures appropriées pour éliminer la discrimination à l'égard des femmes dans toutes les questions découlant du mariage et dans les rapports familiaux, et notamment assurer, sur la base de l'égalité de l'homme et de la femme : le même droit de contracter mariage, les mêmes droits et responsabilités au cours du mariage et lors de sa dissolution.

Note critique : Tout système algorithmique qui traite différemment les femmes en matière d'accès aux services de santé, de crédit, d'emploi ou d'information constitue une forme de discrimination prohibée par cet instrument. La CEDAW est ratifiée par 189 États — c'est l'un des traités internationaux les plus universellement adoptés.`,
  },
]

export function getReferenceById(id: string): ReferenceText | undefined {
  return REFERENCE_TEXTS.find(r => r.id === id)
}

export function getReferencesByIds(ids: string[]): ReferenceText[] {
  return ids.map(id => getReferenceById(id)).filter(Boolean) as ReferenceText[]
}
