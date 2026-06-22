import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { Client, ClientFile, GeneratedLabel } from '@/types/print-files';

// ── JSON 파일 경로 ─────────────────────────────────────────────────────────────
const DATA_DIR  = join(process.cwd(), 'data');
const DATA_FILE = join(DATA_DIR, 'print-files.json');

// ── 초기 데모 데이터 ───────────────────────────────────────────────────────────
const DEMO_CLIENTS: Client[] = [
  { id: 'c-001', company: 'Acme Corporation',  country: '미국', countryCode: 'US', contactName: 'John Smith',    contactEmail: 'john@acme.com',         createdAt: new Date(Date.now() - 1000*60*60*24*30).toISOString() },
  { id: 'c-002', company: 'BMW Group',          country: '독일', countryCode: 'DE', contactName: 'Klaus Müller',  contactEmail: 'k.mueller@bmw.de',       createdAt: new Date(Date.now() - 1000*60*60*24*20).toISOString() },
  { id: 'c-003', company: 'Sony Electronics',   country: '일본', countryCode: 'JP', contactName: '田中 太郎',      contactEmail: 'tanaka@sony.co.jp',      createdAt: new Date(Date.now() - 1000*60*60*24*15).toISOString() },
  { id: 'c-004', company: 'Alibaba Group',      country: '중국', countryCode: 'CN', contactName: 'Li Wei',        contactEmail: 'li.wei@alibaba.com',     createdAt: new Date(Date.now() - 1000*60*60*24*10).toISOString() },
  { id: 'c-005', company: 'Coles Group',        country: '호주', countryCode: 'AU', contactName: 'Sarah Connor',  contactEmail: 's.connor@coles.com.au',  createdAt: new Date(Date.now() - 1000*60*60*24*5).toISOString()  },
];

const DEMO_FILES: ClientFile[] = [
  { id: 'f-001', clientId: 'c-001', product: 'Widget Pro',         filename: 'widget-pro-label-v1.ai',       fileType: '.ai',  version: 1, isLatest: false, uploadedAt: new Date(Date.now() - 1000*60*60*24*20).toISOString(), sizeBytes: 2048576,  tags: ['라벨', '인쇄용'] },
  { id: 'f-002', clientId: 'c-001', product: 'Widget Pro',         filename: 'widget-pro-label-v2.ai',       fileType: '.ai',  version: 2, isLatest: false, uploadedAt: new Date(Date.now() - 1000*60*60*24*10).toISOString(), sizeBytes: 2150000 },
  { id: 'f-003', clientId: 'c-001', product: 'Widget Pro',         filename: 'widget-pro-label-v3.ai',       fileType: '.ai',  version: 3, isLatest: true,  uploadedAt: new Date(Date.now() - 1000*60*60*24*2).toISOString(),  sizeBytes: 2300000,  tags: ['최종', '승인완료'] },
  { id: 'f-004', clientId: 'c-001', product: 'Gadget X',           filename: 'gadget-x-box.pdf',             fileType: '.pdf', version: 1, isLatest: true,  uploadedAt: new Date(Date.now() - 1000*60*60*24*5).toISOString(),  sizeBytes: 512000 },
  { id: 'f-005', clientId: 'c-002', product: 'M-Series Packaging', filename: 'm-series-box-v1.cdr',          fileType: '.cdr', version: 1, isLatest: false, uploadedAt: new Date(Date.now() - 1000*60*60*24*15).toISOString(), sizeBytes: 4096000 },
  { id: 'f-006', clientId: 'c-002', product: 'M-Series Packaging', filename: 'm-series-box-v2.cdr',          fileType: '.cdr', version: 2, isLatest: true,  uploadedAt: new Date(Date.now() - 1000*60*60*24*3).toISOString(),  sizeBytes: 4200000,  tags: ['CE인증', '최종'] },
  { id: 'f-007', clientId: 'c-002', product: '3-Series Label',     filename: '3series-label.pdf',            fileType: '.pdf', version: 1, isLatest: true,  uploadedAt: new Date(Date.now() - 1000*60*60*24*1).toISOString(),  sizeBytes: 750000 },
  { id: 'f-008', clientId: 'c-003', product: 'PlayStation Acc',    filename: 'ps-acc-label-jp.ai',           fileType: '.ai',  version: 1, isLatest: true,  uploadedAt: new Date(Date.now() - 1000*60*60*24*7).toISOString(),  sizeBytes: 1800000,  tags: ['PSE마크', 'JIS'] },
  { id: 'f-009', clientId: 'c-003', product: 'Headphone Series',   filename: 'headphone-box.ai',             fileType: '.ai',  version: 1, isLatest: false, uploadedAt: new Date(Date.now() - 1000*60*60*24*12).toISOString(), sizeBytes: 2100000 },
  { id: 'f-010', clientId: 'c-003', product: 'Headphone Series',   filename: 'headphone-box-final.ai',       fileType: '.ai',  version: 2, isLatest: true,  uploadedAt: new Date(Date.now() - 1000*60*60*24*4).toISOString(),  sizeBytes: 2250000,  tags: ['최종승인'] },
  { id: 'f-011', clientId: 'c-004', product: 'Smart Device',       filename: 'smart-device-cn-label.pdf',   fileType: '.pdf', version: 1, isLatest: true,  uploadedAt: new Date(Date.now() - 1000*60*60*24*8).toISOString(),  sizeBytes: 980000,   tags: ['CCC인증'] },
  { id: 'f-012', clientId: 'c-005', product: 'Home Goods',         filename: 'home-goods-au-v1.pdf',         fileType: '.pdf', version: 1, isLatest: true,  uploadedAt: new Date(Date.now() - 1000*60*60*24*3).toISOString(),  sizeBytes: 650000,   tags: ['RCM마크'] },
];

