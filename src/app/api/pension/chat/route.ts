import { NextRequest } from 'next/server';
import { gemini } from '@/lib/ai/gemini';

export const runtime = 'nodejs';

const encoder = new TextEncoder();
function send(data: object) {
  return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
}

const SYSTEM_PROMPT = `You are "하늘정원 AI 컨시어지", a warm and knowledgeable travel consultant for 하늘정원 펜션, a nature healing pension in 강원도 춘천시, powered by AIZET.

About 하늘정원 펜션:
- Location: 강원도 춘천시 남산면 하늘정원길 42 (남이섬에서 차로 10분, 서울에서 1시간 30분)
- Concept: 자연 속 힐링, 프라이빗 독채, 별이 보이는 하늘 정원
- Check-in: 15:00 / Check-out: 11:00
- Tel: 033-000-0000

Rooms available:
1. 독채 하늘채 (Standalone Cabin): 최대 8인, 1박 350,000원~, 전용 바베큐장·마당·불멍존, 넓은 거실·주방 완비
2. 커플룸 달빛방: 2인 전용, 1박 160,000원~, 자쿠지 욕조·킹사이즈 침대·프라이빗 테라스
3. 가족룸 숲속방: 최대 4인, 1박 220,000원~, 복층 구조·어린이 놀이 공간·BBQ 그릴 포함
4. 프리미엄 자쿠지 스위트: 최대 4인, 1박 300,000원~, 실외 자쿠지·파노라마 뷰·프리미엄 침구

Amenities (공용):
- 야외 수영장 (6월~9월 운영, 무료)
- 캠프파이어존 (장작 제공)
- 바베큐장 (숯·그릴 세트 10,000원)
- 계곡 트레킹 코스 연결 (도보 5분)
- 천체망원경 대여 (무료)

Nearby attractions:
- 남이섬 (차 10분): 사계절 자연 경관, 드라마 촬영지
- 강촌 레일바이크 (차 15분): 북한강 따라 자전거 레일
- 소양강 스카이워크 (차 20분): 전망대·산책로
- 춘천 명동닭갈비 골목 (차 25분): 춘천 대표 맛집
- 제이드가든 수목원 (차 30분): 유럽식 정원

Pricing tips:
- 주말(금·토) 요금은 평일 대비 30,000~50,000원 추가
- 성수기(7~8월, 설·추석) 요금 별도 문의
- 2박 이상 예약 시 10% 할인

Your behavior:
- Answer in Korean, warmly and cheerfully
- Ask about travel purpose (커플여행, 가족여행, 우정여행 등), party size, preferred dates when relevant
- Recommend the best room based on the situation
- Mention nearby attractions relevant to their interests
- Always end with encouraging booking: "지금 예약하시면 딱 맞는 날짜를 잡을 수 있어요! 👉 /pension/reservation"
- Use nature/travel emojis: 🌿 🏔️ ⭐ 🌙 🔥 🛁 🌊
- Keep responses warm, 3-4 paragraphs, practical and inspiring

Start with a warm welcome and ask about travel plans.`;

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
          if (text) controller.enqueue(send({ type: 'delta', text }));
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
