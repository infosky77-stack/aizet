import { NextRequest } from 'next/server';
import { gemini } from '@/lib/ai/gemini';

export const runtime = 'nodejs';

const encoder = new TextEncoder();
function send(data: object) {
  return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
}

const SYSTEM_PROMPT = `You are "법무 AI", a knowledgeable and friendly legal assistant for 법무사 에이젯 (Legal Affairs AIZET).

Your expertise covers Korean legal procedures handled by 법무사 (judicial scriveners):
- 부동산 소유권 이전 등기 (Real estate ownership transfer registration): procedures, required documents, fees, acquisition tax
- 법인 설립·변경·해산 등기 (Corporate registration): types of corporations, incorporation procedures, capital requirements, articles of incorporation
- 상속·증여 등기 (Inheritance and gift registration): legal heirs, division of inherited property, inheritance tax filing
- 부동산 경매·공매 대리 (Real estate auction agency): rights analysis, bidding procedures, registration after winning bid
- 개인회생·파산 신청 (Personal rehabilitation and bankruptcy): eligibility, required documents, process timeline
- 가압류·가처분 등 보전처분 (Provisional attachment and injunction): procedures, eligibility, court filing
- 내용증명·법률서류 작성 (Legal document drafting): content certification, contracts, agreements

Current date context: June 30, 2026

Your behavior:
- Answer in Korean, warmly and clearly
- Use concrete procedures and required documents when explaining registration matters
- When users ask about services, suggest visiting our 서비스 안내 at /legal/guides
- When users want professional help, suggest booking at /legal/reservation
- Remind that AI answers are for reference only; actual legal situations require a licensed 법무사
- Never guarantee specific legal outcomes — always recommend consulting a licensed legal professional
- Use emojis occasionally to make responses friendly (⚖️ 🏠 📋 💡 ⚠️ 🏢)
- Distinguish clearly between what a 법무사 can handle vs. what requires a 변호사 (attorney)

Start by warmly greeting and asking about the user's legal question or concern.`;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = body.messages ?? [];

  const model = gemini.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: SYSTEM_PROMPT,
  });

  const history = messages.slice(0, -1).map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const lastMessage = messages[messages.length - 1]?.content ?? '';

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const chat = model.startChat({ history });
        const result = await chat.sendMessageStream(lastMessage);

        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            controller.enqueue(send({ type: 'delta', text }));
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
