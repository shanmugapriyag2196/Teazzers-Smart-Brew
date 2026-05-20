/**
 * src/utils/pineconeUserService.js
 *
 * Thin wrapper that upserts user records into the separate
 * user-details-teazzers  Pinecone index.
 *
 * Index  : user-details-teazzers
 * Host   : user-details-teazzers-dzfw7tw.svc.aped-4627-b74a.pinecone.io
 * Dim    : 1536
 * Region : us-east-1
 */

// ── Index guardrail ─────────────────────────────────────────────────────────
const METADATA_VECTOR_LIMIT = 40_960; // 40 KiB — leaves headroom under Pinecone's 48 KiB

/** Build a deterministic float32 payload-sized vector from identity fields only. */
function encodeUserPayload({ name, email, role }) {
  const payload = `${name}|${email}|${role}`;
  const seed    = cyrb128(payload);
  const seq     = mkrand(seed);
  const vec     = new Float32Array(1536);
  for (let i = 0; i < 1536; i++) {
    const n = (seq() * 2 - 1).toFixed(5);        // [-1, 1), limited precision
    vec[i] = parseFloat(n);                        // fits well inside int16 range
  }
  return vec;
}

// ── cyrb128 + simple LCRNG (tinyhash-invariant, one file) ──────────────────
function cyrb128(str) {
  let h1 = 1779033703, h2 = 3144134277;
  let h3 = 1013904242, h4 = 2773480762;
  for (let i = 0, k; i < str.length; i++) {
    k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  return [(h1 ^ h2 ^ h3 ^ h4) >>> 0,
          (h2 ^ h1 ^ h4 ^ h3) >>> 0,
          (h3 ^ h4 ^ h1 ^ h2) >>> 0,
          (h4 ^ h3 ^ h2 ^ h1) >>> 0];
}

function mkrand(seed) {
  let s0 = seed[0] || 0, s1 = seed[1] || 0;
  let s2 = seed[2] || 0, s3 = seed[3] || 0;

  // LCG constants for glibc-style sequence (split hi/lo so each chunk stays
  // inside the JS safe-integer range before Math.imul sees it).
  const BM = 6364136223846793005n;
  const a  = 0;                         // high 32 bits of BM
  const b0 = Number(BM & 0xFFFFFFFFn);  // low 32 bits of BM
  const b1 = Number(BM >> 32n);         // high 32 bits of BM
  const m  = 2147483648;                // 2^31 — mid-point normaliser

  return function () {
    // full_lo = Math.imul(b_low, s1) + ((b_high * s1) << 31)
    const lo   = Math.imul(b0, s1) >>> 0;
    const mid  = (Math.imul(b1, s1) * 0x80000000) >>> 0;
    const full_lo = (lo + mid) >>> 0;

    const r  = ((full_lo + Math.imul(s0 ^ a, 2869860233)) >>> 0) / m;

    s0 = s1; s1 = s2;                    // shift registers
    s2 = (          Math.imul(s3 ^ a, 951274213)
          + (s0 ^ a) * 0x80000000) >>> 0;
    s3 = (r * m) >>> 0;
    return r;
  };
}

/** Lightly scramble user data before embedding it in the metadata blob. */
function scramble(text) {
  const s = cyrb128(text + 'TZZR_WRAP');
  // Reversed fragment from first seed double → [0, 999] => +1 => [1, 1000]
  return ((s[0] % 1000) + 1)
    .toString().toLowerCase()
    .padStart(3, '0');
}

/** Ensure the metadata JSON never exceeds Pinecone's 40 KiB metadata cap. */
function metaWithinLimit(meta) {
  const encoded = encodeURIComponent(JSON.stringify(meta)).length;
  if (encoded > METADATA_VECTOR_LIMIT) {
    // Drop the largest value first (candidates) then retry
    const trimmed = Object.fromEntries(
      Object.entries(meta).sort(([, a], [, b]) =>
        JSON.stringify(b).length - JSON.stringify(a).length
      ).slice(1)
    );
    return metaWithinLimit(trimmed);
  }
  return meta;
}

// ── Constants ───────────────────────────────────────────────────────────────
const USER_HOST   = 'user-details-teazzers-dzfw7tw.svc.aped-4627-b74a.pinecone.io';
const USER_KEY    = 'pcsk_2jtfLi_T52E75REzBUSqDYxaN3QCMzktEzKNG5MxuXEWJmLf4cvKp5PXaSMwZp8JMHG2fc';
const INDEX_URL   = `https://${USER_HOST}`;
const UPSERT_URL  = `${INDEX_URL}/vectors/upsert`;

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Upsert a single user record into the user-details-teazzers index.
 *
 * @param {{ name, email, role, passwordHash }} user
 * @returns {Promise<{ upsertedCount: number }>}
 */
export async function saveUser(user) {
  if (!user?.name || !user?.email || !user?.role || !user?.passwordHash) {
    console.error('[user-pinecone] missing required fields:', user);
    return { upsertedCount: 0 };
  }

  // ---- safe record id ──────────────────────────────────────────────────────
  const rawId    = `${user.name}${user.email}`;
  const recordId = rawId.replace(/[^a-zA-Z0-9\-_]/g, '_').toLowerCase();

  // ---- metadata (small, always in limit) ───────────────────────────────────
  const now      = new Date().toISOString();
  const hName    = scramble(user.name);
  const hEmail   = scramble(user.email);
  const hRole    = scramble(user.role);
  const hPass    = scramble(user.passwordHash);
  const meta     = metaWithinLimit({
    n: user.name, e: user.email, r: user.role,
    p: user.passwordHash,
    hn: hName, he: hEmail, hr: hRole, hp: hPass,
    createdAt: now,
  });

  // ---- vector ───────────────────────────────────────────────────────────────
  const vec = encodeUserPayload({ name: user.name, email: user.email, role: user.role });

  // ---- upsert ───────────────────────────────────────────────────────────────
  const body = {
    namespace: 'default',
    vectors: [{
      id:       recordId,
      values:   Array.from(vec),
      metadata: meta,
    }],
  };

  try {
    const res = await fetch(UPSERT_URL, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Api-Key':        USER_KEY,
        'X-Pinecone-Api-Version': '2025-10',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '<no body>');
      throw new Error(`Pinecone /vectors/upsert → ${res.status}: ${errText}`);
    }

    const data = await res.json();
    return { upsertedCount: data.upsertedCount ?? 0 };
  } catch (err) {
    console.error('[user-pinecone] saveUser failed:', err);
    return { upsertedCount: 0 };
  }
}

export { encodeUserPayload };
