import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// ── 타입 ────────────────────────────────────────────────────────────────────────
export type DomainStatus = 'pending' | 'dns_ok' | 'active' | 'error';
export type SslStatus    = 'none' | 'issuing' | 'active' | 'expired' | 'error';

export interface DomainRecord {
  domain:       string;
  userId:       string;        // Google sub
  siteSlug:     string;        // 매핑할 사이트 경로 (예: 'demo', 'hancandy')
  status:       DomainStatus;
  sslStatus:    SslStatus;
  sslTaskId?:   string;        // AZOS task id (SSL 발급 추적용)
  sslExpiresAt?: string;
  errorMsg?:    string;
  createdAt:    string;
  verifiedAt?:  string;
}

// ── JSON 파일 영속성 ────────────────────────────────────────────────────────────
const DATA_DIR  = join(process.cwd(), 'data');
const DATA_FILE = join(DATA_DIR, 'domains.json');

function loadFromDisk(): DomainRecord[] {
  if (existsSync(DATA_FILE)) {
    try {
      return JSON.parse(readFileSync(DATA_FILE, 'utf-8')) as DomainRecord[];
    } catch {
      // 파일 파손 시 빈 배열로 시작
    }
  }
  return [];
}

function persistToDisk(records: DomainRecord[]): void {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf-8');
}

// ── 메모리 상태 ─────────────────────────────────────────────────────────────────
let records: DomainRecord[] = loadFromDisk();

// 미들웨어에서 매 요청마다 조회하는 Map (active 도메인만 포함)
// domain → siteSlug
let domainMap = buildMap(records);

function buildMap(recs: DomainRecord[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const r of recs) {
    if (r.status === 'active') m.set(r.domain, r.siteSlug);
  }
  return m;
}

function save(): void {
  persistToDisk(records);
  domainMap = buildMap(records);
}

// ── 공개 API ────────────────────────────────────────────────────────────────────

/** 미들웨어용: 활성 도메인 → 슬러그 Map */
export function getDomainMap(): Map<string, string> {
  return domainMap;
}

/** 회원의 도메인 목록 */
export function getDomainsByUser(userId: string): DomainRecord[] {
  return records.filter((r) => r.userId === userId);
}

/** 단일 도메인 조회 */
export function getDomainRecord(domain: string): DomainRecord | undefined {
  return records.find((r) => r.domain === domain);
}

/** 도메인 등록 */
export function addDomain(record: DomainRecord): void {
  records = [record, ...records];
  save();
}

/** 도메인 업데이트 */
export function updateDomain(domain: string, patch: Partial<Omit<DomainRecord, 'domain' | 'userId' | 'createdAt'>>): DomainRecord | null {
  const idx = records.findIndex((r) => r.domain === domain);
  if (idx === -1) return null;
  records[idx] = { ...records[idx], ...patch };
  save();
  return records[idx];
}

/** 도메인 삭제 */
export function removeDomain(domain: string): boolean {
  const before = records.length;
  records = records.filter((r) => r.domain !== domain);
  if (records.length === before) return false;
  save();
  return true;
}
