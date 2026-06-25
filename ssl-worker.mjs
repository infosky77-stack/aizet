/**
 * AIZET SSL Worker
 *
 * AZOS 노드로 등록 → issue-ssl 태스크 폴링 → certbot 실행 →
 * nginx 도메인별 SSL 설정 생성 → AIZET API 콜백
 *
 * 실행 방법 (root 권한 필요):
 *   sudo pm2 start /root/aizet/ssl-worker.mjs --name aizet-ssl-worker
 *   sudo pm2 save
 */

import { execSync }                   from 'child_process';
import { writeFileSync, existsSync }  from 'fs';

const AZOS         = process.env.AZOS_URL      ?? 'http://localhost:8080';
const AIZET        = process.env.NEXTAUTH_URL  ?? 'https://aizet.co.kr';
const AZOS_SECRET  = process.env.AZOS_SECRET   ?? '';
const ADMIN_EMAIL  = process.env.ADMIN_EMAIL   ?? 'admin@aizet.co.kr';
const WORKER_ADDR  = '127.0.0.1:9100';
const WORKER_LABEL = 'aizet-ssl-worker';
const POLL_MS      = 10_000;

// ── AZOS API 헬퍼 ─────────────────────────────────────────────────────────────
const azos = async (method, path, body) => {
  const res = await fetch(`${AZOS}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`AZOS ${method} ${path} → ${res.status}`);
  return res.json();
};

// ── AZOS 시작 대기 ────────────────────────────────────────────────────────────
async function waitForAzos(maxSecs = 60) {
  for (let i = 0; i < maxSecs; i += 2) {
    try {
      await fetch(`${AZOS}/status`);
      console.log('[ssl-worker] AZOS ready');
      return;
    } catch {
      console.log(`[ssl-worker] waiting for AZOS... (${i}s)`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  throw new Error('AZOS did not start in time');
}

// ── AZOS 노드 등록 ────────────────────────────────────────────────────────────
async function registerNode() {
  const n = await azos('POST', '/nodes', { address: WORKER_ADDR, label: WORKER_LABEL });
  console.log(`[ssl-worker] registered as AZOS node ${n.id}`);
  return n.id;
}

// ── nginx SSL 설정 파일 생성 ──────────────────────────────────────────────────
function writeNginxSslConf(domain) {
  const certDir  = `/etc/letsencrypt/live/${domain}`;
  const confPath = `/etc/nginx/sites-available/custom-${domain}`;
  const linkPath = `/etc/nginx/sites-enabled/custom-${domain}`;

  // nginx 변수($...)는 JS 템플릿 리터럴과 충돌 없음 (${} 형식만 보간됨)
  const conf = `# AIZET 커스텀 도메인 — ${domain}
# 이 파일은 ssl-worker가 자동 생성합니다. 직접 수정하지 마세요.

server {
    listen 443 ssl;
    server_name ${domain};

    ssl_certificate     ${certDir}/fullchain.pem;
    ssl_certificate_key ${certDir}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade           $http_upgrade;
        proxy_set_header   Connection        $connection_upgrade;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_set_header   X-Forwarded-Host  $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# HTTP → HTTPS 리다이렉트
server {
    listen 80;
    server_name ${domain};
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        try_files $uri =404;
    }
    location / {
        return 301 https://$host$request_uri;
    }
}
`;

  writeFileSync(confPath, conf, 'utf-8');
  // sites-enabled 심볼릭 링크 (이미 있으면 덮어쓰기)
  try { execSync(`ln -sf ${confPath} ${linkPath}`); } catch {}
  console.log(`[ssl-worker] nginx conf written: ${confPath}`);
}

// ── SSL 발급 핵심 로직 ────────────────────────────────────────────────────────
function issueSSL(domain, email) {
  // certbot: --nginx 플러그인으로 인증 후 certonly (conf는 직접 생성)
  execSync(
    `certbot certonly --nginx -d ${domain} --non-interactive --agree-tos -m ${email} --quiet`,
    { stdio: 'pipe' },
  );

  writeNginxSslConf(domain);

  execSync('nginx -t && nginx -s reload', { stdio: 'pipe' });

  // 인증서 만료일 파싱
  let sslExpiresAt;
  try {
    const out = execSync(
      `openssl x509 -enddate -noout -in /etc/letsencrypt/live/${domain}/fullchain.pem`,
    ).toString().trim();
    const m = out.match(/notAfter=(.+)/);
    if (m) sslExpiresAt = new Date(m[1]).toISOString();
  } catch {}

  return { sslExpiresAt };
}

// ── AIZET API 콜백 ────────────────────────────────────────────────────────────
async function callbackAizet(domain, success, sslExpiresAt, errorMsg) {
  try {
    await fetch(`${AIZET}/api/domains/${encodeURIComponent(domain)}/ssl`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(AZOS_SECRET ? { 'x-azos-secret': AZOS_SECRET } : {}),
      },
      body: JSON.stringify({ success, sslExpiresAt, errorMsg }),
    });
    console.log(`[ssl-worker] AIZET callback → ${domain} success=${success}`);
  } catch (e) {
    console.error('[ssl-worker] AIZET callback failed:', e.message);
  }
}

// ── 태스크 처리 ───────────────────────────────────────────────────────────────
async function processTask(task, nodeId) {
  const { domain, email = ADMIN_EMAIL } = task.payload ?? {};
  if (!domain) {
    await azos('POST', `/tasks/${task.id}/fail`, { error: 'domain missing in payload' });
    return;
  }

  console.log(`[ssl-worker] processing issue-ssl for: ${domain}`);
  await azos('POST', `/tasks/${task.id}/assign`, { node_id: nodeId });

  try {
    const { sslExpiresAt } = issueSSL(domain, email);
    await azos('POST', `/tasks/${task.id}/complete`, { result: { domain, sslExpiresAt } });
    await callbackAizet(domain, true, sslExpiresAt);
  } catch (err) {
    const errorMsg = err.stderr?.toString()?.trim() || err.message || 'SSL issuance failed';
    console.error(`[ssl-worker] issue-ssl failed (${domain}):`, errorMsg);
    await azos('POST', `/tasks/${task.id}/fail`, { error: errorMsg });
    await callbackAizet(domain, false, undefined, errorMsg);
  }
}

// ── 폴링 루프 ─────────────────────────────────────────────────────────────────
async function pollLoop(nodeId) {
  console.log(`[ssl-worker] polling AZOS every ${POLL_MS / 1000}s for issue-ssl tasks`);

  while (true) {
    try {
      await azos('POST', `/nodes/${nodeId}/heartbeat`).catch(() => {});

      const data = await azos('GET', '/tasks');
      const tasks = data.tasks ?? [];
      const pending = tasks
        .filter(t => t.kind === 'issue-ssl' && t.status === 'pending')
        .sort((a, b) => b.priority - a.priority);

      if (pending.length > 0) {
        await processTask(pending[0], nodeId);
      }
    } catch (e) {
      console.error('[ssl-worker] poll error:', e.message);
    }

    await new Promise(r => setTimeout(r, POLL_MS));
  }
}

// ── 진입점 ────────────────────────────────────────────────────────────────────
console.log('[ssl-worker] starting...');
await waitForAzos();
const nodeId = await registerNode();
await pollLoop(nodeId);
