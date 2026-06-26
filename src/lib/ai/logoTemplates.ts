export interface LogoStyle {
  key:    string;
  label:  string;
  prompt: string;
}

export interface LogoTemplate {
  styles: LogoStyle[];
}

function minimal(industry: string, subject: string): string {
  return `minimal flat logo icon for ${industry}, simple clean ${subject} symbol, white background, vector art, no text, professional, single color, centered`;
}

function wordmark(industry: string): string {
  return `wordmark logo for ${industry}, clean modern sans-serif typography, white background, elegant lettering, no illustration, professional business logo`;
}

function colorful(industry: string, subject: string): string {
  return `colorful illustrated logo for ${industry}, vibrant ${subject} illustration, playful creative design, white background, bold colors, professional mascot style`;
}

export const LOGO_TEMPLATES: Record<string, LogoTemplate> = {
  restaurant: {
    styles: [
      { key: 'style1', label: '미니멀 심볼형', prompt: minimal('Korean restaurant', 'chopsticks and bowl') },
      { key: 'style2', label: '텍스트 로고형', prompt: wordmark('Korean restaurant') },
      { key: 'style3', label: '컬러풀 일러스트형', prompt: colorful('Korean restaurant', 'steaming bowl of ramen') },
    ],
  },
  cafe: {
    styles: [
      { key: 'style1', label: '미니멀 심볼형', prompt: minimal('cafe coffee shop', 'coffee cup with steam') },
      { key: 'style2', label: '텍스트 로고형', prompt: wordmark('cafe coffee shop') },
      { key: 'style3', label: '컬러풀 일러스트형', prompt: colorful('cafe', 'cute coffee cup with latte art') },
    ],
  },
  beauty: {
    styles: [
      { key: 'style1', label: '미니멀 심볼형', prompt: minimal('hair salon beauty', 'scissors and comb') },
      { key: 'style2', label: '텍스트 로고형', prompt: wordmark('hair salon beauty studio') },
      { key: 'style3', label: '컬러풀 일러스트형', prompt: colorful('hair salon', 'elegant hair strand and flowers') },
    ],
  },
  clinic: {
    styles: [
      { key: 'style1', label: '미니멀 심볼형', prompt: minimal('Korean traditional medicine clinic', 'acupuncture needle and leaf') },
      { key: 'style2', label: '텍스트 로고형', prompt: wordmark('Korean traditional medicine clinic') },
      { key: 'style3', label: '컬러풀 일러스트형', prompt: colorful('herbal medicine clinic', 'ginseng plant with green leaves') },
    ],
  },
  fitness: {
    styles: [
      { key: 'style1', label: '미니멀 심볼형', prompt: minimal('fitness gym', 'dumbbell icon') },
      { key: 'style2', label: '텍스트 로고형', prompt: wordmark('fitness gym health club') },
      { key: 'style3', label: '컬러풀 일러스트형', prompt: colorful('fitness gym', 'strong arm flexing with lightning bolt') },
    ],
  },
  fashion: {
    styles: [
      { key: 'style1', label: '미니멀 심볼형', prompt: minimal('fashion boutique', 'clothes hanger icon') },
      { key: 'style2', label: '텍스트 로고형', prompt: wordmark('fashion clothing boutique') },
      { key: 'style3', label: '컬러풀 일러스트형', prompt: colorful('fashion store', 'stylish dress on a hanger') },
    ],
  },
  tax: {
    styles: [
      { key: 'style1', label: '미니멀 심볼형', prompt: minimal('tax accounting firm', 'balance scale or document icon') },
      { key: 'style2', label: '텍스트 로고형', prompt: wordmark('tax accounting firm') },
      { key: 'style3', label: '컬러풀 일러스트형', prompt: colorful('accounting office', 'coins and calculator with checkmark') },
    ],
  },
  pension: {
    styles: [
      { key: 'style1', label: '미니멀 심볼형', prompt: minimal('pension guesthouse', 'house or roof icon') },
      { key: 'style2', label: '텍스트 로고형', prompt: wordmark('pension guesthouse resort') },
      { key: 'style3', label: '컬러풀 일러스트형', prompt: colorful('pension resort', 'cozy house with trees and mountains') },
    ],
  },
  print: {
    styles: [
      { key: 'style1', label: '미니멀 심볼형', prompt: minimal('printing shop', 'printer or document icon') },
      { key: 'style2', label: '텍스트 로고형', prompt: wordmark('printing shop design studio') },
      { key: 'style3', label: '컬러풀 일러스트형', prompt: colorful('print shop', 'colorful printed papers and ink') },
    ],
  },
};

const DEFAULT_TEMPLATE: LogoTemplate = {
  styles: [
    { key: 'style1', label: '미니멀 심볼형', prompt: minimal('business', 'abstract geometric icon') },
    { key: 'style2', label: '텍스트 로고형', prompt: wordmark('professional business') },
    { key: 'style3', label: '컬러풀 일러스트형', prompt: colorful('business', 'star and circle design') },
  ],
};

export function getLogoTemplate(industry: string): LogoTemplate {
  return LOGO_TEMPLATES[industry] ?? DEFAULT_TEMPLATE;
}
