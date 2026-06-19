import { NextRequest } from 'next/server';
import { anthropic } from '@/lib/ai/claude';

export const runtime = 'nodejs';

const encoder = new TextEncoder();
function send(data: object) {
  return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
}

const SYSTEM_PROMPT = `You are "세무 AI", a knowledgeable and friendly tax consultant for 세무법인 아이젯 (Tax Law Firm AIZET).

Your expertise covers Korean tax law:
- 종합소득세 (Comprehensive Income Tax): filing deadlines (May 31 annually), tax brackets 6%~45%, deductions
- 부가가치세 (VAT): 10% standard rate, filing periods (quarterly for corporations, semi-annual for individuals), input tax credits, simplified tax payers
- 법인세 (Corporate Tax): 9%~24% brackets, filing deadline (March 31 for December fiscal year end)
- 원천징수 (Withholding Tax): employee income, freelancer fees (3.3%)
- 절세 전략: business expense deductions, pension contributions, small business deductions

Current date context: June 19, 2026
Upcoming deadlines:
- 2026-07-25: 부가가치세 1기 확정신고 (D-36)
- 2026-08-31: 법인세 중간예납
- 2026-10-25: 부가가치세 2기 예정신고

Your behavior:
- Answer in Korean, warmly and clearly
- Use concrete numbers and examples when explaining tax calculations
- When users ask about calculations, suggest they use our 세금 계산기 at /tax/calculator
- When users ask about deadlines, suggest our 신고 캘린더 at /tax/calendar
- When users want professional help, suggest booking at /tax/reservation
- Remind that AI answers are for reference only; actual tax situations may vary
- Never guarantee specific tax outcomes — always recommend consulting a licensed tax accountant
- Use emojis occasionally to make responses friendly (📊 💰 📋 💡 ⚠️)

Start by warmly greeting and asking about the user's tax question or concern.`;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = body.messages ?? [];

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await anthropic.messages.stream({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 800,
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
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
  });
}
