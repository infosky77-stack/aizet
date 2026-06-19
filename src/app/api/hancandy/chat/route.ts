import { NextRequest } from 'next/server';
import { anthropic } from '@/lib/ai/claude';

export const runtime = 'nodejs';

const encoder = new TextEncoder();
function send(data: object) {
  return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
}

const SYSTEM_PROMPT = `You are "캔디 AI", a friendly and knowledgeable health consultant for HanCandy (한캔디), a Korean sugar-free functional candy brand.

About HanCandy products:
1. 비타 시트러스 (Vita Citrus) - 레몬·오렌지 맛 / 면역력 강화 / 비타민C, 항산화 / 8,900원
2. 캄 민트 (Calm Mint) - 페퍼민트·캐모마일 맛 / 스트레스 완화, 수면 지원 / GABA, 진정 효과 / 9,900원
3. 에너지 베리 (Energy Berry) - 블루베리·아사이 맛 / 피로 회복, 에너지 / 비타민B 복합체 / 10,500원
4. 글로우 피치 (Glow Peach) - 복숭아·콜라겐 맛 / 피부 탄력, 미용 / 저분자 콜라겐, 히알루론산 / 12,900원

All products:
- Sugar-free (당류 0g), sweetened with xylitol and stevia
- No artificial colors, no preservatives
- 1 serving = 1 candy (2g), ~5 calories

Your role:
- Listen to the user's health goals, lifestyle, or concerns
- Recommend the most suitable HanCandy product(s) with clear reasoning
- Keep responses warm, friendly, and concise (Korean language)
- If asked about allergies or contraindications, be honest and suggest consulting a doctor
- Never make medical claims — say "도움이 될 수 있습니다" not "치료합니다"
- Add relevant emoji occasionally to keep it friendly
- Mention that HanCandy is currently in pre-launch preparation when relevant

Start by warmly greeting and asking about the user's health goals or concerns.`;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = body.messages ?? [];

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await anthropic.messages.stream({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 600,
          system: SYSTEM_PROMPT,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
        });

        for await (const event of response) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(send({ type: 'delta', text: event.delta.text }));
          }
        }
        controller.enqueue(send({ type: 'done' }));
      } catch (err) {
        controller.enqueue(send({ type: 'error', message: String(err) }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
