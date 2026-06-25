export interface SiteConfig {
  tagline?: string;
  hero_description?: string; // Hero 슬로건 아래 소개글
  theme?: string;
  cta_text?: string;
  sections_hidden?: string[];
}

export function parseSiteConfig(raw: string | undefined | null): SiteConfig {
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}
