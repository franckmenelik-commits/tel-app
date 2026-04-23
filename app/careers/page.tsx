// TEL — The Experience Layer
// app/careers/page.tsx — Les métiers que TEL rend possibles

import Link from 'next/link'

export const metadata = {
  title: 'Métiers — TEL',
  description: "Les métiers que TEL rend possibles. Plus l'IA progresse, plus ces métiers deviennent précieux.",
}

const METIERS = [
  {
    titre: 'Facilitateur de conscience collective',
    description:
      "Il anime des sessions de croisement en groupe — espaces où des vécus distincts entrent en contact pour produire une compréhension commune. Son rôle n'est pas de synthétiser, mais de tenir la tension entre les perspectives jusqu'à ce qu'un insight émerge. Il traduit ensuite les insights TEL en actions collectives concrètes : protocoles de décision, rituels d'organisation, engagements partagés.",
  },
  {
    titre: "Traducteur d'insights culturels",
    description:
      "Il prend un croisement produit par TEL et l'interprète pour un contexte culturel spécifique — en restituant ce que le langage algorithmique aplatit : les non-dits, les hiérarchies implicites, les silences qui ont un sens. Il ne simplifie pas. Il redonne à l'insight sa texture locale. Son travail est irremplaçable parce qu'aucune IA ne peut comprendre ce qu'une culture tait.",
  },
  {
    titre: 'Curateur de vécus invisibilisés',
    description:
      "Il identifie et documente les expériences humaines absentes des bases de données — celles que les algorithmes ne trouveront jamais parce qu'elles n'ont jamais été écrites, ou parce qu'elles ont été écrites dans une langue que personne ne lit, ou parce qu'elles appartiennent à des communautés que le monde académique n'a pas jugé utile d'écouter. Il constitue le contre-archive de TEL.",
  },
  {
    titre: 'Coordinateur action-communauté',
    description:
      "Il transforme les insights institutionnels produits par TEL en programmes concrets sur le terrain. Entre un rapport et une action, il y a un gouffre que la technologie ne peut pas combler. Il le comble. Il connaît les acteurs locaux, les calendriers réels, les contraintes politiques. Il est le point de contact entre l'intelligence synthétique et l'intelligence du lieu.",
  },
  {
    titre: 'Médiateur humain-algorithme',
    description:
      "Il audite les décisions algorithmiques avec TEL Audit pour le compte d'institutions — entreprises, administrations, organisations internationales. Il ne cherche pas à condamner les algorithmes. Il cherche à rendre lisible ce qu'ils font réellement, à qui, et à quel coût humain. Il est l'interlocuteur que les personnes concernées n'avaient pas.",
  },
  {
    titre: 'Curateur de résonance',
    description:
      "Il valide si un insight TEL résonne avec la réalité du terrain avant qu'il soit publié ou transmis. Son outil principal n'est pas la donnée — c'est l'écoute. Il rencontre des personnes concernées par l'insight, teste sa pertinence, signale les distorsions. Il est le garde-fou entre l'intelligence produite et la réalité vécue.",
  },
  {
    titre: 'Analyste de tensions systémiques',
    description:
      "Il utilise TEL pour cartographier les tensions irréductibles dans les organisations — celles qu'aucun processus de médiation ne dissoudra parce qu'elles tiennent à des valeurs fondamentalement incompatibles. Son travail n'est pas de résoudre ces tensions. C'est de les nommer avec précision, pour que les organisations puissent les traverser sans se mentir.",
  },
]

