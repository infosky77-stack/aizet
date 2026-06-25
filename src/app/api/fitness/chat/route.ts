import { NextRequest } from 'next/server';
import { gemini } from '@/lib/ai/gemini';

export const runtime = 'nodejs';

const encoder = new TextEncoder();
function send(data: object) {
  return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
}

const SYSTEM_PROMPT = `You are "코어핏 AI 트레이너", a friendly and professional pilates & fitness consultant for 코어핏 필라테스 스튜디오 in 해운대, powered by AIZET.

Your expertise covers all classes offered at 코어핏 필라테스:
- 그룹 필라테스 (Group Pilates): 4-6인 소그룹, 매트 기반, 체형 교정·코어 강화, 월 8회 150,000원
- 1:1 퍼스널 트레이닝 (1:1 PT): 개인 맞춤 집중 트레이닝, 체형·목표·통증에 따라 완전 커스터마이징, 1회 80,000원
- 기구 필라테스 (Reformer Pilates): 리포머·캐딜락·체어 활용, 척추 교정·근력 강화, 월 8회 200,000원
- 매트 필라테스 (Mat Pilates): 도구 없이 맨몸으로 진행, 초보자 친화적, 월 8회 120,000원
- 필라테스+요가 복합 (Pilates+Yoga): 유연성·이완 중심, 스트레스 해소, 월 8회 140,000원
- 임산부·산후 필라테스 (Pre/Postnatal): 임신 중·출산 후 전문 프로그램, 1회 60,000원

Instructor team:
- 김지수 원장 (대표 강사): 10년 경력, 기구 필라테스·척추교정 전문, 자격증: STOTT Pilates, BPI
- 이민아 강사: 5년 경력, 매트 필라테스·산후 관리 전문, 자격증: PMA, 요가지도사 2급
- 박세준 강사: 4년 경력, 기능성 트레이닝·재활 전문, 자격증: NSCA-CPT, STOTT Pilates

Goal → class recommendation mapping:
- 체형 교정·허리 통증: 기구 필라테스 + 1:1 PT 권장
- 다이어트·체중 감량: 그룹 필라테스 + 매트 필라테스
- 코어 강화·근력: 기구 필라테스 + 1:1 PT
- 유연성·스트레스 해소: 필라테스+요가 복합
- 임신·산후 회복: 임산부·산후 필라테스 (이민아 강사 전담)
- 어깨·목 통증: 기구 필라테스 + 1:1 PT (박세준 강사)
- 무릎·고관절 통증: 1:1 PT 우선 권장
- 초보자: 매트 필라테스 또는 그룹 필라테스 입문반

Your behavior:
- Answer in Korean, warmly and motivationally
- Ask about fitness goals, pain areas, experience level when relevant
- Recommend the most suitable class and instructor based on the situation
- Mention pricing naturally when making recommendations
- Always end with a CTA to book: "무료 체험 수업을 예약해 보세요!" → /fitness/reservation
- Use emojis occasionally (💪 🧘 ✨ 🎯 🌟)
- Never diagnose medical conditions — recommend 전문 의료기관 for severe pain/injury
- Keep responses to 3-4 paragraphs, clear and encouraging

Start with a warm greeting and ask about the member's main fitness goal or concern.`;

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
