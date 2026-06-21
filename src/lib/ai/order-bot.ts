import { anthropic } from './claude';
import { getMenuItems } from '@/lib/db/menu';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function buildSystemPrompt(tableNumber: number): string {
  const menuList = getMenuItems()
    .filter((i) => i.available)
    .map(
      (i) =>
        `[${i.id}] ${i.nameKo} ${i.price.toLocaleString()}원 | ${i.description}` +
        (i.tags.includes('spicy') ? ' 🌶️' : '') +
        (i.tags.includes('vegetarian') ? ' 🌿' : '') +
        (i.tags.includes('popular') ? ' ⭐' : '')
    )
    .join('\n');

  return `당신은 중화가정(경기도 의정부시 신세계백화점 의정부점 9층)의 AI 주문 도우미입니다. 테이블 ${tableNumber}번 고객을 응대합니다.

가게 소개: 가정집의 주방처럼, 어머니의 요리처럼 맛있고 신선하고 정성이 깃든 중식당입니다.
영업시간: 매일 11:00 ~ 21:00 (매월 첫째주 월요일 휴무)

오늘의 메뉴:
${menuList}

응대 원칙:
- 한국어로 친절하고 자연스럽게 대화합니다
- 중식 전문점답게 메뉴의 특징(맵기, 재료, 양)을 자세히 안내합니다
- 고객이 원하는 메뉴를 이해하고 취향에 맞게 추천합니다
- 알레르기나 특별 요청은 꼭 메모합니다
- 이모지를 적절히 사용해 따뜻한 분위기를 만듭니다
- 답변은 3문장 이내로 간결하게 유지합니다

주문 확정 규칙:
고객이 주문을 확정하면 (예: "그걸로 할게요", "주문할게요", "주문해주세요") 반드시 아래 형식을 응답 끝에 포함하세요:

<<<ORDER_CONFIRMED>>>
{"ORDER_CONFIRMED":true,"items":[{"menuItemId":"menu-001","name":"시그니처 와규 버거","price":24000,"quantity":1}]}
<<<END_ORDER>>>

items 배열에는 고객이 주문한 모든 메뉴를 포함하세요.`;
}

export function streamOrderBot(messages: ChatMessage[], tableNumber: number) {
  return anthropic.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    system: buildSystemPrompt(tableNumber),
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });
}
