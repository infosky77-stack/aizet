import { CurriculumUnit, Stage } from '@/types/korean';

export const STAGE_LABELS: Record<Stage, { ko: string; en: string; order: number }> = {
  consonant: { ko: '자음', en: 'Consonants', order: 0 },
  vowel:     { ko: '모음', en: 'Vowels',     order: 1 },
  word:      { ko: '단어', en: 'Words',      order: 2 },
  sentence:  { ko: '문장', en: 'Sentences',  order: 3 },
  conversation: { ko: '회화', en: 'Conversation', order: 4 },
};

export const CURRICULUM: CurriculumUnit[] = [
  {
    id: 'consonant-basic',
    stage: 'consonant',
    order: 1,
    titleKo: '기본 자음 (ㄱ ~ ㅎ)',
    title: { en: 'Basic Consonants', zh: '基本辅音', ja: '基本子音', vi: 'Phụ âm cơ bản' },
    description: {
      en: 'Learn the 14 basic Korean consonants and their sounds.',
      zh: '学习14个基本韩语辅音及其发音。',
      ja: '14個の基本的な韓国語の子音とその音を学びます。',
      vi: 'Học 14 phụ âm cơ bản tiếng Hàn và âm thanh của chúng.',
    },
    content: [
      { korean: 'ㄱ', romanization: 'g/k', meaning: { en: 'like "g" in "go"', zh: '类似"g"音', ja: '「g」に近い音', vi: 'giống "g" trong "go"' } },
      { korean: 'ㄴ', romanization: 'n',   meaning: { en: 'like "n" in "no"',  zh: '类似"n"音', ja: '「n」に近い音', vi: 'giống "n" trong "no"' } },
      { korean: 'ㄷ', romanization: 'd/t', meaning: { en: 'like "d" in "do"',  zh: '类似"d"音', ja: '「d」に近い音', vi: 'giống "d" trong "do"' } },
      { korean: 'ㄹ', romanization: 'r/l', meaning: { en: 'between "r" and "l"', zh: '介于"r"和"l"之间', ja: '「r」と「l」の中間', vi: 'giữa "r" và "l"' } },
      { korean: 'ㅁ', romanization: 'm',   meaning: { en: 'like "m" in "mom"', zh: '类似"m"音', ja: '「m」に近い音', vi: 'giống "m" trong "mom"' } },
      { korean: 'ㅂ', romanization: 'b/p', meaning: { en: 'like "b" in "boy"', zh: '类似"b"音', ja: '「b」に近い音', vi: 'giống "b" trong "boy"' } },
      { korean: 'ㅅ', romanization: 's',   meaning: { en: 'like "s" in "sun"', zh: '类似"s"音', ja: '「s」に近い音', vi: 'giống "s" trong "sun"' } },
    ],
  },
  {
    id: 'vowel-basic',
    stage: 'vowel',
    order: 2,
    titleKo: '기본 모음 (ㅏ ~ ㅣ)',
    title: { en: 'Basic Vowels', zh: '基本元音', ja: '基本母音', vi: 'Nguyên âm cơ bản' },
    description: {
      en: 'Learn the 10 basic Korean vowels.',
      zh: '学习10个基本韩语元音。',
      ja: '10個の基本的な韓国語の母音を学びます。',
      vi: 'Học 10 nguyên âm cơ bản tiếng Hàn.',
    },
    content: [
      { korean: 'ㅏ', romanization: 'a',  meaning: { en: 'like "a" in "father"', zh: '类似"啊"', ja: '「ア」の音', vi: 'giống "a" trong "father"' } },
      { korean: 'ㅓ', romanization: 'eo', meaning: { en: 'like "u" in "cut"',    zh: '类似"어"', ja: '「オ」に近い音', vi: 'giống "u" trong "cut"' } },
      { korean: 'ㅗ', romanization: 'o',  meaning: { en: 'like "o" in "go"',     zh: '类似"哦"', ja: '「オ」の音', vi: 'giống "o" trong "go"' } },
      { korean: 'ㅜ', romanization: 'u',  meaning: { en: 'like "oo" in "moon"',  zh: '类似"乌"', ja: '「ウ」の音', vi: 'giống "oo" trong "moon"' } },
      { korean: 'ㅡ', romanization: 'eu', meaning: { en: 'no English equivalent, lips spread flat', zh: '嘴唇扁平发音', ja: '口を横に開いて「ウ」', vi: 'không có âm tương đương trong tiếng Anh' } },
      { korean: 'ㅣ', romanization: 'i',  meaning: { en: 'like "ee" in "see"',   zh: '类似"衣"', ja: '「イ」の音', vi: 'giống "ee" trong "see"' } },
    ],
  },
  {
    id: 'word-greetings',
    stage: 'word',
    order: 3,
    titleKo: '인사말과 기본 단어',
    title: { en: 'Greetings & Basic Words', zh: '问候语和基本词汇', ja: '挨拶と基本語彙', vi: 'Lời chào và từ cơ bản' },
    description: {
      en: 'Essential Korean greetings and everyday vocabulary.',
      zh: '基本韩语问候语和日常词汇。',
      ja: '基本的な韓国語の挨拶と日常語彙。',
      vi: 'Lời chào hỏi và từ vựng hàng ngày cần thiết.',
    },
    content: [
      { korean: '안녕하세요', romanization: 'annyeonghaseyo', meaning: { en: 'Hello / Good day', zh: '你好', ja: 'こんにちは', vi: 'Xin chào' }, example: '안녕하세요! 반갑습니다.' },
      { korean: '감사합니다', romanization: 'gamsahamnida',   meaning: { en: 'Thank you', zh: '谢谢', ja: 'ありがとうございます', vi: 'Cảm ơn bạn' }, example: '도와줘서 감사합니다.' },
      { korean: '죄송합니다', romanization: 'joesonghamnida', meaning: { en: 'I am sorry', zh: '对不起', ja: 'すみません', vi: 'Tôi xin lỗi' } },
      { korean: '네 / 아니요', romanization: 'ne / aniyo',   meaning: { en: 'Yes / No', zh: '是 / 不是', ja: 'はい / いいえ', vi: 'Vâng / Không' } },
      { korean: '물', romanization: 'mul',                   meaning: { en: 'water', zh: '水', ja: '水', vi: 'nước' } },
      { korean: '밥', romanization: 'bap',                   meaning: { en: 'rice / meal', zh: '饭', ja: 'ご飯', vi: 'cơm' } },
    ],
  },
  {
    id: 'sentence-basic',
    stage: 'sentence',
    order: 4,
    titleKo: '기본 문장 만들기',
    title: { en: 'Building Basic Sentences', zh: '构建基本句子', ja: '基本文の作り方', vi: 'Xây dựng câu cơ bản' },
    description: {
      en: 'Learn Korean sentence structure: Subject + Object + Verb.',
      zh: '学习韩语句子结构：主语+宾语+谓语。',
      ja: '韓国語の文章構造を学びます：主語+目的語+動詞。',
      vi: 'Học cấu trúc câu tiếng Hàn: Chủ ngữ + Tân ngữ + Động từ.',
    },
    content: [
      { korean: '저는 학생이에요', romanization: 'jeoneun haksaengieyo', meaning: { en: 'I am a student.', zh: '我是学生。', ja: '私は学生です。', vi: 'Tôi là học sinh.' }, tip: { en: 'Subject + 은/는 (topic marker) + Noun + 이에요/예요', zh: '主语 + 은/는（主题助词）+ 名词 + 이에요/예요', ja: '主語 + 은/는（主題助詞）+ 名詞 + 이에요/예요', vi: 'Chủ ngữ + 은/는 (trợ từ chủ đề) + Danh từ + 이에요/예요' } },
      { korean: '저는 한국어를 배워요', romanization: 'jeoneun hangugeoreul baewoyo', meaning: { en: 'I learn Korean.', zh: '我学习韩语。', ja: '私は韓国語を学びます。', vi: 'Tôi học tiếng Hàn.' } },
      { korean: '이것이 뭐예요?', romanization: 'igeosi mwoyeyo?', meaning: { en: 'What is this?', zh: '这是什么？', ja: 'これは何ですか？', vi: 'Cái này là gì?' } },
      { korean: '얼마예요?', romanization: 'eolmayeyo?', meaning: { en: 'How much is it?', zh: '多少钱？', ja: 'いくらですか？', vi: 'Bao nhiêu tiền?' } },
    ],
  },
  {
    id: 'conversation-daily',
    stage: 'conversation',
    order: 5,
    titleKo: '일상 회화 (식당·쇼핑)',
    title: { en: 'Daily Conversation (Restaurant & Shopping)', zh: '日常会话（餐厅·购物）', ja: '日常会話（レストラン・ショッピング）', vi: 'Hội thoại hàng ngày (Nhà hàng & Mua sắm)' },
    description: {
      en: 'Practice real-world Korean conversations.',
      zh: '练习真实场景的韩语对话。',
      ja: '実際の場面での韓国語会話を練習します。',
      vi: 'Luyện tập hội thoại tiếng Hàn trong thực tế.',
    },
    content: [
      { korean: '주문할게요', romanization: 'jumunhalgeyo',       meaning: { en: 'I would like to order.', zh: '我要点餐。', ja: '注文します。', vi: 'Tôi muốn gọi món.' }, example: '저기요! 주문할게요.' },
      { korean: '이거 주세요', romanization: 'igeo juseyo',        meaning: { en: 'Please give me this.', zh: '请给我这个。', ja: 'これをください。', vi: 'Cho tôi cái này.' } },
      { korean: '계산해 주세요', romanization: 'gyesanhae juseyo', meaning: { en: 'Please give me the bill.', zh: '请结账。', ja: 'お会計お願いします。', vi: 'Cho tôi tính tiền.' } },
      { korean: '너무 비싸요', romanization: 'neomu bissayo',      meaning: { en: 'It is too expensive.', zh: '太贵了。', ja: '高すぎます。', vi: 'Đắt quá.' } },
      { korean: '깎아 주세요', romanization: 'kkakka juseyo',      meaning: { en: 'Please give me a discount.', zh: '请打折。', ja: '値引きしてください。', vi: 'Cho tôi giảm giá.' } },
    ],
  },
];

export function getUnit(id: string): CurriculumUnit | undefined {
  return CURRICULUM.find(u => u.id === id);
}

export function getUnitsByStage(stage: Stage): CurriculumUnit[] {
  return CURRICULUM.filter(u => u.stage === stage).sort((a, b) => a.order - b.order);
}
