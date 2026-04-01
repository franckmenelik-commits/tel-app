'use client'

// TEL — The Experience Layer
// lib/i18n.ts — Internationalisation fr / en
// "TEL" ne se traduit jamais. Le contenu généré par LOGOS reste dans
// la langue des sources — seule l'interface change.

import { useState, useEffect } from 'react'

export type Lang = 'fr' | 'en'

export const TRANSLATIONS = {
  // ── Hero ────────────────────────────────────────────────────────────────────
  'hero.line1':      { fr: 'Croisez deux sources.', en: 'Cross two sources.' },
  'hero.line2':      { fr: "Voyez ce qu'elles cachent ensemble.", en: 'See what they hide together.' },
  'hero.desc':       { fr: "Entrez deux sources pour les croiser — ou une seule, et laissez TEL vous surprendre.", en: 'Enter two sources to cross them — or just one, and let TEL surprise you.' },
  'hero.cta':        { fr: 'Essayer maintenant', en: 'Try now' },
  'hero.discovery':  { fr: 'CE QUE TEL A DÉJÀ TROUVÉ', en: 'WHAT TEL HAS ALREADY FOUND' },
  'hero.citation':   {
    fr: "Parfois, la réponse n'est pas cachée. Elle est simplement dans l'espace entre des personnes qui ne se sont jamais parlé.",
    en: "Sometimes the answer isn't hidden. It's just sitting in the space between some people who never talked to each other.",
  },
  'carousel.title':  { fr: 'CE QUE TEL RÉVÈLE', en: 'WHAT TEL REVEALS' },
  'carousel.explore':{ fr: 'Cliquer pour explorer →', en: 'Click to explore →' },

  // ── Nav ──────────────────────────────────────────────────────────────────────
  'nav.legends':      { fr: 'Légendes',      en: 'Legends' },
  'nav.education':    { fr: 'Éducation',     en: 'Education' },
  'nav.transparency': { fr: 'Transparence',  en: 'Transparency' },
  'nav.manifesto':    { fr: 'Manifeste',     en: 'Manifesto' },
  'nav.careers':      { fr: 'Métiers',       en: 'Careers' },
  'nav.initiative':   { fr: 'Initiative',    en: 'Initiative' },
  'nav.history':      { fr: 'Mes croisements', en: 'My crossings' },
  'nav.signin':       { fr: 'Se connecter',  en: 'Sign in' },
  'nav.signout':      { fr: 'Se déconnecter', en: 'Sign out' },
  'nav.explore':      { fr: 'Explorer',      en: 'Explore' },

  // ── Source input ─────────────────────────────────────────────────────────────
  'input.cross':       { fr: 'Croiser les vécus',            en: 'Cross the experiences' },
  'input.surprise':    { fr: 'Laisser TEL vous surprendre',  en: 'Let TEL surprise you' },
  'input.loading':     { fr: '— LOGOS travaille —',          en: '— LOGOS working —' },
  'input.add':         { fr: '+ ajouter une source',         en: '+ add a source' },
  'input.placeholder1': {
    fr: 'URL, mot-clé, "A × B", ou témoignage direct (>50 mots)…',
    en: 'URL, keyword, "A × B", or direct testimony (>50 words)…',
  },
  'input.placeholder2': {
    fr: 'Deuxième source — le vécu à croiser',
    en: 'Second source — the experience to cross',
  },
  'input.error':       { fr: 'Entrez au moins une source, un mot-clé, ou un croisement (A × B).', en: 'Enter at least one source, keyword, or crossing (A × B).' },
  'input.sources':     { fr: 'source',       en: 'source' },
  'input.waiting':     { fr: 'en attente',   en: 'waiting' },

  // ── Source type labels ────────────────────────────────────────────────────────
  'source.testimony': { fr: 'Témoignage',   en: 'Testimony' },
  'source.crossing':  { fr: 'Croisement ×', en: 'Crossing ×' },

  // ── Mode Croise-moi ──────────────────────────────────────────────────────────
  'mode.resonate':       { fr: 'Mon vécu',   en: 'My experience' },
  'mode.resonate.label': { fr: 'VÉCU PERSONNEL', en: 'PERSONAL EXPERIENCE' },
  'mode.resonate.placeholder': {
    fr: 'Décrivez votre situation, votre expérience, ou ce que vous traversez…',
    en: 'Describe your situation, your experience, or what you are going through…',
  },
  'mode.resonate.btn':   { fr: 'Trouver des résonances', en: 'Find resonances' },
  'mode.resonate.loading': { fr: 'Recherche de résonances dans le monde…', en: 'Searching for resonances in the world…' },

  // ── Contexte SOUFFLE ─────────────────────────────────────────────────────────
  'contexte.label':     { fr: 'Contexte SOUFFLE', en: 'SOUFFLE context' },
  'contexte.hint':      { fr: 'Le contexte détermine le niveau SOUFFLE activé.', en: 'The context determines the SOUFFLE level activated.' },

  // ── Loading messages ─────────────────────────────────────────────────────────
  'loading.extraction':  { fr: 'Extraction du contenu des sources…',           en: 'Extracting source content…' },
  'loading.cultural':    { fr: 'Détection des contextes culturels…',           en: 'Detecting cultural contexts…' },
  'loading.narrative':   { fr: 'Analyse des arcs narratifs…',                  en: 'Analysing narrative arcs…' },
  'loading.crossing':    { fr: 'Croisement des perspectives…',                  en: 'Crossing perspectives…' },
  'loading.convergences':{ fr: 'Identification des convergences…',              en: 'Identifying convergences…' },
  'loading.divergences': { fr: "Détection des divergences irréductibles…",      en: 'Detecting irreducible divergences…' },
  'loading.blindspots':  { fr: "Recherche d'angles morts géographiques…",       en: 'Searching geographic blind spots…' },
  'loading.pattern':     { fr: 'Formulation du pattern…',                       en: 'Formulating the pattern…' },
  'loading.question':    { fr: 'Génération de la question inexposée…',          en: 'Generating the unexposed question…' },

  // ── Discovery messages ───────────────────────────────────────────────────────
  'discovery.analyse':   { fr: 'Analyse de votre source…',          en: 'Analysing your source…' },
  'discovery.explore':   { fr: 'Exploration de 194 pays…',           en: 'Exploring 194 countries…' },
  'discovery.detect':    { fr: "Détection d'une connexion improbable…", en: 'Detecting an improbable connection…' },
  'discovery.emerge':    { fr: 'Un croisement inattendu émerge…',    en: 'An unexpected crossing emerges…' },
  'discovery.found':     { fr: 'LOGOS a découvert',                  en: 'LOGOS discovered' },

  // ── How it works ─────────────────────────────────────────────────────────────
  'how.title':       { fr: 'Comment ça fonctionne', en: 'How it works' },
  'how.step1.title': { fr: 'Entrez vos sources', en: 'Enter your sources' },
  'how.step1.desc':  { fr: "URL YouTube ou article web, texte libre, mot-clé, ou deux concepts à croiser directement.", en: 'YouTube URL or web article, free text, keyword, or two concepts to cross directly.' },
  'how.step2.title': { fr: 'LOGOS analyse et croise', en: 'LOGOS analyses and crosses' },
  'how.step2.desc':  { fr: "Contextes culturels, arcs narratifs, angles morts géographiques. Trois niveaux d'analyse.", en: 'Cultural contexts, narrative arcs, geographic blind spots. Three levels of analysis.' },
  'how.step3.title': { fr: 'Un insight émerge', en: 'An insight emerges' },
  'how.step3.desc':  { fr: "Convergences, divergences irréductibles — et la question que personne n'avait encore osé formuler.", en: "Convergences, irreducible divergences — and the question no one had yet dared to ask." },

  // ── Card ─────────────────────────────────────────────────────────────────────
  'card.expand':   { fr: 'Voir l\'analyse complète →', en: 'See full analysis →' },
  'card.collapse': { fr: '← Réduire', en: '← Collapse' },

  // ── Actions ──────────────────────────────────────────────────────────────────
  'action.share':       { fr: 'Partager — copier le lien',  en: 'Share — copy link' },
  'action.copied':      { fr: 'Lien copié',                 en: 'Link copied' },
  'action.newcrossing': { fr: 'Nouveau croisement',         en: 'New crossing' },

  // ── Feedback ─────────────────────────────────────────────────────────────────
  'feedback.resonates':  { fr: 'Cet insight résonne',    en: 'This insight resonates' },
  'feedback.inaccurate': { fr: 'Cet insight est inexact', en: 'This insight is inaccurate' },
  'feedback.thanks':     { fr: 'Merci',                  en: 'Thank you' },

  // ── History ──────────────────────────────────────────────────────────────────
  'history.title':  { fr: 'Mes croisements',             en: 'My crossings' },
  'history.empty':  { fr: "Aucun croisement pour l'instant.", en: 'No crossings yet.' },
  'history.back':   { fr: '← Fermer',                    en: '← Close' },

  // ── Session sidebar ──────────────────────────────────────────────────────────
  'session.title':    { fr: 'Session',                                      en: 'Session' },
  'session.empty':    { fr: 'Aucun croisement dans cette session.',          en: 'No crossings in this session.' },
  'session.review':   { fr: 'Revoir vos',                                   en: 'Review your' },
  'session.crossings':{ fr: 'croisement',                                   en: 'crossing' },

  // ── Enrichissement ───────────────────────────────────────────────────────────
  'enrich.title':    { fr: 'Enrichissement automatique',               en: 'Automatic enrichment' },
  'enrich.subtitle': { fr: 'TEL a trouvé des sources complémentaires', en: 'TEL found complementary sources' },

  // ── Error state ───────────────────────────────────────────────────────────────
  'error.crossing': { fr: "Le croisement n'a pas pu avoir lieu.", en: 'The crossing could not take place.' },
  'error.retry':    { fr: 'Réessayer',                            en: 'Try again' },

  // ── Education page ────────────────────────────────────────────────────────────
  'edu.header':                { fr: 'TEL · Éducation',    en: 'TEL · Education' },
  'edu.label':                 { fr: 'LOGOS · Éducation',  en: 'LOGOS · Education' },
  'edu.title':                 { fr: 'TEL Éducation',      en: 'TEL Education' },
  'edu.subtitle':              { fr: "Chaque élève porte une perspective que les autres ne voient pas.", en: "Every student carries a perspective that others don't see." },
  'edu.form.subject':          { fr: 'Sujet du cours',     en: 'Course subject' },
  'edu.form.subject.ph':       { fr: 'La Révolution française, la photosynthèse, les droits humains…', en: 'The French Revolution, photosynthesis, human rights…' },
  'edu.form.level':            { fr: 'Niveau',             en: 'Level' },
  'edu.form.origins':          { fr: 'Origines culturelles de votre classe', en: 'Cultural origins of your class' },
  'edu.form.selected':         { fr: 'sélectionnées',      en: 'selected' },
  'edu.form.min':              { fr: 'Minimum 2 origines', en: 'Minimum 2 origins' },
  'edu.form.other.ph':         { fr: 'Pays ou culture…',   en: 'Country or culture…' },
  'edu.form.other.add':        { fr: 'Ajouter',            en: 'Add' },
  'edu.form.other.btn':        { fr: '+ Autre',            en: '+ Other' },
  'edu.cta':                   { fr: 'Révéler les perspectives cachées', en: 'Reveal hidden perspectives' },
  'edu.error.subject':         { fr: 'Entrez le sujet du cours.',          en: 'Enter the course subject.' },
  'edu.error.origins':         { fr: 'Sélectionnez au moins 2 origines.',  en: 'Select at least 2 origins.' },
  'edu.error.level':           { fr: 'Sélectionnez un niveau.',            en: 'Select a level.' },
  'edu.reset':                 { fr: '← Nouvelle analyse', en: '← New analysis' },
  'edu.script':                { fr: 'Script pédagogique', en: 'Teaching script' },
  'edu.share':                 { fr: 'Partager',           en: 'Share' },
  'edu.copied':                { fr: 'Lien copié',         en: 'Link copied' },
  'edu.perspectives':          { fr: 'perspectives',       en: 'perspectives' },
  'edu.section.perspectives':  { fr: 'Perspectives culturelles',      en: 'Cultural perspectives' },
  'edu.section.reveals':       { fr: 'CE QUE CELA RÉVÈLE',            en: 'WHAT THIS REVEALS' },
  'edu.section.tension':       { fr: 'POINT DE TENSION',              en: 'TENSION POINT' },
  'edu.section.questions':     { fr: 'Questions pour votre classe',   en: 'Questions for your class' },
  'edu.section.questions.sub': { fr: 'Aucune bonne réponse — seulement des perspectives', en: 'No right answer — only perspectives' },
  'edu.section.blindspots':    { fr: 'Angles morts du programme standard', en: 'Standard curriculum blind spots' },
  'edu.footer':                { fr: 'TEL Éducation · theexperiencelayer.org', en: 'TEL Education · theexperiencelayer.org' },
  'edu.script.modal':          { fr: 'Script pédagogique', en: 'Teaching script' },
  'edu.script.copy':           { fr: 'Copier',             en: 'Copy' },
  'edu.script.copied':         { fr: 'Copié',              en: 'Copied' },
  'edu.loading.1': { fr: 'Analyse du sujet depuis chaque perspective…', en: 'Analysing subject from each perspective…' },
  'edu.loading.2': { fr: 'Croisement des contextes culturels…',         en: 'Crossing cultural contexts…' },
  'edu.loading.3': { fr: "Détection des angles morts du programme…",    en: 'Detecting curriculum blind spots…' },
  'edu.loading.4': { fr: 'Génération des questions de dialogue…',        en: 'Generating dialogue questions…' },
  'edu.level.primary':    { fr: 'Primaire',        en: 'Primary' },
  'edu.level.secondary':  { fr: 'Secondaire',      en: 'Secondary' },
  'edu.level.cegep':      { fr: 'Cégep / Lycée',   en: 'High School' },
  'edu.level.university': { fr: 'Universitaire',   en: 'University' },

  // ── Transparency page ─────────────────────────────────────────────────────────
  'transp.header':      { fr: 'The Experience Layer · Transparence', en: 'The Experience Layer · Transparency' },
  'transp.title':       { fr: 'TEL Transparence',   en: 'TEL Transparency' },
  'transp.subtitle':    { fr: 'Rendez lisible ce que les systèmes rendent invisible.', en: 'Make visible what systems render invisible.' },
  'transp.recent':      { fr: 'Audits récents',      en: 'Recent audits' },
  'transp.label':       { fr: 'Collez un texte à auditer', en: 'Paste text to audit' },
  'transp.placeholder': { fr: "Conditions d'utilisation, politique de confidentialité, contrat, ou tout texte institutionnel…", en: 'Terms of service, privacy policy, contract, or any institutional text…' },
  'transp.chars':       { fr: 'caractères',          en: 'characters' },
  'transp.crosswith':   { fr: 'Croiser avec',        en: 'Cross with' },
  'transp.addfree':     { fr: '+ Ajouter un texte de référence libre', en: '+ Add a free reference text' },
  'transp.freeph':      { fr: 'Collez ici votre texte de référence (convention collective, règlement interne, charte éthique…)', en: 'Paste your reference text here (collective agreement, internal rules, ethical charter…)' },
  'transp.audit':       { fr: 'Auditer ce texte',    en: 'Audit this text' },
  'transp.auditing':    { fr: 'Analyse en cours…',   en: 'Analysis in progress…' },
  'transp.back':        { fr: '← Nouvel audit',      en: '← New audit' },
  'transp.audit.label': { fr: 'Audit TEL Transparence', en: 'TEL Transparency Audit' },
  'transp.says':        { fr: 'Ce que le texte dit réellement', en: 'What the text actually says' },
  'transp.hides':       { fr: 'Ce que le texte cache',          en: 'What the text hides' },
  'transp.contradicts': { fr: 'Ce qui contredit les références', en: 'What contradicts the references' },
  'transp.unspeakable': { fr: "L'Indicible",         en: 'The Unspeakable' },
  'transp.question':    { fr: 'Question Inexposée',  en: 'Unexposed Question' },
  'transp.disclaimer':  { fr: "Cet audit est une version publique. Les versions institutionnelles incluent analyse clause par clause, recommandations légales et plan d'action pour la mise en conformité.", en: "This audit is a public version. Institutional versions include clause-by-clause analysis, legal recommendations and a compliance action plan." },
  'transp.share':       { fr: 'Partager',            en: 'Share' },
  'transp.copied':      { fr: '✓ Lien copié',        en: '✓ Link copied' },
  'transp.error.short': { fr: 'Le texte à auditer est trop court (minimum 50 caractères).', en: 'Text too short to audit (minimum 50 characters).' },
  'transp.error.noref': { fr: 'Sélectionnez au moins un texte de référence.', en: 'Select at least one reference text.' },
  'transp.error.generic':{ fr: "Erreur lors de l'analyse", en: 'Analysis error' },
  'transp.loading.1': { fr: 'Lecture du texte institutionnel…',            en: 'Reading institutional text…' },
  'transp.loading.2': { fr: 'Identification du jargon juridique…',          en: 'Identifying legal jargon…' },
  'transp.loading.3': { fr: 'Comparaison avec les droits fondamentaux…',    en: 'Comparing with fundamental rights…' },
  'transp.loading.4': { fr: 'Détection des clauses invisibles…',            en: 'Detecting invisible clauses…' },
  'transp.loading.5': { fr: 'Formulation de la question inexposée…',        en: 'Formulating the unexposed question…' },
  'transp.risk.low':  { fr: 'RISQUE FAIBLE',   en: 'LOW RISK' },
  'transp.risk.mod':  { fr: 'RISQUE MODÉRÉ',   en: 'MODERATE RISK' },
  'transp.risk.high': { fr: 'RISQUE ÉLEVÉ',    en: 'HIGH RISK' },
  'transp.risk.crit': { fr: 'RISQUE CRITIQUE', en: 'CRITICAL RISK' },

  // ── Initiative page ───────────────────────────────────────────────────────────
  'init.title':       { fr: 'TEL INITIATIVE', en: 'TEL INITIATIVE' },
  'init.heading':     { fr: "Transformez un problème\nen plan d'action.", en: 'Turn a problem\ninto an action plan.' },
  'init.desc':        { fr: "Décrivez un problème social. TEL l'analyse, cherche des précédents mondiaux,\nidentifie les voix absentes et construit votre argumentaire.", en: "Describe a social problem. TEL analyses it, searches for global precedents,\nidentifies missing voices and builds your argument." },
  'init.placeholder': { fr: "Décrivez un problème social que vous voulez résoudre... Exemple : Les femmes paient 12x plus cher pour leur santé mentale à Montréal.", en: "Describe a social problem you want to solve... Example: Women pay 12x more for mental health care in Montreal." },
  'init.check.prec':  { fr: 'Chercher des précédents mondiaux',    en: 'Search for global precedents' },
  'init.check.persp': { fr: 'Générer les perspectives manquantes', en: 'Generate missing perspectives' },
  'init.launch':      { fr: "Lancer l'initiative",                 en: 'Launch the initiative' },
  'init.error':       { fr: 'Décrivez votre problème en au moins 30 caractères.', en: 'Describe your problem in at least 30 characters.' },
  'init.problem':     { fr: 'Problème analysé',        en: 'Analysed problem' },
  'init.s1':          { fr: '01 — Diagnostic',          en: '01 — Diagnostic' },
  'init.s1.central':  { fr: 'Enjeu central',            en: 'Core issue' },
  'init.s1.affected': { fr: 'Populations affectées',    en: 'Affected populations' },
  'init.s1.data':     { fr: 'Données & contexte',       en: 'Data & context' },
  'init.s2':          { fr: '02 — Précédents mondiaux', en: '02 — Global Precedents' },
  'init.s2.result':   { fr: '→ Résultat',               en: '→ Result' },
  'init.s3':          { fr: '03 — Perspectives manquantes', en: '03 — Missing Perspectives' },
  'init.s3.angle':    { fr: 'Angle révélé :',           en: 'Revealed angle:' },
  'init.s4':          { fr: '04 — Arguments par audience', en: '04 — Arguments by Audience' },
  'init.s4.a1':       { fr: '🏛 Pour un député ou élu',  en: '🏛 For a politician or elected official' },
  'init.s4.a2':       { fr: '📰 Pour un journaliste',    en: '📰 For a journalist' },
  'init.s4.a3':       { fr: '💡 Pour une fondation',     en: '💡 For a foundation' },
  'init.s4.a4':       { fr: '🗣 Pour un citoyen',        en: '🗣 For a citizen' },
  'init.s5':          { fr: '05 — 30 jours pour démarrer', en: '05 — 30 Days to Start' },
  'init.s6':          { fr: '06 — Coalition potentielle',  en: '06 — Potential Coalition' },
  'init.s6.desc':     { fr: "Ces acteurs travaillent déjà sur ce problème — vous pouvez les contacter dès aujourd'hui.", en: "These actors are already working on this problem — you can contact them today." },
  'init.s6.visit':    { fr: 'Visiter →',                en: 'Visit →' },
  'init.s6.why':      { fr: 'Pourquoi les contacter :',  en: 'Why contact them:' },
  'init.export':      { fr: 'Exporter PDF',              en: 'Export PDF' },
  'init.share':       { fr: 'Partager',                  en: 'Share' },
  'init.script':      { fr: 'Script vidéo',              en: 'Video script' },
  'init.new':         { fr: 'Nouveau problème',          en: 'New problem' },
  'init.rare':        { fr: 'Rare',                      en: 'Rare' },
  'init.loading.1':   { fr: 'Analyse du problème...',                          en: 'Analysing the problem...' },
  'init.loading.2':   { fr: 'Recherche de précédents mondiaux...',             en: 'Searching for global precedents...' },
  'init.loading.3':   { fr: "Identification des perspectives manquantes...",   en: 'Identifying missing perspectives...' },
  'init.loading.4':   { fr: 'Construction des arguments par audience...',      en: 'Building arguments by audience...' },
  'init.loading.5':   { fr: "Formulation du plan d'action...",                 en: 'Formulating the action plan...' },

  // ── SourceInput tabs + resonate ────────────────────────────────────────────
  'input.tab.cross':        { fr: 'Croiser des sources',              en: 'Cross sources' },
  'resonate.deepstruct':    { fr: 'Structure profonde de votre vécu', en: 'Deep structure of your experience' },
  'resonate.resonance':     { fr: 'Résonance',                         en: 'Resonance' },
  'resonate.resonates':     { fr: 'Ce qui résonne :',                  en: 'What resonates:' },
  'resonate.differs':       { fr: 'Ce qui diffère :',                  en: 'What differs:' },
  'resonate.reveals':       { fr: 'Ce que ce croisement révèle',       en: 'What this crossing reveals' },
  'resonate.question':      { fr: 'Question inexposée',                en: 'Unexposed question' },
  'resonate.error':         { fr: 'Décrivez votre vécu en au moins 30 caractères.', en: 'Describe your experience in at least 30 characters.' },
  'resonate.desc':          { fr: 'Décrivez votre situation, votre expérience, ou ce que vous traversez. TEL trouvera des résonances dans la mémoire du monde.', en: 'Describe your situation, your experience, or what you are going through. TEL will find resonances in the memory of the world.' },

  // ── SOUFFLE context labels ─────────────────────────────────────────────────
  'ctx.exploration.label':    { fr: 'Exploration',               en: 'Exploration' },
  'ctx.exploration.desc':     { fr: 'Découverte libre, 2 sources', en: 'Free discovery, 2 sources' },
  'ctx.cultural.label':       { fr: 'Croisement profond',         en: 'Deep crossing' },
  'ctx.cultural.desc':        { fr: '3+ sources, complexité culturelle', en: '3+ sources, cultural depth' },
  'ctx.institutional.label':  { fr: 'Décision institutionnelle',  en: 'Institutional decision' },
  'ctx.institutional.desc':   { fr: 'Politique, organisation, gouvernance', en: 'Policy, organization, governance' },
  'ctx.language.label':       { fr: 'Langue en danger',           en: 'Endangered language' },
  'ctx.language.desc':        { fr: 'Langues menacées, mémoire culturelle', en: 'Endangered languages, cultural memory' },
  'ctx.trauma.label':         { fr: 'Vécu fragile',               en: 'Fragile experience' },
  'ctx.trauma.desc':          { fr: 'Mémoire douloureuse, dignité humaine', en: 'Painful memory, human dignity' },

  // ── Mode hints ────────────────────────────────────────────────────────────
  'hint.keyword.example':  { fr: 'décolonisation',       en: 'decolonization' },
  'hint.crossing.example': { fr: 'Darwin × bouddhisme',  en: 'Darwin × buddhism' },
  'hint.text.example':     { fr: 'Texte (>50 mots)',      en: 'Text (>50 words)' },
  'hint.mode.freetext':    { fr: 'Texte libre',           en: 'Free text' },
  'hint.mode.keyword':     { fr: 'Mot-clé',               en: 'Keyword' },
  'hint.mode.crossing':    { fr: 'Croisement ×',          en: 'Crossing ×' },
} as const

export type TranslationKey = keyof typeof TRANSLATIONS

export function t(key: TranslationKey, lang: Lang): string {
  return TRANSLATIONS[key]?.[lang] ?? TRANSLATIONS[key]?.fr ?? key
}

// ── React hook ───────────────────────────────────────────────────────────────

export function useLanguage(): [Lang, (l: Lang) => void, boolean] {
  const [lang, setLang] = useState<Lang>('fr')
  const [langDetected, setLangDetected] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('tel:lang') as Lang | null
      if (stored === 'fr' || stored === 'en') {
        setLang(stored)
      } else {
        const browser = navigator.language || ''
        setLang(browser.toLowerCase().startsWith('fr') ? 'fr' : 'en')
      }
    } catch { /* localStorage indisponible */ }
    setLangDetected(true)
  }, [])

  function setAndStore(l: Lang) {
    setLang(l)
    setLangDetected(true)
    try { localStorage.setItem('tel:lang', l) } catch { /* ok */ }
  }

  return [lang, setAndStore, langDetected]
}
