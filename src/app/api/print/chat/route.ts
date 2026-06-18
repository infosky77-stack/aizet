import { NextRequest } from 'next/server';
import { anthropic } from '@/lib/ai/claude';
import { PRINT_PRODUCTS, PAPER_OPTIONS, COATING_OPTIONS } from '@/lib/db/print';
import { getClients } from '@/lib/db/print-files';

const encoder = new TextEncoder();
function send(data: object) {
  return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
}

function buildSystemPrompt() {
  const clients = getClients();
  const clientList = clients.map(c => `  - ${c.company} (${c.country}, ${c.countryCode}), ID: ${c.id}`).join('\n');

  return `당신은 AIZET 인쇄소의 전문 상담 AI입니다. 인쇄 관련 질문뿐 아니라 거래처 파일 검색과 수출 라벨 생성도 처리할 수 있습니다.

취급 상품:
${PRINT_PRODUCTS.map((p) => `- ${p.name}: ${p.description} (기준가 ${p.basePrice.toLocaleString()}원/${p.baseQuantity}부, 납기 ${p.turnaround})`).join('\n')}

용지 종류: ${Object.entries(PAPER_OPTIONS).map(([, v]) => `${v.label}(${v.description})`).join(', ')}
코팅 옵션: ${Object.entries(COATING_OPTIONS).map(([, v]) => v.label).join(', ')}

등록된 거래처:
${clientList}

=== PRINT_ACTION 프로토콜 ===
다음 상황에서는 반드시 응답 텍스트 안에 아래 형식으로 액션을 포함하세요:

1. 파일 검색 요청 ("파일 찾아줘", "라벨 파일 있어?", "거래처 파일" 등):
<<<PRINT_ACTION>>>{"type":"SEARCH_FILES","query":"검색어","country":"국가코드(선택)"}<<<END_PRINT_ACTION>>>

2. 라벨 생성 요청 ("라벨 만들어줘", "수출 라벨", "박스 라벨 생성" 등):
필요 정보(제품명/모델번호/수량/원산지/박스치수/무게/대상국가)를 모두 파악한 후:
<<<PRINT_ACTION>>>{"type":"CREATE_LABEL","clientId":"거래처ID(있으면)","product":"제품명","data":{"productName":"제품명","modelNumber":"모델번호","quantity":수량,"origin":"Made in Korea","boxL":30,"boxW":20,"boxH":15,"weight":5.0,"country":"US|EU|JP|CN|KR|AU"}}<<<END_PRINT_ACTION>>>

3. 메뉴판 인쇄 요청 ("메뉴판 인쇄", "메뉴판 만들어줘", "메뉴판 주문", "식당 메뉴판" 등):
<<<PRINT_ACTION>>>{"type":"PRINT_MENU"}<<<END_PRINT_ACTION>>>

정보가 부족하면 먼저 물어보고, 충분히 모은 후 액션을 실행하세요.
PRINT_ACTION 블록은 텍스트와 함께 자연스럽게 포함하세요.

안내 지침:
1. 고객의 용도·예산·수량을 파악해 최적 상품을 추천하세요.
2. 정확한 견적은 /print/quote 견적 계산기를 안내하세요.
3. 파일 업로드는 /print/upload 페이지로 안내하세요.
4. 반말 사용 금지. 답변은 간결하고 실용적으로.`;
}

