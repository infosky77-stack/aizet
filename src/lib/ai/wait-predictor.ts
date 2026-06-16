import { anthropic } from './claude';
import { Reservation } from '@/types/reservation';

export interface WaitPrediction {
  id: string;
  estimatedWaitMinutes: number;
  reason: string;
}

function fallbackPredict(waitingList: Reservation[]): WaitPrediction[] {
  // Simple heuristic: 10 min base + 5 min per party ahead + 2 min per person
  return waitingList.map((rsv, idx) => {
    const partiesAhead = idx;
    const estimated = 10 + partiesAhead * 8 + rsv.partySize * 2;
    return {
      id: rsv.id,
      estimatedWaitMinutes: Math.min(estimated, 60),
      reason: `${partiesAhead}팀 대기 중, ${rsv.partySize}인 기준`,
    };
  });
}

export async function predictWaitTimes(waitingList: Reservation[]): Promise<WaitPrediction[]> {
  if (!waitingList.length) return [];

  const hasKey =
    process.env.ANTHROPIC_API_KEY &&
    process.env.ANTHROPIC_API_KEY !== 'your_api_key_here';

  if (!hasKey) return fallbackPredict(waitingList);

  const listText = waitingList
    .map(
      (r, i) =>
        `${i + 1}. ID: ${r.id} | 이름: ${r.guestName} | 인원: ${r.partySize}명 | 대기 시작: ${r.time}`
    )
    .join('\n');

  const prompt = `당신은 식당 운영 AI입니다. 현재 대기 현황을 분석해 각 팀의 예상 대기 시간을 계산하세요.

현재 대기 목록:
${listText}

조건:
- 테이블 회전 시간: 평균 30분
- 현재 빈 테이블: 2개 (2인석 1개, 4인석 1개)
- 각 팀의 인원을 고려해 적절한 테이블 배정 시뮬레이션

응답은 반드시 아래 JSON 배열만 반환하세요 (다른 텍스트 없이):
[{"id":"rsv-seed-1","estimatedWaitMinutes":5,"reason":"곧 입장 가능"},...]`;

  try {
    const res = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = res.content[0].type === 'text' ? res.content[0].text : '';
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return fallbackPredict(waitingList);
    return JSON.parse(match[0]) as WaitPrediction[];
  } catch {
    return fallbackPredict(waitingList);
  }
}
