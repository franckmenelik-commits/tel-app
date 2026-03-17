// TEL — The Experience Layer
// lib/rate-limit.ts
// In-memory rate limiting — 10 requests per IP per hour

interface RateLimitEntry {
  count: number
  windowStart: number
}

// In-memory store (resets on server restart, suitable for single-instance)
const store = new Map<string, RateLimitEntry>()

// Clean old entries every 5 minutes to prevent memory leaks
let cleanupInterval: ReturnType<typeof setInterval> | null = null

function ensureCleanup() {
  if (cleanupInterval) return
  cleanupInterval = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of Array.from(store.entries())) {
      if (now - entry.windowStart > WINDOW_MS * 2) {
        store.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}

// ─── Config ───────────────────────────────────────────────────────────────────
const MAX_REQUESTS = 10       // Max requests per IP per window
const WINDOW_MS = 60 * 60 * 1000  // 1 hour

// ─── URL private IP validation ────────────────────────────────────────────────
// Prevent SSRF attacks

const PRIVATE_IP_PATTERNS = [
  /^https?:\/\/localhost/i,
  /^https?:\/\/127\./,
  /^https?:\/\/0\.0\.0\.0/,
  /^https?:\/\/10\./,
  /^https?:\/\/172\.(1[6-9]|2[0-9]|3[01])\./,
  /^https?:\/\/192\.168\./,
  /^https?:\/\/::1/,
  /^https?:\/\/\[::1\]/,
  /^https?:\/\/169\.254\./,  // Link-local
  /^https?:\/\/fd[0-9a-f]{2}:/i,  // IPv6 unique local
]

export function isPrivateUrl(url: string): boolean {
  return PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(url))
}

export function validateUrls(urls: string[]): { valid: boolean; reason?: string } {
  for (const url of urls) {
    // Must start with http or https
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return { valid: false, reason: `URL invalide: ${url.slice(0, 60)}` }
    }
    // Block private/local IPs
    if (isPrivateUrl(url)) {
      return { valid: false, reason: 'URLs vers des adresses privées ou locales non autorisées.' }
    }
    // Basic length check
    if (url.length > 2048) {
      return { valid: false, reason: 'URL trop longue (max 2048 caractères).' }
    }
  }
  return { valid: true }
}

// ─── Rate limiter ─────────────────────────────────────────────────────────────

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number  // Unix timestamp ms
  reason?: string
}

export function checkRateLimit(ip: string): RateLimitResult {
  ensureCleanup()

  const now = Date.now()
  const entry = store.get(ip)

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    // New window
    store.set(ip, { count: 1, windowStart: now })
    return {
      allowed: true,
      remaining: MAX_REQUESTS - 1,
      resetAt: now + WINDOW_MS,
    }
  }

  if (entry.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.windowStart + WINDOW_MS,
      reason: `Limite atteinte : ${MAX_REQUESTS} croisements par heure. Réessayez dans ${Math.ceil((entry.windowStart + WINDOW_MS - now) / 60000)} minutes.`,
    }
  }

  entry.count++
  store.set(ip, entry)

  return {
    allowed: true,
    remaining: MAX_REQUESTS - entry.count,
    resetAt: entry.windowStart + WINDOW_MS,
  }
}

// ─── Extract IP from Next.js request ─────────────────────────────────────────

export function extractIp(request: Request): string {
  // Check forwarded headers (Cloudflare, nginx proxy)
  const cfConnectingIp = request.headers.get('CF-Connecting-IP')
  if (cfConnectingIp) return cfConnectingIp

  const xForwardedFor = request.headers.get('X-Forwarded-For')
  if (xForwardedFor) {
    // Take the first IP in the chain (client IP)
    return xForwardedFor.split(',')[0].trim()
  }

  const xRealIp = request.headers.get('X-Real-IP')
  if (xRealIp) return xRealIp

  // Fallback
  return 'unknown'
}