export default function CareersPage() {
  return (
    <main style={{ background: '#09090b', minHeight: '100vh', color: '#e0e0e0' }}>

      {/* ── Header ── */}
      <header style={{ padding: '20px 40px', borderBottom: '1px solid rgba(255,255,255,0.047)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link
            href="/"
            style={{
              fontWeight: 500,
              fontSize: '15px',
              letterSpacing: '0.2em',
              color: '#ffffff',
              textTransform: 'uppercase' as const,
              textDecoration: 'none',
            }}
          >
            TEL
          </Link>
          <nav style={{ display: 'flex', gap: '24px' }}>
            {[
              { href: '/legends', label: 'Légendes' },
              { href: '/education', label: 'Éducation' },
              { href: '/audit', label: 'Audit' },
              { href: '/manifesto', label: 'Manifeste' },
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                style={{ fontSize: '12px', color: '#666666', textDecoration: 'none' }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* ── Content ── */}
      <article
        style={{
          maxWidth: '640px',
          margin: '0 auto',
          padding: '80px 40px 120px',
        }}
      >
        {/* Label */}
        <p style={{
          fontSize: '10px',
          fontWeight: 500,
          letterSpacing: '0.15em',
          textTransform: 'uppercase' as const,
          opacity: 0.4,
          color: '#e0e0e0',
          marginBottom: '48px',
        }}>
          The Experience Layer
        </p>

        {/* Title */}
        <h1 style={{
          fontFamily: 'Georgia, Times New Roman, serif',
          fontWeight: 400,
          fontSize: '32px',
          lineHeight: 1.2,
          letterSpacing: '-0.01em',
          color: '#ffffff',
          marginBottom: '16px',
        }}>
          Les métiers que TEL rend possibles
        </h1>

        {/* Subtitle */}
        <p style={{
          fontFamily: 'Georgia, Times New Roman, serif',
          fontSize: '17px',
          color: '#666666',
          lineHeight: 1.6,
          marginBottom: '72px',
        }}>
          Plus l&apos;IA progresse, plus ces métiers deviennent précieux.
        </p>

        {/* Métiers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '64px' }}>
          {METIERS.map((metier, i) => (
            <div key={i}>
              {/* Numéro */}
              <p style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                fontSize: '10px',
                letterSpacing: '0.15em',
                textTransform: 'uppercase' as const,
                color: '#C9A84C',
                opacity: 0.7,
                marginBottom: '12px',
              }}>
                {String(i + 1).padStart(2, '0')}
              </p>

              {/* Titre */}
              <h2 style={{
                fontFamily: 'Georgia, Times New Roman, serif',
                fontWeight: 400,
                fontSize: '22px',
                lineHeight: 1.3,
                color: '#ffffff',
                marginBottom: '20px',
              }}>
                {metier.titre}
              </h2>

              {/* Description */}
              <p style={{
                fontFamily: 'Georgia, Times New Roman, serif',
                fontSize: '16px',
                lineHeight: 1.85,
                color: '#aaaaaa',
              }}>
                {metier.description}
              </p>
            </div>
          ))}
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.047)', margin: '80px 0 64px' }} />

        {/* CTA */}
        <div style={{ textAlign: 'center' as const }}>
          <p style={{
            fontFamily: 'Georgia, Times New Roman, serif',
            fontSize: '17px',
            lineHeight: 1.85,
            color: '#c8c8c8',
            marginBottom: '32px',
          }}>
            Ces métiers n&apos;existent pas encore.<br />
            TEL les rend nécessaires.<br />
            Contactez-nous si vous voulez les inventer avec nous.
          </p>

          <a
            href="mailto:contact@theexperiencelayer.org"
            style={{
              display: 'inline-block',
              fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
              fontSize: '12px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase' as const,
              color: '#C9A84C',
              textDecoration: 'none',
              borderBottom: '1px solid rgba(201,168,76,0.3)',
              paddingBottom: '2px',
            }}
          >
            contact@theexperiencelayer.org
          </a>
        </div>

        {/* Footer note */}
        <div style={{ marginTop: '80px', paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.047)' }}>
          <Link
            href="/"
            style={{
              fontSize: '12px',
              color: '#333',
              textDecoration: 'none',
              fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
            }}
          >
            ← theexperiencelayer.org
          </Link>
        </div>
      </article>
    </main>
  )
}
