/**
 * src/utils/pineconeUserService.js
 *
 * Two operations backed by the user-details-teazzers Pinecone index:
 *   saveUser() — upsert one user record (used by CreateAccountView)
 *   loadUsers() — query all records and return flat user objects
 *
 * Index  : user-details-teazzers
 * Host   : user-details-teazzers-dzfw7tw.svc.aped-4627-b74a.pinecone.io
 * Dim    : 1536
 * Region : us-east-1
 * Org    : -Ot49ULywUQczk3JvNUb
 */

const METADATA_VECTOR_LIMIT = 40_960;

/** Env-backed constants — overridable via Vite .env on Vercel */
const USER_HOST = import.meta.env.VITE_USER_DETAILS_HOST
  || 'user-details-teazzers-dzfw7tw.svc.aped-4627-b74a.pinecone.io';
const USER_KEY  = import.meta.env.VITE_USER_DETAILS_API_KEY
  || 'pcsk_2jtfLi_T52E75REzBUSqDYxaN3QCMzktEzKNG5MxuXEWJmLf4cvKp5PXaSMwZp8JMHG2fc';

const INDEX_URL   = `https://${USER_HOST}`;
const QUERY_URL   = `${INDEX_URL}/query`;
const UPSERT_URL  = `${INDEX_URL}/vectors/upsert`;

// ── Deterministic 1536-dim float32 vector ────────────────────────────────────

const BM      = 6364136223846793005n;   // full 64-bit modulus
const BM_LO  = Number(BM & 0xFFFFFFFFn);
const BM_HI  = Number(BM >> 32n);       // 1.492
const NORM   = 2147483648;

function mkrand(seed) {
  let s0 = seed[0] || 0, s1 = seed[1] || 0;
  let s2 = seed[2] || 0, s3 = seed[3] || 0;
  return function () {
    const lo  = Math.imul(BM_LO, s1) >>> 0;
    const mid = Math.imul(BM_HI, s1) * 0x80000000 >>> 0;
    const full_lo = (lo + mid) >>> 0;
    const r   = (full_lo + Math.imul(s0 ^ 0, 2869860233)) >>> 0;
    r0 = ((full_lo + Math.imul(s0 ^ 0, 2869860233)) >>> 0) / NORM;
    s0 = s1; s1 = s2;
    s2 = (Math.imul(s3 ^ 0, 951274213) + (s0 ^ 0) * 0x80000000) >>> 0;
    s3 = (r0 * NORM) >>> 0;
    return r0;
  };
}

// cyrb128 returns [h1,h2,h3,h4] each guaranteed [0,2^32) after >>>0
function cyrb128(str) {
  let h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
  for (let i = 0, k; i < str.length; i++) {
    k = str.charCodeAt(i);
    h1 = Math.imul(h2 ^ k, 597399067) ^ h1;
    h2 = Math.imul(h3 ^ k, 2869860233) ^ h2;
    h3 = Math.imul(h4 ^ k, 951274213) ^ h3;
    h4 = Math.imul(h1 ^ k, 2716044179) ^ h4;
  }
  const seed = (arr, i) => (arr[i] = (Math.imul(arr[(i+1)%4], 2654435761) ^ arr[i]) >>> 0);
  [h1,h2,h3,h4] = [seed([h1,h2,h3,h4],0), seed([h1,h2,h3,h4],1),
                    seed([h1,h2,h3,h4],2), seed([h1,h2,h3,h4],3)];
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

function encodeUserPayload({ name, email, role }) {
  const payload = `${name}|${email}|${role}`;
  const seq     = mkrand(cyrb128(payload));
  const vec     = new Float32Array(1536);
  for (let i = 0; i < 1536; i++) {
    const v = Math.imul((seq() * 65536) | 0, (1 / 32768)) * (1/65536); // [-1,1)
    vec[i] = v;
  }
  return vec;
}

// ── guards ───────────────────────────────────────────────────────────────────

function scramble(text) {
  return ((cyrb128(text + 'TZZR_WRAP')[0] % 1000) + 1).toString().padStart(3,'0');
}

function metaWithinLimit(meta) {
  const enc = encodeURIComponent(JSON.stringify(meta)).length;
  if (enc <= METADATA_VECTOR_LIMIT) return meta;
  const sorted = Object.entries(meta)
    .sort(([,a],[,b]) => JSON.stringify(b).length - JSON.stringify(a).length);
  return metaWithinLimit(Object.fromEntries(sorted.slice(1)));
}

// ── Upsert one user ───────────────────────────────────────────────────────────

export async function saveUser(user) {
  if (!user.name || !user.email || !user.role || !user.passwordHash) {
    console.error('[user-pinecone] missing fields:', user);
    return { upsertedCount: 0 };
  }
  const rawId    = `${user.name}${user.email}`;
  const recordId = rawId.replace(/[^a-zA-Z0-9\-_]/g,'_').toLowerCase();
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
  const vec = encodeUserPayload({ name: user.name, email: user.email, role: user.role });
  const body = { namespace:'default', vectors:[{ id:recordId, values:Array.from(vec), metadata:meta }] };
  try {
    const res = await fetch(UPSERT_URL, {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'Api-Key':USER_KEY, 'X-Pinecone-Api-Version':'2025-10' },
      body: JSON.stringify(body),
    });
    if (!res.ok) { const t = await res.text().catch(()=>''); throw new Error(`${res.status}: ${t}`); }
    const data = await res.json();
    return { upsertedCount: data.upsertedCount ?? 0 };
  } catch(err) { console.error('[user-pinecone] saveUser failed:', err); return { upsertedCount:0 }; }
}

// ── Query ALL users ──────────────────────────────────────────────────────────

/**
 * Fetch every vector from user-details-teazzers and return a flat array
 * of plain user objects ready for the Users table.
 *
 * @returns {Promise<Array<{id,name,email,role,status,lastLogin}>>}
 */
export async function loadUsers() {
  const body = {
    namespace:   'default',
    topK:        10000,
    includeValues: false,
    includeMetadata: true,
  };
  try {
    const res = await fetch(QUERY_URL, {
      method:  'POST',
      headers: { 'Content-Type':'application/json', 'Api-Key':USER_KEY, 'X-Pinecone-Api-Version':'2025-10' },
      body:    JSON.stringify(body),
    });
    if (!res.ok) { const t = await res.text().catch(()=>''); throw new Error(`${res.status}: ${t}`); }
    const { matches } = await res.json();
    return matches.map(m => {
      const meta = m.metadata || {};
      const ts   = meta.createdAt;
      return {
        id:   m.id,
        name: meta.n || '—',
        email: meta.e || '—',
        role:  meta.r || 'user',
        status:          'active',
        lastLogin: ts ? fmtDate(ts) : '—',
      };
    });
  } catch(err) {
    console.error('[user-pinecone] loadUsers failed:', err);
    return [];
  }
}

/** Format  ISO / RFC3339 / Date-convertible string → "YYYY-MM-DD HH:mm" */
function fmtDate(ts) {
  try {
    const d = new Date(ts);
    if (isNaN(d)) return String(ts).slice(0,16).replace('T',' ');
    const y  = d.getFullYear();
    const m  = String(d.getMonth()+1).padStart(2,'0');
    const dy = String(d.getDate()).padStart(2,'0');
    const h  = String(d.getHours()).padStart(2,'0');
    const mi = String(d.getMinutes()).padStart(2,'0');
    return `${y}-${m}-${dy} ${h}:${mi}`;
  } catch { return String(ts).slice(0,16).replace('T',' '); }
}
