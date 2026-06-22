import { LabelData, LabelCountry } from '@/types/print-files';

interface CountryConfig {
  name: string;
  language: string;
  primaryColor: string;
  accentColor: string;
  requiredFields: string[];
  certMark?: string;
  warningText?: string;
}

const COUNTRY_CONFIG: Record<LabelCountry, CountryConfig> = {
  US: {
    name: 'United States',
    language: 'English',
    primaryColor: '#0A3161',
    accentColor: '#B31942',
    requiredFields: ['productName', 'modelNumber', 'quantity', 'origin', 'dimensions', 'weight'],
    warningText: 'KEEP OUT OF REACH OF CHILDREN',
  },
  EU: {
    name: 'European Union',
    language: 'English/Multi',
    primaryColor: '#003399',
    accentColor: '#FFCC00',
    requiredFields: ['productName', 'modelNumber', 'quantity', 'origin', 'dimensions', 'weight'],
    certMark: 'CE',
    warningText: 'ATTENTION: READ INSTRUCTIONS BEFORE USE',
  },
  JP: {
    name: 'Japan',
    language: 'Japanese',
    primaryColor: '#BC002D',
    accentColor: '#FFFFFF',
    requiredFields: ['productName', 'modelNumber', 'quantity', 'origin', 'dimensions', 'weight'],
    certMark: 'PSE',
    warningText: '取り扱いに注意してください',
  },
  CN: {
    name: 'China',
    language: 'Chinese',
    primaryColor: '#DE2910',
    accentColor: '#FFDE00',
    requiredFields: ['productName', 'modelNumber', 'quantity', 'origin', 'dimensions', 'weight'],
    certMark: 'CCC',
    warningText: '请保持儿童不能触及',
  },
  KR: {
    name: 'Korea',
    language: 'Korean',
    primaryColor: '#003478',
    accentColor: '#CD2E3A',
    requiredFields: ['productName', 'modelNumber', 'quantity', 'origin', 'dimensions', 'weight'],
    warningText: '어린이의 손이 닿지 않는 곳에 보관하세요',
  },
  AU: {
    name: 'Australia',
    language: 'English',
    primaryColor: '#00008B',
    accentColor: '#FF0000',
    requiredFields: ['productName', 'modelNumber', 'quantity', 'origin', 'dimensions', 'weight'],
    certMark: 'RCM',
    warningText: 'CAUTION: HANDLE WITH CARE',
  },
  GB: {
    name: 'United Kingdom',
    language: 'English',
    primaryColor: '#012169',
    accentColor: '#C8102E',
    requiredFields: ['productName', 'modelNumber', 'quantity', 'origin', 'dimensions', 'weight'],
    certMark: 'UKCA',
    warningText: 'CAUTION: KEEP OUT OF REACH OF CHILDREN',
  },
  CA: {
    name: 'Canada',
    language: 'English/French',
    primaryColor: '#FF0000',
    accentColor: '#FFFFFF',
    requiredFields: ['productName', 'modelNumber', 'quantity', 'origin', 'dimensions', 'weight'],
    certMark: 'CSA',
    warningText: 'CAUTION / ATTENTION: HANDLE WITH CARE',
  },
  IN: {
    name: 'India',
    language: 'English',
    primaryColor: '#FF9933',
    accentColor: '#138808',
    requiredFields: ['productName', 'modelNumber', 'quantity', 'origin', 'dimensions', 'weight'],
    certMark: 'BIS',
    warningText: 'CAUTION: KEEP OUT OF REACH OF CHILDREN',
  },
  SG: {
    name: 'Singapore',
    language: 'English',
    primaryColor: '#EF3340',
    accentColor: '#FFFFFF',
    requiredFields: ['productName', 'modelNumber', 'quantity', 'origin', 'dimensions', 'weight'],
    certMark: 'SAFETY',
    warningText: 'CAUTION: HANDLE WITH CARE',
  },
  MY: {
    name: 'Malaysia',
    language: 'Malay',
    primaryColor: '#CC0001',
    accentColor: '#FFCC00',
    requiredFields: ['productName', 'modelNumber', 'quantity', 'origin', 'dimensions', 'weight'],
    certMark: 'SIRIM',
    warningText: 'AMARAN: JAUHKAN DARI KANAK-KANAK',
  },
  ID: {
    name: 'Indonesia',
    language: 'Indonesian',
    primaryColor: '#CE1126',
    accentColor: '#FFFFFF',
    requiredFields: ['productName', 'modelNumber', 'quantity', 'origin', 'dimensions', 'weight'],
    certMark: 'SNI',
    warningText: 'PERINGATAN: JAUHKAN DARI JANGKAUAN ANAK-ANAK',
  },
  VN: {
    name: 'Vietnam',
    language: 'Vietnamese',
    primaryColor: '#DA251D',
    accentColor: '#FFFF00',
    requiredFields: ['productName', 'modelNumber', 'quantity', 'origin', 'dimensions', 'weight'],
    warningText: 'CẢNH BÁO: ĐỂ XA TẦM TAY TRẺ EM',
  },
  TH: {
    name: 'Thailand',
    language: 'Thai',
    primaryColor: '#2D2A4A',
    accentColor: '#A51931',
    requiredFields: ['productName', 'modelNumber', 'quantity', 'origin', 'dimensions', 'weight'],
    certMark: 'TISI',
    warningText: 'คำเตือน: เก็บให้ห่างจากเด็ก',
  },
  MX: {
    name: 'Mexico',
    language: 'Spanish',
    primaryColor: '#006847',
    accentColor: '#CE1126',
    requiredFields: ['productName', 'modelNumber', 'quantity', 'origin', 'dimensions', 'weight'],
    certMark: 'NOM',
    warningText: 'ADVERTENCIA: MANTENER FUERA DEL ALCANCE DE LOS NIÑOS',
  },
  BR: {
    name: 'Brazil',
    language: 'Portuguese',
    primaryColor: '#009C3B',
    accentColor: '#FFDF00',
    requiredFields: ['productName', 'modelNumber', 'quantity', 'origin', 'dimensions', 'weight'],
    certMark: 'INMETRO',
    warningText: 'ATENÇÃO: MANTER FORA DO ALCANCE DE CRIANÇAS',
  },
  AE: {
    name: 'UAE',
    language: 'Arabic/English',
    primaryColor: '#00732F',
    accentColor: '#FF0000',
    requiredFields: ['productName', 'modelNumber', 'quantity', 'origin', 'dimensions', 'weight'],
    certMark: 'ESMA',
    warningText: 'CAUTION: KEEP OUT OF REACH OF CHILDREN',
  },
  SA: {
    name: 'Saudi Arabia',
    language: 'Arabic/English',
    primaryColor: '#006C35',
    accentColor: '#FFFFFF',
    requiredFields: ['productName', 'modelNumber', 'quantity', 'origin', 'dimensions', 'weight'],
    certMark: 'SASO',
    warningText: 'CAUTION: KEEP OUT OF REACH OF CHILDREN',
  },
};

