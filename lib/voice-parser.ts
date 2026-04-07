import { TransactionItemInput } from './types';

interface ParsedItem {
  description: string;
  quantity: number;
  unit_price: number;
}

const PRICE_KEYWORDS: Record<string, number> = {
  'ganti oli': 75000,
  'oli mesin': 75000,
  'oli yamalube': 85000,
  'oli honda': 80000,
  'filter oli': 25000,
  'filter udara': 35000,
  'busi': 25000,
  'busi ngk': 35000,
  'busi iridium': 85000,
  'kampas rem depan': 85000,
  'kampas rem belakang': 65000,
  'kampas rem': 75000,
  'minyak rem': 35000,
  'ban depan': 250000,
  'ban belakang': 280000,
  'ban dalam': 45000,
  'aki': 350000,
  'rantai': 150000,
  'gear set': 250000,
  'v-belt': 180000,
  'roller': 85000,
  'bearing': 45000,
  'seal shock': 75000,
  'shock depan': 450000,
  'shock belakang': 350000,
  'lampu depan': 35000,
  'lampu belakang': 25000,
  'lampu sein': 20000,
  'kabel gas': 45000,
  'kabel kopling': 45000,
  'kabel speedometer': 35000,
  'tune up': 150000,
  'service ringan': 50000,
  'service besar': 200000,
  'jasa service': 50000,
  'jasa pasang': 30000,
  'jasa ganti': 50000,
  'cuci motor': 25000,
};

const NUMBER_WORDS: Record<string, number> = {
  'satu': 1,
  'dua': 2,
  'tiga': 3,
  'empat': 4,
  'lima': 5,
  'enam': 6,
  'tujuh': 7,
  'delapan': 8,
  'sembilan': 9,
  'sepuluh': 10,
};

export function parseVoiceInput(text: string): TransactionItemInput[] {
  const items: TransactionItemInput[] = [];
  const normalizedText = text.toLowerCase().trim();

  const segments = normalizedText.split(/[,;]|dan\s+/).map(s => s.trim()).filter(Boolean);

  for (const segment of segments) {
    const parsed = parseSegment(segment);
    if (parsed) {
      items.push(parsed);
    }
  }

  return items;
}

function parseSegment(segment: string): TransactionItemInput | null {
  let quantity = 1;
  let description = segment;
  let unit_price = 0;

  const qtyMatch = segment.match(/^(\d+)\s+(.+)$/);
  if (qtyMatch) {
    quantity = parseInt(qtyMatch[1], 10);
    description = qtyMatch[2];
  } else {
    for (const [word, num] of Object.entries(NUMBER_WORDS)) {
      const wordMatch = segment.match(new RegExp(`^${word}\\s+(.+)$`, 'i'));
      if (wordMatch) {
        quantity = num;
        description = wordMatch[1];
        break;
      }
    }
  }

  // Match price patterns: "ring 17 harga 500rb", "oli 75rb", "ban 1.5jt", "service 50k"
  const priceMatch = description.match(/(.+?)\s+(?:harga\s+)?(\d+(?:[.,]\d+)?)\s*(jt|juta|rb|ribu|k)?$/i);
  if (priceMatch) {
    description = priceMatch[1].trim();
    const priceStr = priceMatch[2] + (priceMatch[3] || '');
    unit_price = parsePrice(priceStr);
  }

  if (unit_price === 0) {
    for (const [keyword, price] of Object.entries(PRICE_KEYWORDS)) {
      if (description.includes(keyword)) {
        unit_price = price;
        break;
      }
    }
  }

  if (!description) return null;

  description = description.charAt(0).toUpperCase() + description.slice(1);

  return {
    description,
    quantity,
    unit_price,
  };
}

function parsePrice(priceStr: string): number {
  let price = priceStr.toLowerCase().trim();

  price = price.replace(/\./g, '');
  price = price.replace(/,/g, '');

  // Handle "juta" / "jt" format (e.g., "1jt", "1.5juta", "satu juta")
  if (price.includes('juta') || price.includes('jt')) {
    price = price.replace(/juta|jt/gi, '');
    const num = parseFloat(price) || 1;
    return Math.round(num * 1000000);
  }

  // Handle "ribu" / "rb" / "k" format (e.g., "500rb", "500ribu", "500k")
  if (price.includes('ribu') || price.includes('rb') || price.includes('k')) {
    price = price.replace(/ribu|rb|k/gi, '');
    const num = parseFloat(price) || 0;
    return Math.round(num * 1000);
  }

  const num = parseInt(price, 10);

  // If number is small (< 1000), assume it's in thousands
  if (num > 0 && num < 1000) {
    return num * 1000;
  }

  return num || 0;
}

// Parse price from voice text with format like "harga 500rb" or "500 ribu"
export function parseVoicePrice(text: string): number {
  const normalized = text.toLowerCase().trim();

  // Match patterns like "harga 500rb", "500 ribu", "1jt", "1.5 juta"
  const pricePatterns = [
    /harga\s+(\d+(?:[.,]\d+)?)\s*(jt|juta|rb|ribu|k)?/i,
    /(\d+(?:[.,]\d+)?)\s*(jt|juta|rb|ribu|k)/i,
    /(\d+(?:[.,]\d+)?)\s*rupiah/i,
  ];

  for (const pattern of pricePatterns) {
    const match = normalized.match(pattern);
    if (match) {
      const numStr = match[1].replace(',', '.');
      const suffix = match[2]?.toLowerCase() || '';
      const num = parseFloat(numStr);

      if (suffix === 'jt' || suffix === 'juta') {
        return Math.round(num * 1000000);
      } else if (suffix === 'rb' || suffix === 'ribu' || suffix === 'k') {
        return Math.round(num * 1000);
      } else {
        return num < 1000 ? num * 1000 : num;
      }
    }
  }

  return 0;
}

export function formatItemsPreview(items: TransactionItemInput[]): string {
  return items
    .map((item, i) => {
      const price = item.unit_price > 0
        ? ` - Rp ${item.unit_price.toLocaleString('id-ID')}`
        : ' - (harga belum diisi)';
      return `${i + 1}. ${item.description} x${item.quantity}${price}`;
    })
    .join('\n');
}

export function isWebSpeechSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface ISpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => ISpeechRecognition;
    webkitSpeechRecognition?: new () => ISpeechRecognition;
  }
}

export type { ISpeechRecognition, SpeechRecognitionEvent };

export function createSpeechRecognition(): ISpeechRecognition | null {
  if (typeof window === 'undefined') return null;

  const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognitionConstructor) return null;

  const recognition = new SpeechRecognitionConstructor();
  recognition.lang = 'id-ID';
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  return recognition;
}
