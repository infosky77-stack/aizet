export type LabelCountry =
  | 'US' | 'EU' | 'JP' | 'CN' | 'KR' | 'AU'
  | 'GB' | 'CA' | 'IN' | 'SG' | 'MY' | 'ID' | 'VN' | 'TH'
  | 'MX' | 'BR' | 'AE' | 'SA';

export interface Client {
  id: string;
  company: string;
  country: string;       // 국가명 (한글)
  countryCode: string;   // ISO 2자리
  contactName?: string;
  contactEmail?: string;
  createdAt: string;
}

export interface ClientFile {
  id: string;
  clientId: string;
  product: string;       // 제품/폴더명
  filename: string;
  fileType: string;      // .ai .cdr .pdf .jpg 등
  version: number;
  isLatest: boolean;
  uploadedAt: string;
  sizeBytes: number;
  tags?: string[];
}

export interface LabelData {
  productName: string;
  modelNumber: string;
  quantity: number;
  origin: string;
  boxL: number;
  boxW: number;
  boxH: number;
  weight: number;
  country: LabelCountry;
}

export interface GeneratedLabel {
  id: string;
  clientId?: string;
  product?: string;
  data: LabelData;
  svgContent: string;
  createdAt: string;
}
