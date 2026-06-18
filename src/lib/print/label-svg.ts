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
  product: { US: 'Product Name', EU: 'Product', JP: '製品名', CN: '产品名称', KR: '제품명', AU: 'Product Name' },
  model: { US: 'Model No.', EU: 'Model', JP: 'モデル番号', CN: '型号', KR: '모델번호', AU: 'Model No.' },
  qty: { US: 'Qty', EU: 'Qty', JP: '数量', CN: '数量', KR: '수량', AU: 'Qty' },
  origin: { US: 'Made in', EU: 'Made in', JP: '原産国', CN: '原产地', KR: '원산지', AU: 'Made in' },
  dims: { US: 'Dimensions', EU: 'Dimensions (cm)', JP: '外形寸法', CN: '尺寸', KR: '크기', AU: 'Dimensions' },
  weight: { US: 'Net Weight', EU: 'Weight', JP: '重量', CN: '重量', KR: '중량', AU: 'Net Weight' },
};

export function generateLabelSVG(data: LabelData): string {
  const cfg = COUNTRY_CONFIG[data.country];
  const barcodeValue = `${data.modelNumber}${data.quantity}`;

  const fl = (key: string) => LABEL_FIELD_LABELS[key]?.[data.country] ?? key;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="280" viewBox="0 0 400 280" font-family="Arial, sans-serif">
  <!-- Background -->
  <rect width="400" height="280" fill="#FFFFFF" rx="4"/>
  <rect width="400" height="280" fill="none" rx="4" stroke="#CCCCCC" stroke-width="1"/>

  <!-- Header bar -->
  <rect x="0" y="0" width="400" height="44" fill="${cfg.primaryColor}" rx="4"/>
  <rect x="0" y="30" width="400" height="14" fill="${cfg.primaryColor}"/>
  <text x="16" y="28" fill="${cfg.accentColor}" font-size="18" font-weight="bold">${cfg.name.toUpperCase()}</text>
  ${cfg.certMark ? `<text x="370" y="28" fill="${cfg.accentColor}" font-size="14" font-weight="bold" text-anchor="end">${cfg.certMark}</text>` : ''}

  <!-- Product name -->
  <text x="16" y="72" fill="#111111" font-size="16" font-weight="bold">${data.productName}</text>

  <!-- Fields left column -->
  <text x="16" y="98" fill="#666666" font-size="9">${fl('model')}</text>
  <text x="16" y="112" fill="#111111" font-size="11" font-weight="bold">${data.modelNumber}</text>

  <text x="16" y="132" fill="#666666" font-size="9">${fl('qty')}</text>
  <text x="16" y="146" fill="#111111" font-size="11" font-weight="bold">${data.quantity.toLocaleString()} PCS</text>

  <text x="16" y="166" fill="#666666" font-size="9">${fl('origin')}</text>
  <text x="16" y="180" fill="#111111" font-size="11" font-weight="bold">${data.origin}</text>

  <!-- Fields right column -->
  <text x="160" y="98" fill="#666666" font-size="9">${fl('dims')} (L×W×H)</text>
  <text x="160" y="112" fill="#111111" font-size="11" font-weight="bold">${data.boxL}×${data.boxW}×${data.boxH} cm</text>

  <text x="160" y="132" fill="#666666" font-size="9">${fl('weight')}</text>
  <text x="160" y="146" fill="#111111" font-size="11" font-weight="bold">${data.weight} kg</text>

  <!-- Divider -->
  <line x1="16" y1="195" x2="384" y2="195" stroke="#EEEEEE" stroke-width="1"/>

  <!-- Barcode -->
  <g transform="translate(20, 202)">
    ${genBarcode(barcodeValue)}
  </g>
  <text x="20" y="275" fill="#333333" font-size="8" letter-spacing="3">${barcodeValue.toUpperCase().substring(0, 20)}</text>

  <!-- Warning text -->
  <text x="200" y="260" fill="#888888" font-size="7" text-anchor="middle">${cfg.warningText ?? ''}</text>
</svg>`;
}