function genBarcode(value: string): string {
  const bars: string[] = [];
  let x = 0;
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    const wide = (code % 3 === 0);
    const w = wide ? 3 : 1.5;
    if (i % 2 === 0) {
      bars.push(`<rect x="${x}" y="0" width="${w}" height="60" fill="#000"/>`);
    }
    x += w + 1;
  }
  const guardLeft = `<rect x="0" y="0" width="2" height="65" fill="#000"/><rect x="3" y="0" width="1" height="65" fill="#000"/>`;
  const guardRight = `<rect x="${x}" y="0" width="1" height="65" fill="#000"/><rect x="${x + 2}" y="0" width="2" height="65" fill="#000"/>`;
  return guardLeft + bars.join('') + guardRight;
}

const LABEL_FIELD_LABELS: Record<string, Record<LabelCountry, string>> = {
  product: {
    US: 'Product Name', EU: 'Product', JP: '製品名', CN: '产品名称', KR: '제품명', AU: 'Product Name',
    GB: 'Product Name', CA: 'Product Name', IN: 'Product Name',
    SG: 'Product Name', MY: 'Nama Produk', ID: 'Nama Produk', VN: 'Tên sản phẩm', TH: 'ชื่อสินค้า',
    MX: 'Nombre del Producto', BR: 'Nome do Produto', AE: 'Product Name', SA: 'Product Name',
  },
  model: {
    US: 'Model No.', EU: 'Model', JP: 'モデル番号', CN: '型号', KR: '모델번호', AU: 'Model No.',
    GB: 'Model No.', CA: 'Model No.', IN: 'Model No.',
    SG: 'Model No.', MY: 'No. Model', ID: 'No. Model', VN: 'Số model', TH: 'รุ่น',
    MX: 'No. de Modelo', BR: 'Nº do Modelo', AE: 'Model No.', SA: 'Model No.',
  },
  qty: {
    US: 'Qty', EU: 'Qty', JP: '数量', CN: '数量', KR: '수량', AU: 'Qty',
    GB: 'Qty', CA: 'Qty', IN: 'Qty',
    SG: 'Qty', MY: 'Kuantiti', ID: 'Jumlah', VN: 'Số lượng', TH: 'จำนวน',
    MX: 'Cantidad', BR: 'Quantidade', AE: 'Qty', SA: 'Qty',
  },
  origin: {
    US: 'Made in', EU: 'Made in', JP: '原産国', CN: '原产地', KR: '원산지', AU: 'Made in',
    GB: 'Made in', CA: 'Made in', IN: 'Made in',
    SG: 'Made in', MY: 'Dibuat di', ID: 'Asal', VN: 'Xuất xứ', TH: 'ผลิตใน',
    MX: 'Fabricado en', BR: 'Fabricado em', AE: 'Made in', SA: 'Made in',
  },
  dims: {
    US: 'Dimensions', EU: 'Dimensions (cm)', JP: '外形寸法', CN: '尺寸', KR: '크기', AU: 'Dimensions',
    GB: 'Dimensions', CA: 'Dimensions', IN: 'Dimensions',
    SG: 'Dimensions', MY: 'Dimensi', ID: 'Dimensi', VN: 'Kích thước', TH: 'ขนาด',
    MX: 'Dimensiones', BR: 'Dimensões', AE: 'Dimensions', SA: 'Dimensions',
  },
  weight: {
    US: 'Net Weight', EU: 'Weight', JP: '重量', CN: '重量', KR: '중량', AU: 'Net Weight',
    GB: 'Net Weight', CA: 'Net Weight', IN: 'Net Weight',
    SG: 'Net Weight', MY: 'Berat', ID: 'Berat', VN: 'Trọng lượng', TH: 'น้ำหนัก',
    MX: 'Peso Neto', BR: 'Peso Líquido', AE: 'Net Weight', SA: 'Net Weight',
  },
};

