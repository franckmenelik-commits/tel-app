# TEL — Déploiement sur Hetzner Helsinki via Coolify

> *"Babel a dispersé les langages. TEL rassemble les vécus."*

---

## Infrastructure

| Composant | Détail |
|-----------|--------|
| Serveur | Hetzner Cloud — Helsinki (hel1) |
| Coolify | 204.168.164.40:8000 |
| Domaine | theexperiencelayer.org |
| DNS | Cloudflare |
| Container | Docker (node:20-alpine, standalone) |

---

## 1. Préparation locale

```bash
# Vérifier SOUFFLE
npm run check-souffle

# Build de vérification
npm run build

# Commit
git add -A
git commit -m "feat: TEL Phase 1 — production ready"
git push origin main
```

---

## 2. Variables d'environnement (Coolify)

Dans Coolify → Application → Environment Variables :

```
ANTHROPIC_API_KEY=sk-ant-...
MISTRAL_API_KEY=...
NEXT_PUBLIC_APP_URL=https://theexperiencelayer.org
NODE_ENV=production

# Optionnel
YOUTUBE_API_KEY=...
NEXT_PUBLIC_UMAMI_SITE_ID=...
OLLAMA_URL=http://localhost:11434
```

**Note**: Le Niveau 1 (Ollama local) n'est pas disponible en déploiement serverless/Docker standard.
Configurez au minimum `MISTRAL_API_KEY` ou `ANTHROPIC_API_KEY`.

---

## 3. Déploiement via Coolify

### Option A — GitHub (recommandé)

1. Ouvrir Coolify : http://204.168.164.40:8000
2. New Resource → Application → GitHub
3. Repository : `votre-compte/the-experience-layer`
4. Branch : `main`
5. Build Pack : **Dockerfile**
6. Port : `3000`
7. Domain : `theexperiencelayer.org`
8. Add variables d'environnement (voir ci-dessus)
9. Deploy

### Option B — Docker manuel

```bash
# Sur le serveur Hetzner
ssh root@204.168.164.40

# Build et run
docker build -t tel-app https://github.com/votre-compte/the-experience-layer.git
docker run -d \
  --name tel \
  -p 3000:3000 \
  --env-file /root/tel/.env.production \
  --restart unless-stopped \
  tel-app
```

---

## 4. Configuration Cloudflare DNS

Dans Cloudflare → DNS pour `theexperiencelayer.org` :

| Type | Nom | Contenu | Proxy |
|------|-----|---------|-------|
| A | @ | `IP_HETZNER` | ☁️ Proxied |
| A | www | `IP_HETZNER` | ☁️ Proxied |
| CNAME | analytics | `analytics.umami.is` | DNS only |

**SSL/TLS** : Full (strict) — Cloudflare gère le certificat.

---

## 5. Coolify — Configuration avancée

```yaml
# Dans Coolify, configuration Nginx (si nécessaire)
# Pour les SSE (Server-Sent Events), désactiver le buffering :
proxy_buffering off;
proxy_cache off;
proxy_read_timeout 120s;
X-Accel-Buffering: no;
```

---

## 6. Vérification post-déploiement

```bash
# Health check
curl https://theexperiencelayer.org/api/health

# Réponse attendue:
# {"ok":true,"souffle":{"niveau1":false,"niveau2":true,"niveau3":true}}

# Test d'un croisement minimal
curl -X POST https://theexperiencelayer.org/api/cross \
  -H "Content-Type: application/json" \
  -d '{"inputs":["Darwin × bouddhisme"],"contexte":"exploration"}'
```

---

## 7. Monitoring

### Umami (analytics éthique)
- Dashboard : https://analytics.umami.is
- Aucun cookie, aucune donnée personnelle collectée
- Conforme RGPD par design

### Logs Coolify
- Coolify → Application → Logs
- Rechercher : `[SOUFFLE]` pour les erreurs LOGOS
- Rechercher : `[TEL /api/cross]` pour les erreurs d'API

---

## 8. Mise à jour

```bash
# En local
git add -A && git commit -m "fix: ..." && git push

# Coolify redéploie automatiquement sur push (si webhook configuré)
# Sinon : Coolify → Application → Redeploy
```

---

## Phase 2 (à venir)

- Supabase : persistance des croisements (`SUPABASE_URL`, `SUPABASE_ANON_KEY`)
- pgvector : recherche sémantique des croisements passés
- Supabase Realtime : Living Map en temps réel
- API publique TEL

---

*Helsinki · Hetzner · Infrastructure éthique — pas AWS, pas Google Cloud.*