function getFallbackResponse(lastMsg: string): { text: string; action?: object } {
  const msg = lastMsg.toLowerCase();

  if (msg.includes('메뉴판') || (msg.includes('메뉴') && (msg.includes('인쇄') || msg.includes('전단') || msg.includes('출력')))) {
    return {
      text: '네! 등록된 메뉴를 바탕으로 메뉴판을 자동으로 디자인해 드릴게요 🎨\n아래에서 스타일과 수량을 선택하시면 바로 인쇄 주문을 진행해 드립니다!',
      action: { type: 'PRINT_MENU' },
    };
  }

  if (msg.includes('파일') && (msg.includes('찾') || msg.includes('검색') || msg.includes('있어') || msg.includes('보여'))) {
    const countryMatch = msg.includes('독일') ? 'DE' : msg.includes('미국') ? 'US' : msg.includes('일본') ? 'JP' : msg.includes('중국') ? 'CN' : msg.includes('호주') ? 'AU' : undefined;
    const query = msg.includes('독일') ? '독일' : msg.includes('미국') ? '미국' : msg.includes('일본') ? '일본' : msg.includes('중국') ? '중국' : '파일';
    return {
      text: `거래처 파일을 검색해 드리겠습니다!`,
      action: { type: 'SEARCH_FILES', query, country: countryMatch },
    };
  }

  if (msg.includes('라벨') && (msg.includes('만들') || msg.includes('생성') || msg.includes('생 성') || msg.includes('제작'))) {
    return {
      text: `수출 라벨을 생성해 드리겠습니다! 다음 정보를 알려주세요:\n\n1. **제품명** (예: USB Hub)\n2. **모델번호** (예: UH-200)\n3. **수량** (예: 500)\n4. **원산지** (예: Made in Korea)\n5. **박스 치수** (가로×세로×높이 cm)\n6. **무게** (kg)\n7. **수출 대상 국가** (미국/EU/일본/중국/한국/호주)`,
    };
  }

  if (msg.includes('명함')) {
    return { text: '명함은 **90×50mm 스탠다드**(100부 기준 22,000원)부터 **두꺼운 아트지 UV 코팅 프리미엄**(38,000원~)까지 다양합니다. 수량과 원하시는 질감에 따라 견적이 달라지니 `/print/quote` 견적 계산기를 이용해보세요!' };
  }
  if (msg.includes('전단') || msg.includes('flyer') || msg.includes('리플렛')) {
    return { text: '전단은 **A4/A5/A6** 크기와 **DL 3단 접지** 형태로 제작 가능합니다. 500부 기준 45,000원(유광코팅 단면 A4)이며 납기는 1–2일입니다.' };
  }
  if (msg.includes('배너') || msg.includes('현수막')) {
    return { text: '배너는 **실내용**(18,000원/개)과 **야외 방수용**(25,000원/개)이 있습니다. 60×160cm, 90×200cm, 100×200cm 표준 사이즈 외 맞춤 제작도 가능합니다!' };
  }
  if (msg.includes('책자') || msg.includes('카탈로그') || msg.includes('브로슈어')) {
    return { text: '소책자는 **중철 제본**(100부 180,000원~)과 **무선 제본**(250,000원~)으로 제작 가능합니다. A4/A5 크기, 유광·무광 코팅 선택 가능하며 납기는 3–6일입니다.' };
  }
  if (msg.includes('가격') || msg.includes('견적') || msg.includes('얼마')) {
    return { text: '정확한 견적은 상품·사이즈·수량·옵션에 따라 달라집니다. **[견적 계산기 바로가기](/print/quote)**에서 실시간으로 확인하실 수 있어요!' };
  }
  if (msg.includes('납기') || msg.includes('기간') || msg.includes('언제')) {
    return { text: '일반 납기는 상품에 따라 **1–7일**입니다. 긴급 제작(당일·익일)도 별도 상담을 통해 가능하니 전화(02-1234-5678)로 문의해 주세요!' };
  }
  return { text: '안녕하세요! AIZET 인쇄소 AI 상담사입니다.\n\n명함·전단·책자·배너·스티커·패키지 인쇄 상담, **거래처 파일 검색**, **수출 라벨 생성**까지 도와드립니다!\n\n예시:\n- "독일 거래처 라벨 파일 찾아줘"\n- "미국 수출용 라벨 만들어줘"' };
}

function extractAction(text: string): object | null {
  const match = text.match(/<<<PRINT_ACTION>>>([\s\S]*?)<<<END_PRINT_ACTION>>>/);
  if (!match) return null;
  try { return JSON.parse(match[1].trim()); } catch { return null; }
}

function stripAction(text: string): string {
  return text.replace(/<<<PRINT_ACTION>>>[\s\S]*?<<<END_PRINT_ACTION>>>/g, '').trim();
}

export async function POST(req: NextRequest) {
  const { messages } = await req.json() as { messages: { role: 'user' | 'assistant'; content: string }[] };

  const hasKey = process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_api_key_here';
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';

  if (!hasKey) {
    const { text, action } = getFallbackResponse(lastUserMsg);
    const stream = new ReadableStream({
      async start(controller) {
        for (const char of text) {
          controller.enqueue(send({ type: 'chunk', text: char }));
          await new Promise((r) => setTimeout(r, 8));
        }
        controller.enqueue(send({ type: 'done', fullText: text, action: action ?? null }));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });
  }

  const systemPrompt = buildSystemPrompt();
  const anthropicStream = anthropic.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 768,
    system: systemPrompt,
    messages,
  });

  let fullText = '';
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of anthropicStream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            fullText += event.delta.text;
            const visible = stripAction(fullText);
            controller.enqueue(send({ type: 'chunk', text: event.delta.text }));
            void visible;
          }
        }
        const action = extractAction(fullText);
        const cleanText = stripAction(fullText);
        controller.enqueue(send({ type: 'done', fullText: cleanText, action }));
      } catch (err) {
        controller.enqueue(send({ type: 'error', message: String(err) }));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  });
}
