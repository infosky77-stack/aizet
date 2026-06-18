import { anthropic } from './claude';
import { getMenuItems } from '@/lib/db/menu';
import { MenuItem } from '@/types/menu';

interface RecommendOptions {
  preferences?: string[];   // e.g. ['매운 음식 선호', '채식주의자']
  allergies?: string[];
  budget?: number;
  partySize?: number;
}

export async function recommendMenuItems(options: RecommendOptions): Promise<MenuItem[]> {
  const allItems = getMenuItems().filter((i) => i.available);
  const menuList = allItems.map((i) =>
    `[${i.id}] ${i.nameKo} (${i.price.toLocaleString()}원) - ${i.description} | 태그: ${i.tags.join(', ')} | 알레르기: ${i.allergens.join(', ') || '없음'}`
  ).join('\n');

  const prompt = `당신은 식당 AI 추천 시스템입니다.
고객 정보:
- 선호: ${options.preferences?.join(', ') || '없음'}
- 알레르기: ${options.allergies?.join(', ') || '없음'}
- 예산: ${options.budget ? `${options.budget.toLocaleString()}원` : '제한 없음'}
- 인원: ${options.partySize || 1}명

메뉴 목록:
${menuList}

위 조건에 맞는 메뉴 ID를 최대 3개 JSON 배열로만 반환하세요. 예: ["menu-001", "menu-003"]`;

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '[]';
  const match = text.match(/\[[\s\S]*\]/);
  const ids: string[] = match ? JSON.parse(match[0]) : [];
  return allItems.filter((i) => ids.includes(i.id));
}
