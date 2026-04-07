'use client';

import { useState, useRef } from 'react';
import VoiceInput from './VoiceInput';
import { TransactionItemInput } from '@/lib/types';
import { parseVoiceInput } from '@/lib/voice-parser';
import { formatCurrency, formatNumber, parseFormattedNumber } from '@/lib/utils';

interface Props {
  items: TransactionItemInput[];
  onChange: (items: TransactionItemInput[]) => void;
}

export default function TransactionItemsEditor({ items, onChange }: Props) {
  const [manualInput, setManualInput] = useState('');
  const [swipeStates, setSwipeStates] = useState<{ [key: number]: number }>({});
  const [confirmingDelete, setConfirmingDelete] = useState<number | null>(null);
  const touchStartX = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent, index: number) => {
    const currentX = e.touches[0].clientX;
    const diff = touchStartX.current - currentX;
    if (diff > 0) {
      setSwipeStates(prev => ({ ...prev, [index]: Math.min(diff, 80) }));
    } else {
      setSwipeStates(prev => ({ ...prev, [index]: 0 }));
    }
  };

  const handleTouchEnd = (index: number) => {
    const swipeDistance = swipeStates[index] || 0;
    // Only reveal delete button, don't auto-delete
    if (swipeDistance > 60) {
      setSwipeStates(prev => ({ ...prev, [index]: 80 })); // Lock at reveal position
    } else {
      setSwipeStates(prev => ({ ...prev, [index]: 0 })); // Snap back
    }
  };

  const handleConfirmDelete = (index: number) => {
    handleRemoveItem(index);
    setSwipeStates(prev => ({ ...prev, [index]: 0 }));
    setConfirmingDelete(null);
  };

  const handleCancelDelete = (index: number) => {
    setSwipeStates(prev => ({ ...prev, [index]: 0 }));
    setConfirmingDelete(null);
  };

  const handleVoiceResult = (text: string) => {
    const parsed = parseVoiceInput(text);
    if (parsed.length > 0) {
      onChange([...items, ...parsed]);
    }
  };

  const handleManualAdd = () => {
    if (!manualInput.trim()) return;

    const parsed = parseVoiceInput(manualInput);
    if (parsed.length > 0) {
      onChange([...items, ...parsed]);
      setManualInput('');
    }
  };

  const handleRemoveItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: keyof TransactionItemInput, value: string | number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const total = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  return (
    <div className="space-y-4">
      {/* Input Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ganti oli, busi ngk, jasa service..."
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleManualAdd())}
            className="flex-1 h-12 px-4 rounded-full border-2 border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:border-gray-400"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleManualAdd}
              disabled={!manualInput.trim()}
              className="w-12 h-12 rounded-full bg-[#E10600] text-white text-xl disabled:opacity-50 flex items-center justify-center hover:opacity-90"
            >
              +
            </button>
            <VoiceInput onResult={handleVoiceResult} />
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2 px-1">
          Pisahkan item dengan koma. Contoh: "ganti oli 75000, busi ngk 35000"
        </p>
      </div>

      {/* Items List */}
      {items.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
          {items.map((item, index) => (
            <div key={index} className="relative overflow-hidden">
              {/* Delete Layer - with Confirm/Cancel buttons */}
              <div className="absolute inset-y-0 right-0 flex items-center">
                {swipeStates[index] && swipeStates[index] > 60 ? (
                  <div className="flex h-full">
                    <button
                      onClick={() => handleCancelDelete(index)}
                      className="w-16 h-full bg-gray-400 text-white font-medium text-xs flex items-center justify-center"
                    >
                      Batal
                    </button>
                    <button
                      onClick={() => handleConfirmDelete(index)}
                      className="w-20 h-full bg-[#E10600] text-white font-medium text-sm flex items-center justify-center"
                    >
                      Hapus
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-full bg-[#E10600] flex items-center justify-center text-white font-medium text-sm">
                    <span className="transform translate-x-4">Hapus</span>
                  </div>
                )}
              </div>
              <div
                className="p-4 flex items-start gap-3 bg-white relative transition-transform"
                style={{ transform: `translateX(-${swipeStates[index] || 0}px)` }}
                onTouchStart={(e) => handleTouchStart(e, index)}
                onTouchMove={(e) => handleTouchMove(e, index)}
                onTouchEnd={() => handleTouchEnd(index)}
              >
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleUpdateItem(index, 'description', e.target.value)}
                    className="w-full text-lg font-semibold text-gray-900 bg-transparent border-none outline-none"
                  />
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center bg-gray-100 rounded-lg">
                      <button
                        type="button"
                        onClick={() => handleUpdateItem(index, 'quantity', Math.max(1, item.quantity - 1))}
                        className="w-8 h-8 text-gray-500 hover:text-[#E10600] text-lg font-bold"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-10 text-center text-base font-medium bg-transparent border-none outline-none text-gray-900"
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateItem(index, 'quantity', item.quantity + 1)}
                        className="w-8 h-8 text-gray-500 hover:text-[#E10600] text-lg font-bold"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-sm text-gray-400">Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatNumber(item.quantity * item.unit_price)}
                      onChange={(e) => {
                        const total = parseFormattedNumber(e.target.value);
                        const newUnitPrice = Math.round(total / item.quantity);
                        handleUpdateItem(index, 'unit_price', newUnitPrice);
                      }}
                      className="w-24 text-base text-right bg-transparent border-none outline-none text-[#E10600] font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
