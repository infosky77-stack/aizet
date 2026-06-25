export interface ImageTemplate {
  key: string;
  label: string;
  prompt: string;
}

export interface IndustryTemplate {
  images: ImageTemplate[];
}

function makePrompt(base: string) {
  return `${base}, high quality professional photography, sharp focus, natural lighting, no text overlay, photorealistic, 16:9 aspect ratio`;
}

export const IMAGE_TEMPLATES: Record<string, IndustryTemplate> = {
  restaurant: {
    images: [
      { key: 'exterior', label: '외관', prompt: makePrompt('Exterior of a clean modern Korean restaurant with welcoming entrance and signage') },
      { key: 'interior', label: '홀 인테리어', prompt: makePrompt('Cozy Korean restaurant dining hall with warm lighting, wooden tables and chairs, inviting atmosphere') },
      { key: 'dish1', label: '대표 메뉴 1', prompt: makePrompt('Beautifully plated Korean main course dish on a restaurant table, appetizing presentation') },
      { key: 'dish2', label: '대표 메뉴 2', prompt: makePrompt('Korean side dishes and soup served in a restaurant, traditional tableware, overhead view') },
      { key: 'dish3', label: '대표 메뉴 3', prompt: makePrompt('Korean grilled meat or seafood dish sizzling on a grill, restaurant setting, close-up') },
      { key: 'kitchen', label: '주방', prompt: makePrompt('Professional Korean restaurant kitchen, clean stainless steel surfaces, chef cooking') },
      { key: 'chef', label: '요리사', prompt: makePrompt('Korean chef in uniform plating a dish, professional kitchen background, skilled and focused') },
      { key: 'table', label: '테이블 세팅', prompt: makePrompt('Elegant restaurant table setting with chopsticks, bowls and glasses, ready for guests') },
      { key: 'atmosphere', label: '분위기', prompt: makePrompt('Korean restaurant atmosphere at dinner time, warm ambient lighting, guests dining, lively but cozy') },
      { key: 'takeout', label: '포장', prompt: makePrompt('Korean restaurant takeout packaging, eco-friendly containers with food inside, branded bags') },
    ],
  },

  cafe: {
    images: [
      { key: 'exterior', label: '외관', prompt: makePrompt('Charming Korean cafe exterior with large windows and outdoor seating, inviting storefront') },
      { key: 'interior', label: '내부 인테리어', prompt: makePrompt('Bright and cozy cafe interior with wooden furniture, plants, and soft natural lighting') },
      { key: 'coffee1', label: '시그니처 음료 1', prompt: makePrompt('Beautifully crafted latte with latte art in a ceramic cup, cafe counter background') },
      { key: 'coffee2', label: '시그니처 음료 2', prompt: makePrompt('Iced cold brew coffee in a tall glass with ice cubes, minimalist cafe setting') },
      { key: 'dessert', label: '디저트', prompt: makePrompt('Artisan pastries and cakes on a cafe display, French-style bakery items, elegant presentation') },
      { key: 'barista', label: '바리스타', prompt: makePrompt('Skilled barista making espresso on a professional coffee machine, focused and professional') },
      { key: 'beans', label: '원두', prompt: makePrompt('Freshly roasted coffee beans spilling from a bag, close-up macro shot, warm tones') },
      { key: 'seating', label: '좌석', prompt: makePrompt('Cozy cafe seating area with comfortable chairs and small tables, warm lighting, peaceful') },
      { key: 'terrace', label: '테라스', prompt: makePrompt('Sunny outdoor cafe terrace with small tables, potted plants and umbrellas, relaxed atmosphere') },
      { key: 'togo', label: '테이크아웃 컵', prompt: makePrompt('Branded cafe takeaway coffee cup with lid, held in hand outdoors, street background') },
    ],
  },

  beauty: {
    images: [
      { key: 'exterior', label: '외관', prompt: makePrompt('Modern hair salon exterior with stylish signage and clean glass facade') },
      { key: 'interior', label: '내부 인테리어', prompt: makePrompt('Elegant hair salon interior with styling chairs, mirrors and modern decor, bright lighting') },
      { key: 'stylist', label: '스타일리스트', prompt: makePrompt('Professional Korean hair stylist in black uniform working on a client, focused and skilled') },
      { key: 'haircut', label: '헤어컷', prompt: makePrompt('Hair stylist giving a precise haircut to a client, professional scissors and comb, salon background') },
      { key: 'coloring', label: '염색', prompt: makePrompt('Hair colorist applying color to a client hair, professional foils and brush, vibrant colors') },
      { key: 'perm', label: '파마', prompt: makePrompt('Client getting a perm treatment, perming rods applied to hair, salon professional setting') },
      { key: 'products', label: '제품', prompt: makePrompt('Premium hair care products arranged on a shelf, shampoos conditioners and treatments, clean white background') },
      { key: 'styling', label: '스타일링', prompt: makePrompt('Stylist blow-drying and finishing a clients hairstyle, round brush, professional salon') },
      { key: 'consultation', label: '상담', prompt: makePrompt('Hair stylist consulting with a client about hairstyle choices, friendly and professional, salon mirror') },
      { key: 'result', label: '시술 결과', prompt: makePrompt('Beautiful finished hairstyle result, client smiling with new hair, salon background, elegant') },
    ],
  },

  clinic: {
    images: [
      { key: 'exterior', label: '외관', prompt: makePrompt('Clean and professional oriental medicine clinic exterior with Korean-style signage, welcoming entrance') },
      { key: 'doctor', label: '원장', prompt: makePrompt('Korean oriental medicine doctor in white coat consulting with patient, professional and trustworthy') },
      { key: 'acupuncture', label: '침술', prompt: makePrompt('Acupuncture needles being carefully placed on a patients back, calm clinic environment, professional') },
      { key: 'chuna', label: '추나 치료', prompt: makePrompt('Oriental medicine practitioner performing chuna spinal manipulation on a patient, treatment table') },
      { key: 'cupping', label: '부항', prompt: makePrompt('Cupping therapy with glass cups on a patients back, traditional Korean medicine treatment') },
      { key: 'herbal', label: '한약', prompt: makePrompt('Traditional Korean herbal medicine preparation, dried herbs and decoction bags, wooden mortar') },
      { key: 'pharmacopuncture', label: '약침', prompt: makePrompt('Pharmacopuncture injection treatment being administered by a Korean medicine doctor, clinical setting') },
      { key: 'constitution', label: '체질 진단', prompt: makePrompt('Korean oriental medicine doctor taking a patients pulse for constitutional diagnosis, calm office') },
      { key: 'interior', label: '인테리어', prompt: makePrompt('Serene oriental medicine clinic interior with warm wood tones, treatment room, calming atmosphere') },
      { key: 'consultation', label: '진료 상담', prompt: makePrompt('Doctor and patient in one-on-one consultation at a desk, listening and taking notes, warm clinic') },
      { key: 'fatigue', label: '피로 치료', prompt: makePrompt('Patient receiving IV drip fatigue recovery treatment in a clean clinic room, restful and peaceful') },
    ],
  },

  fitness: {
    images: [
      { key: 'exterior', label: '외관', prompt: makePrompt('Modern fitness center exterior with large logo signage, clean facade, energetic feel') },
      { key: 'interior', label: '내부 전경', prompt: makePrompt('Spacious gym interior with rows of cardio machines and weights, bright lighting, clean and modern') },
      { key: 'equipment', label: '운동 기구', prompt: makePrompt('Modern gym equipment including dumbbells and machines, organized and clean, gym interior') },
      { key: 'trainer', label: '트레이너', prompt: makePrompt('Fit Korean personal trainer in gym clothes explaining exercise to a client, professional and motivating') },
      { key: 'pt', label: 'PT 수업', prompt: makePrompt('Personal trainer supervising client doing dumbbell exercises, one-on-one training session, gym') },
      { key: 'pilates', label: '필라테스', prompt: makePrompt('Pilates instructor leading a small class, reformer machines, bright airy studio') },
      { key: 'stretching', label: '스트레칭', prompt: makePrompt('Group stretching session in a fitness class, mat exercises, bright studio with mirrors') },
      { key: 'shower', label: '샤워 시설', prompt: makePrompt('Clean modern gym shower and changing facilities, tiled bathroom, fresh towels') },
      { key: 'locker', label: '라커룸', prompt: makePrompt('Modern gym locker room with clean lockers, benches, organized and well-maintained') },
      { key: 'class', label: '그룹 수업', prompt: makePrompt('Energetic group fitness class in progress, instructor leading participants, bright studio') },
    ],
  },

  legal: {
    images: [
      { key: 'exterior', label: '외관', prompt: makePrompt('Professional tax accounting or law office exterior with clean signage, business district setting') },
      { key: 'office', label: '사무실', prompt: makePrompt('Sophisticated professional office interior with bookshelves full of law books, wooden desk, prestigious') },
      { key: 'expert', label: '전문가', prompt: makePrompt('Korean professional accountant or lawyer in suit sitting at a desk, trustworthy and competent') },
      { key: 'consultation', label: '상담', prompt: makePrompt('Professional consultation meeting between advisor and clients across a desk, documents and documents') },
      { key: 'documents', label: '문서 작업', prompt: makePrompt('Tax documents, financial statements and official paperwork on a professional desk, organized') },
      { key: 'government', label: '관공서', prompt: makePrompt('Korean government building exterior or official tax office, daytime, professional setting') },
      { key: 'success', label: '성공 사례', prompt: makePrompt('Business handshake between professional advisor and satisfied client, success and trust, office setting') },
    ],
  },
};

export function getTemplateForIndustry(industry: string): IndustryTemplate {
  return IMAGE_TEMPLATES[industry] ?? IMAGE_TEMPLATES['restaurant'];
}
