'use client';

import { useState, useEffect, useCallback } from 'react';
import BottomNav from '@/components/BottomNav';
import { createSpeechRecognition, isWebSpeechSupported, ISpeechRecognition, SpeechRecognitionEvent } from '@/lib/voice-parser';

export interface OutOfStockItem {
  id: string;
  name: string;
  created_at: string;
  is_bought: boolean;
}

interface StokRecordPageProps {
  initialItems: OutOfStockItem[];
}

export default function StokRecordPage({ initialItems }: StokRecordPageProps) {
  const [items, setItems] = useState<OutOfStockItem[]>(initialItems);
  const [newItemName, setNewItemName] = useState('');

  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const [recognition, setRecognition] = useState<ISpeechRecognition | null>(null);

  useEffect(() => {
    setIsVoiceSupported(isWebSpeechSupported());
  }, []);

  const startListening = useCallback(() => {
    const rec = createSpeechRecognition();
    if (!rec) return;

    rec.onstart = () => {
      setIsListening(true);
      setNewItemName('');
    };

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      setNewItemName(finalTranscript || interimTranscript);
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

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    
    // Catatan: Ini sementara hanya state UI. Nanti dihubungkan ke Server Action/Database.
    const newItem: OutOfStockItem = {
      id: Date.now().toString(),
      name: newItemName,
      created_at: new Date().toISOString(),
      is_bought: false
    };
    
    setItems([newItem, ...items]);
    setNewItemName('');
  };

  const toggleBought = (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, is_bought: !item.is_bought } : item
    ));
  };

  const deleteItem = (id: string) => {
    if (confirm('Hapus catatan ini?')) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const activeItems = items.filter(i => !i.is_bought);
  const boughtItems = items.filter(i => i.is_bought);

  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-28">
        <div className="max-w-lg mx-auto">
          
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Catatan Stok</h1>
            <p className="text-sm text-gray-500">Catat barang kosong/habis agar tidak lupa dibeli</p>
          </div>

          {/* Add Item Form */}
          <form onSubmit={handleAddItem} className="flex items-center gap-3 mb-6">
            <div className="flex-1 relative">
              {isVoiceSupported ? (
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isListening ? 'bg-red-100 text-[#E10600] animate-pulse' : 'text-gray-400 hover:text-[#E10600] hover:bg-red-50'
                  }`}
                  title={isListening ? "Berhenti mendengarkan" : "Gunakan suara"}
                >
                  {isListening ? (
                    <span className="w-2.5 h-2.5 bg-[#E10600] rounded-full"></span>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  )}
                </button>
              ) : (
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
              )}
              <input
                type="text"
                placeholder={isListening ? "Mendengarkan..." : "Oli Motul, Kampas..."}
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="w-full h-12 pl-12 pr-4 rounded-full border-2 border-gray-200 bg-white text-sm focus:outline-none focus:border-[#E10600] transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={!newItemName.trim()}
              className="w-12 h-12 rounded-full bg-[#E10600] flex items-center justify-center text-white hover:bg-red-700 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none flex-shrink-0"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </form>

          {/* Active Items List */}
          <div className="mb-6">
            <h2 className="text-sm font-bold text-gray-800 mb-3 px-1 flex items-center justify-between">
              <span>Perlu Dibeli ({activeItems.length})</span>
            </h2>
            <div className="space-y-3">
              {activeItems.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">Semua aman!</p>
                  <p className="text-gray-400 text-sm mt-1">Tidak ada catatan barang kosong.</p>
                </div>
              ) : (
                activeItems.map(item => (
                  <div key={item.id} className="bg-white rounded-2xl border border-gray-300 p-4 flex items-center justify-between hover:shadow-lg hover:shadow-gray-200/50 hover:scale-[1.02] hover:border-gray-200 transition-all group">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <button 
                        onClick={() => toggleBought(item.id)}
                        className="w-7 h-7 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-green-500 hover:bg-green-50 transition-all flex-shrink-0"
                      >
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-lg truncate group-hover:text-[#E10600] transition-colors">{item.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Dicatat {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => deleteItem(item.id)}
                      className="w-10 h-10 rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 ml-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bought Items List */}
          {boughtItems.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-gray-500 mb-3 px-1">
                Sudah Dibeli ({boughtItems.length})
              </h2>
              <div className="space-y-3 opacity-60">
                {boughtItems.map(item => (
                  <div key={item.id} className="bg-gray-50 rounded-2xl border border-gray-200 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <button 
                        onClick={() => toggleBought(item.id)}
                        className="w-7 h-7 rounded-full bg-green-500 border-2 border-green-500 flex items-center justify-center flex-shrink-0 text-white"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-500 line-through text-lg truncate">{item.name}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => deleteItem(item.id)}
                      className="w-10 h-10 rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all ml-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      <BottomNav />
    </div>
  );
}
