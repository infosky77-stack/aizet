export interface SiteConfig {
  tagline?: string;
  theme?: string;
  cta_text?: string;
  sections_hidden?: string[];
}

export function parseSiteConfig(raw: string | undefined | null): SiteConfig {
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}
