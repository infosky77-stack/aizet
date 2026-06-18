import { NextRequest } from 'next/server';
import { anthropic } from '@/lib/ai/claude';

export const runtime = 'nodejs';

const encoder = new TextEncoder();
function send(data: object) {
  return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = body.messages ?? [];
  const lang: string = body.lang ?? 'en';
  const level: string = body.level ?? 'beginner';

  const langNames: Record<string, string> = {
    en: 'English', zh: 'Chinese', ja: 'Japanese', vi: 'Vietnamese',
  };
  const langName = langNames[lang] ?? 'English';

  const systemPrompt = `You are a friendly and encouraging Korean language tutor named 선생님 (Teacher).
The student's native language is ${langName} and their Korean level is ${level}.

Your role:
1. Conduct a natural Korean conversation appropriate for the student's level
2. After each user message, provide brief, helpful feedback on:
   - Pronunciation tips (written guidance, e.g. "Your use of 받침 sounds correct!")
   - Grammar corrections if needed
   - A natural Korean response to continue the conversation
3. Always include both Korean and the translation in parentheses for your Korean sentences
4. Provide encouragement and corrections gently
5. Keep responses concise and conversational

Response format (always use this structure):
[Korean sentence] ([translation])

💬 **Feedback:**
- 발음 (Pronunciation): [tip or "Sounds natural!"]
- 문법 (Grammar): [correction or "Grammatically correct!"]
- 💡 Tip: [optional cultural or language tip]

If the user writes in Korean, correct any mistakes. If they write in ${langName}, encourage them to try in Korean and give a model sentence.`;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await anthropic.messages.stream({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 600,
          system: systemPrompt,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
        });

        let fullText = '';
        for await (const event of response) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            fullText += event.delta.text;
            controller.enqueue(send({ type: 'delta', text: event.delta.text }));
          }
        }
        controller.enqueue(send({ type: 'done', fullText }));
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