// ── JSON 파일 I/O ──────────────────────────────────────────────────────────────
interface PersistedState {
  clients: Client[];
  files: ClientFile[];
  labels: GeneratedLabel[];
  labelIdSeq: number;
}

function loadFromDisk(): PersistedState {
  if (existsSync(DATA_FILE)) {
    try {
      return JSON.parse(readFileSync(DATA_FILE, 'utf-8')) as PersistedState;
    } catch {
      // 파일 파손 시 데모 데이터로 복구
    }
  }
  return { clients: DEMO_CLIENTS, files: DEMO_FILES, labels: [], labelIdSeq: 1 };
}

function persist() {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DATA_FILE, JSON.stringify({ clients, files, labels, labelIdSeq }, null, 2), 'utf-8');
}

// ── 메모리 상태 (서버 기동 시 파일에서 초기화) ─────────────────────────────────
const init = loadFromDisk();
let clients    = init.clients;
let files      = init.files;
let labels     = init.labels;
let labelIdSeq = init.labelIdSeq;

// ── 공개 API ──────────────────────────────────────────────────────────────────
export function getClients(): Client[] { return [...clients]; }

export function getClient(id: string): Client | undefined { return clients.find(c => c.id === id); }

export function createClient(data: Omit<Client, 'id' | 'createdAt'>): Client {
  const client: Client = {
    ...data,
    id: `c-${String(clients.length + 1).padStart(3, '0')}`,
    createdAt: new Date().toISOString(),
  };
  clients = [...clients, client];
  persist();
  return client;
}

export function getFilesByClient(clientId: string): ClientFile[] {
  return files.filter(f => f.clientId === clientId);
}

export function addClientFile(data: Omit<ClientFile, 'id' | 'uploadedAt'>): ClientFile {
  files = files.map(f =>
    f.clientId === data.clientId && f.product === data.product
      ? { ...f, isLatest: false }
      : f
  );
  const file: ClientFile = {
    ...data,
    id: `f-${String(files.length + 1).padStart(3, '0')}`,
    uploadedAt: new Date().toISOString(),
  };
  files = [...files, file];
  persist();
  return file;
}

export function searchFiles(query: string, country?: string): { clients: Client[]; files: ClientFile[] } {
  const q = query.toLowerCase();
  const matchedClients = clients.filter(c =>
    c.company.toLowerCase().includes(q) ||
    c.country.includes(q) ||
    c.countryCode.toLowerCase().includes(q) ||
    (country ? c.countryCode.toLowerCase() === country.toLowerCase() : false)
  );
  const clientIds = matchedClients.map(c => c.id);
  const matchedFiles = files.filter(f =>
    clientIds.includes(f.clientId) ||
    f.product.toLowerCase().includes(q) ||
    f.filename.toLowerCase().includes(q) ||
    (f.tags ?? []).some(t => t.includes(q))
  );
  return { clients: matchedClients, files: matchedFiles };
}

export function getLabels(): GeneratedLabel[] { return [...labels]; }

export function getLabel(id: string): GeneratedLabel | undefined { return labels.find(l => l.id === id); }

export function saveLabel(data: Omit<GeneratedLabel, 'id' | 'createdAt'>): GeneratedLabel {
  const label: GeneratedLabel = {
    ...data,
    id: `lbl-${String(labelIdSeq++).padStart(3, '0')}`,
    createdAt: new Date().toISOString(),
  };
  labels = [...labels, label];
  persist();
  return label;
}
