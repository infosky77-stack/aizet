export type PrintCategory = 'business-card' | 'flyer' | 'booklet' | 'banner' | 'sticker' | 'package';

export type PaperType = 'art' | 'mojo' | 'snow' | 'kraft' | 'thick-art';
export type CoatingType = 'none' | 'gloss' | 'matte' | 'uv' | 'double';
export type BindingType = 'none' | 'saddle' | 'perfect';
export type PrintSide = 'single' | 'double';
export type PrintOrderStatus = 'received' | 'printing' | 'finishing' | 'inspection' | 'shipping' | 'delivered';

export interface PrintProduct {
  id: string;
  category: PrintCategory;
  name: string;
  description: string;
  basePrice: number;
  baseQuantity: number;
  sizes: string[];
  popular?: boolean;
  image?: string;
  turnaround: string;
}

export interface QuoteOptions {
  category: PrintCategory;
  size: string;
  paper: PaperType;
  quantity: number;
  binding: BindingType;
  coating: CoatingType;
  sides: PrintSide;
}

export interface PrintOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  category: PrintCategory;
  productName: string;
  options: QuoteOptions;
  totalPrice: number;
  status: PrintOrderStatus;
  fileUploaded: boolean;
  memo?: string;
  createdAt: string;
  updatedAt: string;
  estimatedDays: number;
}
