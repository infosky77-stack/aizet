import { NextRequest } from 'next/server';
import { streamOrderBot, ChatMessage } from '@/lib/ai/order-bot';
import { getMenuItems } from '@/lib/db/menu';

const encoder = new TextEncoder();

function send(data: object) {
  return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
}

// Fallback when no API key: simulate a greeting
function getFallbackResponse(messages: ChatMessage[], tableNumber: number): string {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content.toLowerCase() ?? '';
  const menu = getMenuItems().filter((i) => i.available);

  // Order confirmation takes priority
  if (lastUserMsg.includes('주문') || lastUserMsg.includes('할게') || lastUserMsg.includes('주세요') || lastUserMsg.includes('시켜')) {
    const item = menu.find((i) => i.tags.includes('popular'))!;
    return `주문 감사합니다! 확인해 주세요 🍽️\n\n<<<ORDER_CONFIRMED>>>\n{"ORDER_CONFIRMED":true,"items":[{"menuItemId":"${item.id}","name":"${item.nameKo}","price":${item.price},"quantity":1}]}\n<<<END_ORDER>>>`;
  }
  if (lastUserMsg.includes('추천') || lastUserMsg.includes('뭐') || lastUserMsg.includes('인기')) {
    return `오늘의 추천은 **시그니처 와규 버거** (24,000원)입니다 ⭐ 와규 패티에 트러플 마요네즈 조합이 환상적이에요! 주문하시겠어요?`;
  }
  if (lastUserMsg.includes('매운') || lastUserMsg.includes('스파이시')) {
    return `매운 메뉴는 **양념 치킨** (18,000원)이 있습니다 🌶️ 바삭바삭하고 매콤달콤해서 인기가 많아요! 담아드릴까요?`;
  }
  if (lastUserMsg.includes('세트')) {
    return `**셰프 추천 세트 A** (35,000원)를 추천드려요 🍱 와규 버거 + 시저 샐러드 + 음료 구성으로 가성비 최고예요! 주문하시겠어요?`;
  }
  // Default greeting for first message
  const popular = menu.filter((i) => i.tags.includes('popular')).map((i) => i.nameKo).join(', ');
  return `안녕하세요! 테이블 ${tableNumber}번 고객님 😊 오늘 인기 메뉴는 ${popular}입니다. 어떤 메뉴가 궁금하신가요?`;
}

export async function POST(req: NextRequest) {
  const { messages, tableNumber } = await req.json() as {
    messages: ChatMessage[];
    tableNumber: number;
  };

  const hasKey =
    process.env.ANTHROPIC_API_KEY &&
    process.env.ANTHROPIC_API_KEY !== 'your_api_key_here';

  // Without API key: stream a fake char-by-char response
  if (!hasKey) {
    const text = getFallbackResponse(messages, tableNumber);
    const stream = new ReadableStream({
      async start(controller) {
        for (const char of text) {
          controller.enqueue(send({ type: 'chunk', text: char }));
          await new Promise((r) => setTimeout(r, 12));
        }
        controller.enqueue(send({ type: 'done', fullText: text }));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });
  }

  // With API key: real streaming from Anthropic
  const anthropicStream = streamOrderBot(messages, tableNumber);
  let fullText = '';

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of anthropicStream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            const chunk = event.delta.text;
            fullText += chunk;
            controller.enqueue(send({ type: 'chunk', text: chunk }));
          }
        }
        controller.enqueue(send({ type: 'done', fullText }));
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
