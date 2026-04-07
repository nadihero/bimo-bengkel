'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addItemToTransaction } from '@/lib/actions/transaction';
import { parseVoiceInput } from '@/lib/voice-parser';
import { createSpeechRecognition, isWebSpeechSupported, ISpeechRecognition, SpeechRecognitionEvent } from '@/lib/voice-parser';
import { formatNumber, parseFormattedNumber } from '@/lib/utils';

interface Props {
  transactionId: string;
}

export default function AddItemForm({ transactionId }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [recognition, setRecognition] = useState<ISpeechRecognition | null>(null);

  useEffect(() => {
    setVoiceSupported(isWebSpeechSupported());
  }, []);

  const handleSubmit = async () => {
    if (!description.trim() || !price) return;

    const qty = parseInt(quantity) || 1;
    const priceNum = parseFormattedNumber(price);
    if (priceNum <= 0) return;

    setLoading(true);
    await addItemToTransaction(transactionId, {
      description: description.trim(),
      quantity: qty,
      unit_price: priceNum
    });

    setDescription('');
    setQuantity('1');
    setPrice('');
    setIsOpen(false);
    setLoading(false);
    router.refresh();
  };

  const handleCancel = () => {
    setDescription('');
    setQuantity('1');
    setPrice('');
    setIsOpen(false);
    if (recognition) {
      recognition.stop();
    }
  };

  const startListening = useCallback(() => {
    const rec = createSpeechRecognition();
    if (!rec) return;

    rec.onstart = () => {
      setIsListening(true);
    };

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        }
      }

      if (finalTranscript) {
        const parsed = parseVoiceInput(finalTranscript);
        if (parsed.length > 0) {
          const item = parsed[0];
          setDescription(item.description);
          setQuantity(item.quantity.toString());
          if (item.unit_price > 0) {
            setPrice(item.unit_price.toString());
          }
        }
      }
    };

    rec.onerror = () => {
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    setRecognition(rec);
    rec.start();
  }, []);

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
    }
  }, [recognition]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-[#E10600] hover:text-[#E10600] transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Tambah Item
      </button>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
      {/* Voice Input Button */}
      {voiceSupported && (
        <button
          type="button"
          onClick={isListening ? stopListening : startListening}
          className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${isListening
            ? 'bg-[#E10600] text-white'
            : 'bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-[#E10600]'
            }`}
        >
          {isListening ? (
            <>
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              Mendengarkan...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              Input Suara
            </>
          )}
        </button>
      )}

      <input
        type="text"
        placeholder="Deskripsi item"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-[#E10600]"
        autoFocus
      />
      <div className="flex gap-2">
        <input
          type="number"
          placeholder="Qty"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          min="1"
          className="w-20 px-3 py-2 rounded-lg border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-[#E10600]"
        />
        <input
          type="text"
          inputMode="numeric"
          placeholder="Harga"
          value={price}
          onChange={(e) => setPrice(formatNumber(e.target.value))}
          className="flex-1 px-3 py-2 rounded-lg border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-[#E10600]"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={loading || !description.trim() || !price}
          className="flex-1 px-4 py-2 bg-[#E10600] text-white rounded-lg font-medium disabled:opacity-50"
        >
          {loading ? 'Menyimpan...' : 'Simpan'}
        </button>
        <button
          onClick={handleCancel}
          className="px-4 py-2 text-gray-500 hover:text-[#E10600]"
        >
          Batal
        </button>
      </div>
    </div>
  );
}
