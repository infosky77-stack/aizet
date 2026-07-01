export interface CertificationLetterData {
  senderName: string;
  senderAddress: string;
  recipientName: string;
  recipientAddress: string;
  subject: string;
  content: string;
  date: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function generateCertificationLetter(data: CertificationLetterData): string {
  const contentHtml = escapeHtml(data.content)
    .split('\n')
    .map(line => `<p>${line || '&nbsp;'}</p>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap" rel="stylesheet">
  <!-- 400=Regular(본문), 500=Medium(레이블), 700=Bold(제목·강조) -->
  <title>내용증명</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', sans-serif;
      font-weight: 400;
      font-size: 11pt;
      line-height: 1.8;
      color: #111;
      background: #fff;
    }
    .title {
      text-align: center;
      font-size: 22pt;
      font-weight: 700;
      letter-spacing: 0.5em;
      padding-bottom: 14px;
      border-bottom: 2.5px solid #111;
      margin-bottom: 28px;
    }
    .parties {
      display: flex;
      margin-bottom: 22px;
    }
    .party-box {
      flex: 1;
      border: 1px solid #666;
      padding: 14px 18px;
    }
    .party-box + .party-box {
      border-left: none;
    }
    .party-label {
      font-size: 9.5pt;
      font-weight: 500;
      color: #555;
      letter-spacing: 0.15em;
      margin-bottom: 7px;
    }
    .party-name {
      font-size: 12pt;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .party-address {
      font-size: 10pt;
      color: #555;
      line-height: 1.5;
    }
    .subject-row {
      font-size: 11.5pt;
      font-weight: 700;
      padding: 10px 0;
      border-top: 1px solid #ccc;
      border-bottom: 1px solid #ccc;
      margin-bottom: 24px;
    }
    .subject-label {
      color: #555;
      font-weight: 500;
      margin-right: 8px;
    }
    .content {
      font-size: 11pt;
      font-weight: 400;
      line-height: 2;
      min-height: 180px;
      margin-bottom: 40px;
    }
    .content p { margin-bottom: 2px; }
    .footer {
      border-top: 1px solid #ccc;
      padding-top: 20px;
      text-align: right;
    }
    .footer-date {
      font-size: 11pt;
      margin-bottom: 18px;
      color: #333;
    }
    .footer-sender {
      font-size: 12pt;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
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
      padding: 11px 15px;
      border: 1px dashed #bbb;
      font-size: 8.5pt;
      color: #888;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="title">내 용 증 명</div>

  <div class="parties">
    <div class="party-box">
      <div class="party-label">수 신 인</div>
      <div class="party-name">${escapeHtml(data.recipientName)}</div>
      <div class="party-address">${escapeHtml(data.recipientAddress)}</div>
    </div>
    <div class="party-box">
      <div class="party-label">발 신 인</div>
      <div class="party-name">${escapeHtml(data.senderName)}</div>
      <div class="party-address">${escapeHtml(data.senderAddress)}</div>
    </div>
  </div>

  <div class="subject-row">
    <span class="subject-label">제 목</span>${escapeHtml(data.subject)}
  </div>

  <div class="content">${contentHtml}</div>

  <div class="footer">
    <div class="footer-date">${escapeHtml(data.date)}</div>
    <div class="footer-sender">
      발신인&nbsp;${escapeHtml(data.senderName)}
      <span class="seal">인</span>
    </div>
  </div>

  <div class="notice">
    ※ 본 내용증명은 우체국 내용증명 서비스 또는 공증인을 통해 발송하시면 법적 효력이 발생합니다.<br>
    법무사 에이젯 · AIZET 플랫폼 데모 — 본 문서는 실제 법률 효력이 없으며 참고용으로만 활용하시기 바랍니다.
  </div>
</body>
</html>`;
}