export interface LabelOverrides {
  headerBg?: string;
  accentColor?: string;
  bodyText?: string;
  labelText?: string;
  productNameSize?: number;
  productNameY?: number;
  col1X?: number;
  col2X?: number;
  barcodeX?: number;
  barcodeY?: number;
  warningText?: string;
}

export function getDefaultOverrides(country: LabelCountry): Required<LabelOverrides> {
  const cfg = COUNTRY_CONFIG[country];
  return {
    headerBg: cfg.primaryColor,
    accentColor: cfg.accentColor,
    bodyText: '#111111',
    labelText: '#666666',
    productNameSize: 16,
    productNameY: 72,
    col1X: 16,
    col2X: 160,
    barcodeX: 20,
    barcodeY: 180,
    warningText: cfg.warningText ?? '',
  };
}

export function generateLabelSVG(data: LabelData, overrides?: LabelOverrides): string {
  const cfg = COUNTRY_CONFIG[data.country];
  const barcodeValue = `${data.modelNumber}${data.quantity}`;
  const fl = (key: string) => LABEL_FIELD_LABELS[key]?.[data.country] ?? key;

  const d = getDefaultOverrides(data.country);
  const hBg    = overrides?.headerBg        ?? d.headerBg;
  const hAc    = overrides?.accentColor     ?? d.accentColor;
  const bodyC  = overrides?.bodyText        ?? d.bodyText;
  const labelC = overrides?.labelText       ?? d.labelText;
  const pnSize = overrides?.productNameSize ?? d.productNameSize;
  const pnY    = overrides?.productNameY    ?? d.productNameY;
  const c1x    = overrides?.col1X           ?? d.col1X;
  const c2x    = overrides?.col2X           ?? d.col2X;
  const bcX    = overrides?.barcodeX        ?? d.barcodeX;
  const bcY    = overrides?.barcodeY        ?? d.barcodeY;
  const warn   = overrides?.warningText     ?? d.warningText;

  // Clamp bcY so barcode bottom (guard bar height 65px) + 15px gap never reaches warning text (y=260)
  const WARN_Y = 260;
  const BAR_H  = 65;
  const MIN_GAP = 15;
  const effectiveBcY = warn.trim()
    ? Math.min(bcY, WARN_Y - MIN_GAP - BAR_H)  // = max 180
    : bcY;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="280" viewBox="0 0 400 280" font-family="Arial, sans-serif">
  <rect width="400" height="280" fill="#FFFFFF" rx="4"/>
  <rect width="400" height="280" fill="none" rx="4" stroke="#CCCCCC" stroke-width="1"/>

  <rect x="0" y="0" width="400" height="44" fill="${hBg}" rx="4"/>
  <rect x="0" y="30" width="400" height="14" fill="${hBg}"/>
  <text x="${c1x}" y="28" fill="${hAc}" font-size="18" font-weight="bold">${cfg.name.toUpperCase()}</text>
  ${cfg.certMark ? `<text x="370" y="28" fill="${hAc}" font-size="14" font-weight="bold" text-anchor="end">${cfg.certMark}</text>` : ''}

  <text x="${c1x}" y="${pnY}" fill="${bodyC}" font-size="${pnSize}" font-weight="bold">${data.productName}</text>

  <text x="${c1x}" y="98" fill="${labelC}" font-size="9">${fl('model')}</text>
  <text x="${c1x}" y="112" fill="${bodyC}" font-size="11" font-weight="bold">${data.modelNumber}</text>

  <text x="${c1x}" y="132" fill="${labelC}" font-size="9">${fl('qty')}</text>
  <text x="${c1x}" y="146" fill="${bodyC}" font-size="11" font-weight="bold">${data.quantity.toLocaleString()} PCS</text>

  <text x="${c1x}" y="166" fill="${labelC}" font-size="9">${fl('origin')}</text>
  <text x="${c1x}" y="180" fill="${bodyC}" font-size="11" font-weight="bold">${data.origin}</text>

  <text x="${c2x}" y="98" fill="${labelC}" font-size="9">${fl('dims')} (L×W×H)</text>
  <text x="${c2x}" y="112" fill="${bodyC}" font-size="11" font-weight="bold">${data.boxL}×${data.boxW}×${data.boxH} cm</text>

  <text x="${c2x}" y="132" fill="${labelC}" font-size="9">${fl('weight')}</text>
  <text x="${c2x}" y="146" fill="${bodyC}" font-size="11" font-weight="bold">${data.weight} kg</text>

  <line x1="${c1x}" y1="195" x2="384" y2="195" stroke="#EEEEEE" stroke-width="1"/>

  <g transform="translate(${bcX}, ${effectiveBcY})">
    ${genBarcode(barcodeValue)}
  </g>
  <text x="${bcX}" y="275" fill="#333333" font-size="8" letter-spacing="3">${barcodeValue.toUpperCase().substring(0, 20)}</text>

  <text x="200" y="260" fill="#888888" font-size="7" text-anchor="middle">${warn}</text>
</svg>`;
}
