/**
 * 슈퍼에디터 모바일 업로드용 공유 상태
 *
 * Next.js App Router는 라우트마다 별도 청크를 생성한다.
 * 라우트 파일에 Map을 정의하면 청크별로 인스턴스가 달라지므로
 * 공유가 필요한 상태는 반드시 lib/ 에 두어야 한다.
 */

const TTL_MS = 15 * 60 * 1000; // 15분

export interface MobileTokenEntry {
  orderId: string;
  userId:  string;
  exp:     number;
}

// ── 토큰 스토어 ─────────────────────────────────────────────────────────────
const tokenStore = new Map<string, MobileTokenEntry>();

function gcTokens() {
  const now = Date.now();
  for (const [k, v] of tokenStore) {
    if (v.exp < now) tokenStore.delete(k);
  }
}

export function saveToken(token: string, entry: Omit<MobileTokenEntry, 'exp'>) {
  gcTokens();
  tokenStore.set(token, { ...entry, exp: Date.now() + TTL_MS });
}

export function validateToken(token: string): MobileTokenEntry | null {
  const entry = tokenStore.get(token);
  if (!entry || entry.exp < Date.now()) return null;
  return entry;
}

// ── SSE 채널 ─────────────────────────────────────────────────────────────────
const enc = new TextEncoder();

// orderId → Set<controller>
const sseChannels = new Map<string, Set<ReadableStreamDefaultController>>();

export function registerSseChannel(orderId: string, ctrl: ReadableStreamDefaultController) {
  if (!sseChannels.has(orderId)) sseChannels.set(orderId, new Set());
  sseChannels.get(orderId)!.add(ctrl);
}

export function unregisterSseChannel(orderId: string, ctrl: ReadableStreamDefaultController) {
  sseChannels.get(orderId)?.delete(ctrl);
  if (sseChannels.get(orderId)?.size === 0) sseChannels.delete(orderId);
}

export function notifyChannel(orderId: string, data: object) {
  const controllers = sseChannels.get(orderId);
  if (!controllers) return;
  const payload = enc.encode(`data: ${JSON.stringify(data)}\n\n`);
  for (const ctrl of controllers) {
    try { ctrl.enqueue(payload); } catch { /* 연결 끊김 */ }
  }
}

export function keepalivePayload(): Uint8Array {
  return enc.encode(': keepalive\n\n');
}

export function ssePayload(data: object): Uint8Array {
  return enc.encode(`data: ${JSON.stringify(data)}\n\n`);
}
