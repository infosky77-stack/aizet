export interface ArticlesOfIncorporationData {
  companyName: string;
  address: string;
  purposes: string;          // 개행(\n) 구분
  capital: string;           // 숫자 문자열 (원)
  parValue: string;          // 숫자 문자열 (원)
  totalShares: string;       // 숫자 문자열 (주)
  authorizedShares?: string; // 숫자 문자열 (주), 없으면 totalShares × 4
  ceoName: string;
  incorporationDate: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function fmtNum(s: string): string {
  const n = parseInt(s.replace(/[^0-9]/g, ''), 10);
  return isNaN(n) ? s : n.toLocaleString('ko-KR');
}

export function generateArticlesOfIncorporation(data: ArticlesOfIncorporationData): string {
  const totalSharesNum = parseInt(data.totalShares.replace(/[^0-9]/g, ''), 10) || 0;
  const authorizedNum  = data.authorizedShares && data.authorizedShares.trim()
    ? parseInt(data.authorizedShares.replace(/[^0-9]/g, ''), 10) || totalSharesNum * 4
    : totalSharesNum * 4;

  const purposeLines = data.purposes
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(l => l.replace(/^[\d]+[\.\)、]\s*/, ''));

  const purposeHtml = purposeLines
    .map((line, i) => `        <li>${i + 1}. ${escapeHtml(line)}</li>`)
    .join('\n');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap" rel="stylesheet">
  <title>정관 - ${escapeHtml(data.companyName)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', sans-serif;
      font-weight: 400;
      font-size: 10.5pt;
      line-height: 1.9;
      color: #111;
      background: #fff;
    }
    .doc-title {
      text-align: center;
      font-size: 26pt;
      font-weight: 700;
      letter-spacing: 1em;
      margin-bottom: 8px;
    }
    .doc-company {
      text-align: center;
      font-size: 15pt;
      font-weight: 700;
      margin-bottom: 32px;
      letter-spacing: 0.1em;
    }
    .chapter {
      text-align: center;
      font-size: 11.5pt;
      font-weight: 700;
      margin: 26px 0 14px 0;
      padding: 7px 0;
      border-top: 2px solid #222;
      border-bottom: 2px solid #222;
      letter-spacing: 0.4em;
      page-break-after: avoid;
    }
    .addendum-title {
      text-align: center;
      font-size: 11.5pt;
      font-weight: 700;
      margin: 26px 0 14px 0;
      padding: 7px 0;
      border-top: 2px solid #222;
      border-bottom: 2px solid #222;
      letter-spacing: 0.8em;
      page-break-after: avoid;
    }
    .article {
      margin-bottom: 12px;
      page-break-inside: avoid;
    }
    .article-title {
      font-weight: 700;
      font-size: 10.5pt;
      margin-bottom: 2px;
    }
    .article-body {
      font-weight: 400;
      padding-left: 2em;
      line-height: 1.85;
    }
    .article-body ol {
      list-style: none;
      padding: 0;
      margin-top: 4px;
    }
    .article-body ol li {
      padding-left: 1.8em;
      text-indent: -1.8em;
      margin-bottom: 2px;
    }
    .footer {
      margin-top: 40px;
      border-top: 1px solid #ccc;
      padding-top: 22px;
      text-align: center;
    }
    .footer-date {
      font-size: 11pt;
      margin-bottom: 20px;
    }
    .footer-sig {
      font-size: 12pt;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }
    .seal {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 38px;
      height: 38px;
      border: 1.5px solid #111;
      border-radius: 50%;
      font-size: 10pt;
      font-weight: 500;
      color: #c00;
      flex-shrink: 0;
    }
    .notice {
      margin-top: 36px;
      padding: 10px 14px;
      border: 1px dashed #bbb;
      font-size: 8.5pt;
      color: #888;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="doc-title">정 관</div>
  <div class="doc-company">${escapeHtml(data.companyName)}</div>

  <div class="chapter">제 1 장 &nbsp; 총 칙</div>

  <div class="article">
    <div class="article-title">제 1 조 (상호)</div>
    <div class="article-body">이 회사는 "${escapeHtml(data.companyName)}"라 한다.</div>
  </div>

  <div class="article">
    <div class="article-title">제 2 조 (목적)</div>
    <div class="article-body">이 회사는 다음의 사업을 영위함을 목적으로 한다.
      <ol>
${purposeHtml}
      </ol>
    </div>
  </div>

  <div class="article">
    <div class="article-title">제 3 조 (본점의 소재지)</div>
    <div class="article-body">이 회사의 본점은 ${escapeHtml(data.address)}에 둔다.</div>
  </div>

  <div class="article">
    <div class="article-title">제 4 조 (공고의 방법)</div>
    <div class="article-body">이 회사의 공고는 회사 홈페이지(인터넷 전자공고)에 게재하며, 전자공고를 할 수 없는 경우에는 서울특별시에서 발행하는 일간신문에 게재한다.</div>
  </div>

  <div class="chapter">제 2 장 &nbsp; 주 식</div>

  <div class="article">
    <div class="article-title">제 5 조 (자본금)</div>
    <div class="article-body">이 회사의 자본금은 금 ${fmtNum(data.capital)}원으로 한다.</div>
  </div>

  <div class="article">
    <div class="article-title">제 6 조 (1주의 금액)</div>
    <div class="article-body">이 회사가 발행하는 주식 1주의 금액은 금 ${fmtNum(data.parValue)}원으로 한다.</div>
  </div>

  <div class="article">
    <div class="article-title">제 7 조 (발행주식의 총수)</div>
    <div class="article-body">이 회사의 발행주식총수는 ${fmtNum(data.totalShares)}주로 한다.</div>
  </div>

  <div class="article">
    <div class="article-title">제 8 조 (발행예정주식의 총수)</div>
    <div class="article-body">이 회사가 발행할 주식의 총수는 ${fmtNum(String(authorizedNum))}주로 한다.</div>
  </div>

  <div class="article">
    <div class="article-title">제 9 조 (주식의 종류)</div>
    <div class="article-body">이 회사가 발행하는 주식은 기명식 보통주식으로 한다.</div>
  </div>

  <div class="article">
    <div class="article-title">제 10 조 (주식의 양도)</div>
    <div class="article-body">이 회사의 주식을 양도함에 있어서는 이사회의 승인을 얻어야 한다. 단, 이사가 1인인 경우에는 대표이사의 승인으로 갈음한다.</div>
  </div>

  <div class="chapter">제 3 장 &nbsp; 주 주 총 회</div>

  <div class="article">
    <div class="article-title">제 11 조 (소집)</div>
    <div class="article-body">이 회사의 주주총회는 정기총회와 임시총회로 한다. 정기총회는 매 사업연도 종료 후 3개월 이내에, 임시총회는 필요에 따라 소집한다.</div>
  </div>

  <div class="article">
    <div class="article-title">제 12 조 (소집권자)</div>
    <div class="article-body">주주총회는 법령에 다른 규정이 있는 경우를 제외하고는 이사회의 결의에 따라 대표이사가 소집한다. 이사가 1인인 경우에는 그 이사가 소집한다.</div>
  </div>

  <div class="article">
    <div class="article-title">제 13 조 (소집통지 및 기간)</div>
    <div class="article-body">주주총회를 소집할 때에는 총회일 2주 전에 각 주주에게 서면 또는 전자문서로 통지를 발송하여야 한다. 다만, 총 주주의 동의가 있을 때에는 소집절차를 생략할 수 있다.</div>
  </div>

  <div class="article">
    <div class="article-title">제 14 조 (의결권)</div>
    <div class="article-body">이 회사의 주주는 1주마다 1개의 의결권을 가진다.</div>
  </div>

  <div class="article">
    <div class="article-title">제 15 조 (결의방법)</div>
    <div class="article-body">주주총회의 결의는 법령 또는 이 정관에 다른 규정이 있는 경우를 제외하고는 출석한 주주의 의결권의 과반수로 하되, 발행주식 총수의 4분의 1 이상의 수로 하여야 한다.</div>
  </div>

  <div class="chapter">제 4 장 &nbsp; 이 사 · 이 사 회</div>

  <div class="article">
    <div class="article-title">제 16 조 (이사의 수)</div>
    <div class="article-body">이 회사의 이사는 1인 이상 5인 이하로 한다.</div>
  </div>

  <div class="article">
    <div class="article-title">제 17 조 (이사의 선임)</div>
    <div class="article-body">이사는 주주총회에서 선임한다. 이사의 선임은 출석한 주주의 의결권의 과반수로 하되, 발행주식 총수의 4분의 1 이상의 수로 하여야 한다.</div>
  </div>

  <div class="article">
    <div class="article-title">제 18 조 (이사의 임기)</div>
    <div class="article-body">이사의 임기는 3년으로 한다. 단, 임기 중 최종의 결산기에 관한 정기주주총회의 종결 전에 임기가 만료된 경우에는 그 총회의 종결 시까지 임기가 연장된다.</div>
  </div>

  <div class="article">
    <div class="article-title">제 19 조 (대표이사)</div>
    <div class="article-body">이사가 1인인 경우에는 그 이사가 대표이사가 된다. 이사가 2인 이상인 경우에는 이사회 결의로 대표이사를 선임한다. 이 회사의 대표이사는 ${escapeHtml(data.ceoName)}으로 한다.</div>
  </div>

  <div class="chapter">제 5 장 &nbsp; 계 산</div>

  <div class="article">
    <div class="article-title">제 20 조 (사업연도)</div>
    <div class="article-body">이 회사의 사업연도는 매년 1월 1일부터 12월 31일까지로 한다.</div>
  </div>

  <div class="article">
    <div class="article-title">제 21 조 (재무제표의 작성)</div>
    <div class="article-body">대표이사는 매 결산기에 다음의 서류와 그 부속명세서 및 영업보고서를 작성하여 이사회의 승인을 받은 후 정기주주총회에 제출하여야 한다.
      <ol>
        <li>1. 대차대조표</li>
        <li>2. 손익계산서</li>
        <li>3. 자본변동표</li>
        <li>4. 현금흐름표</li>
        <li>5. 이익잉여금처분계산서 또는 결손금처리계산서</li>
      </ol>
    </div>
  </div>

  <div class="article">
    <div class="article-title">제 22 조 (이익의 처분)</div>
    <div class="article-body">이 회사의 이익금은 주주총회의 결의로 다음과 같이 처분한다.
      <ol>
        <li>1. 이익준비금</li>
        <li>2. 기타 법정적립금</li>
        <li>3. 배당금</li>
        <li>4. 기타 임의적립금</li>
      </ol>
    </div>
  </div>

  <div class="addendum-title">부 칙</div>

  <div class="article">
    <div class="article-title">제 1 조 (설립시의 발행주식과 납입금액)</div>
    <div class="article-body">이 회사를 설립할 때에 발행하는 주식은 ${fmtNum(data.totalShares)}주로 하며, 그 납입금액은 1주에 대하여 금 ${fmtNum(data.parValue)}원으로 한다.</div>
  </div>

  <div class="article">
    <div class="article-title">제 2 조 (설립 연월일)</div>
    <div class="article-body">이 회사의 설립 연월일은 ${escapeHtml(data.incorporationDate)}로 한다.</div>
  </div>

  <div class="article">
    <div class="article-title">제 3 조 (발기인)</div>
    <div class="article-body">이 회사를 설립하기 위하여 발기인 대표이사 ${escapeHtml(data.ceoName)} 이 본 정관을 작성하여 기명날인한다.</div>
  </div>

  <div class="footer">
    <div class="footer-date">${escapeHtml(data.incorporationDate)}</div>
    <div class="footer-sig">
      발기인 대표이사&nbsp;${escapeHtml(data.ceoName)}
      <span class="seal">인</span>
    </div>
  </div>

  <div class="notice">
    ※ 본 정관은 표준 양식 기반의 초안으로, 실제 법인 설립 시에는 반드시 법무사 또는 법률 전문가의 검토를 받으시기 바랍니다.<br>
    법무사 에이젯 · AIZET 플랫폼 데모 — 본 문서는 참고용이며 실제 법적 효력이 없습니다.
  </div>
</body>
</html>`;
}
