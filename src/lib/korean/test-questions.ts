import { LevelQuestion } from '@/types/korean';

export const LEVEL_QUESTIONS: LevelQuestion[] = [
  {
    id: 'q1',
    text: 'What does "안녕하세요" mean?',
    options: ['Goodbye', 'Hello / Good day', 'Thank you', 'Excuse me'],
    answer: 1,
    explanation: {
      en: '"안녕하세요" is the standard Korean greeting, used formally throughout the day.',
      zh: '"안녕하세요"是标准的韩语问候语，在正式场合全天使用。',
      ja: '"안녕하세요"は標準的な韓国語の挨拶で、一日中フォーマルな場面で使います。',
      vi: '"안녕하세요" là lời chào chuẩn trong tiếng Hàn, được dùng trong suốt ngày ở văn phong trang trọng.',
    },
  },
  {
    id: 'q2',
    text: 'Which consonant makes the "n" sound?',
    options: ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ'],
    answer: 1,
    explanation: {
      en: '"ㄴ" makes the "n" sound, as in "no" or "name".',
      zh: '"ㄴ"发"n"音，类似"no"或"name"中的"n"。',
      ja: '"ㄴ"は「n」の音を出します。',
      vi: '"ㄴ" tạo âm "n", như trong "no" hoặc "name".',
    },
  },
  {
    id: 'q3',
    text: 'How do you say "water" in Korean?',
    options: ['밥', '물', '사람', '집'],
    answer: 1,
    explanation: {
      en: '"물" means water. "밥" is rice/meal, "사람" is person, "집" is house.',
      zh: '"물"意为水。"밥"是饭，"사람"是人，"집"是家。',
      ja: '"물"は水です。"밥"はご飯、"사람"は人、"집"は家です。',
      vi: '"물" có nghĩa là nước. "밥" là cơm, "사람" là người, "집" là nhà.',
    },
  },
  {
    id: 'q4',
    text: 'What is the correct sentence structure in Korean?',
    options: [
      'Subject + Verb + Object',
      'Verb + Subject + Object',
      'Subject + Object + Verb',
      'Object + Subject + Verb',
    ],
    answer: 2,
    explanation: {
      en: 'Korean follows Subject-Object-Verb (SOV) order, unlike English (SVO).',
      zh: '韩语遵循主-宾-谓（SOV）语序，与英语（SVO）不同。',
      ja: '韓国語は主語-目的語-動詞（SOV）の語順で、英語（SVO）とは異なります。',
      vi: 'Tiếng Hàn theo thứ tự Chủ ngữ-Tân ngữ-Động từ (SOV), khác với tiếng Anh (SVO).',
    },
  },
  {
    id: 'q5',
    text: 'Which phrase means "How much is it?"',
    options: ['이거 주세요', '얼마예요?', '감사합니다', '계산해 주세요'],
    answer: 1,
    explanation: {
      en: '"얼마예요?" means "How much is it?" — essential for shopping.',
      zh: '"얼마예요?"意为"多少钱？"——购物时必用。',
      ja: '"얼마예요?"は「いくらですか？」という意味で、ショッピングに欠かせない表現です。',
      vi: '"얼마예요?" có nghĩa là "Bao nhiêu tiền?" — rất cần thiết khi mua sắm.',
    },
  },
  {
    id: 'q6',
    text: '저는 _____ 이에요. (I am a doctor.)',
    options: ['학생', '의사', '선생님', '회사원'],
    answer: 1,
    explanation: {
      en: '"의사" means doctor. "학생" is student, "선생님" is teacher, "회사원" is office worker.',
      zh: '"의사"意为医生。"학생"是学生，"선생님"是老师，"회사원"是上班族。',
      ja: '"의사"は医者です。"학생"は学生、"선생님"は先生、"회사원"は会社員です。',
      vi: '"의사" có nghĩa là bác sĩ. "학생" là học sinh, "선생님" là giáo viên, "회사원" là nhân viên công ty.',
    },
  },
  {
    id: 'q7',
    text: 'What does the particle "을/를" indicate?',
    options: ['Subject marker', 'Topic marker', 'Object marker', 'Location marker'],
    answer: 2,
    explanation: {
      en: '"을/를" marks the object of a verb. "이/가" marks subject, "은/는" marks topic, "에/에서" marks location.',
      zh: '"을/를"标记动词的宾语。"이/가"标记主语，"은/는"标记主题，"에/에서"标记地点。',
      ja: '"을/를"は動詞の目的語を示します。"이/가"は主語、"은/는"は主題、"에/에서"は場所を示します。',
      vi: '"을/를" đánh dấu tân ngữ của động từ. "이/가" đánh dấu chủ ngữ, "은/는" đánh dấu chủ đề, "에/에서" đánh dấu địa điểm.',
    },
  },
  {
    id: 'q8',
    text: 'Complete: 오늘 날씨가 _____ 좋아요. (The weather is very good today.)',
    options: ['조금', '너무', '아주', '많이'],
    answer: 2,
    explanation: {
      en: '"아주" means "very" in this positive context. "너무" also works but originally meant "too much". "조금" is a little, "많이" is a lot/much.',
      zh: '"아주"在这个肯定语境中意为"非常"。"너무"也可用但原意是"过于"。"조금"是一点，"많이"是很多。',
      ja: '"아주"はこの肯定的な文脈で「とても」を意味します。"너무"も使えますが元々「あまりにも」という意味です。',
      vi: '"아주" có nghĩa là "rất" trong ngữ cảnh tích cực. "너무" cũng dùng được nhưng nguyên gốc có nghĩa "quá". "조금" là một chút, "많이" là nhiều.',
    },
  },
];

export function scoreToLevel(correct: number, total: number): import('@/types/korean').KoreanLevel {
  const pct = correct / total;
  if (pct >= 0.875) return 'advanced';
  if (pct >= 0.625) return 'intermediate';
  if (pct >= 0.375) return 'elementary';
  return 'beginner';
}
