import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Tag, 
  ChevronDown, 
  Store, 
  AlertCircle, 
  ShoppingCart, 
  CheckCircle2, 
  MapPin, 
  Sparkles,
  ShoppingBag
} from 'lucide-react';

export interface KpdnZone {
  id: string;
  name: string;
  states?: string[];
  supermarkets: string[];
  wetMarkets: string[];
}

export interface KpdnItem {
  id: string;
  name: string;
  unit: string;
  category: string;
  channel?: 'both' | 'wet_market' | 'supermarket';
  minPrice: number;
  avgPrice: number;
  maxPrice: number;
  supermarketPrice?: number;
  wetMarketPrice?: number;
  cheapestRetailers: string[];
  keywords: string[];
}

interface PriceEstimateResponse {
  metadata: {
    source: string;
    cadence: string;
    lastUpdated: string;
    disclaimer: string;
  };
  zones: KpdnZone[];
  activeZone: KpdnZone;
  matchedCount: number;
  estimatedCost: {
    min: number;
    avg: number;
    max: number;
    wetMarketTotal?: number;
    supermarketTotal?: number;
    formattedRange: string;
    averageFormatted: string;
    wetMarketFormatted?: string;
    supermarketFormatted?: string;
  };
  items: KpdnItem[];
}

interface PriceEstimateDisplayProps {
  ingredients: string[];
  servings?: string;
}

const STORAGE_KEY_ZONE = 'toma_price_zone';

const PriceEstimateDisplay: React.FC<PriceEstimateDisplayProps> = ({ ingredients, servings }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [priceData, setPriceData] = useState<PriceEstimateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedZone, setSelectedZone] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_ZONE) || 'national';
    } catch {
      return 'national';
    }
  });

  const [activeTab, setActiveTab] = useState<'all' | 'wetMarket' | 'supermarket'>('all');

  useEffect(() => {
    let isMounted = true;
    if (!ingredients || ingredients.length === 0) return;

    const fetchPrices = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/prices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ingredients, zone: selectedZone }),
        });
        if (!res.ok) throw new Error('Gagal memuatkan data harga');
        const data: PriceEstimateResponse = await res.json();
        if (isMounted) {
          setPriceData(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Ralat sambungan harga');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPrices();

    return () => {
      isMounted = false;
    };
  }, [ingredients, selectedZone]);

  const handleZoneChange = (newZoneId: string) => {
    setSelectedZone(newZoneId);
    try {
      localStorage.setItem(STORAGE_KEY_ZONE, newZoneId);
    } catch {
      // ignore localStorage quota error
    }
  };

  if (loading && !priceData) {
    return (
      <div className="mt-4 p-3 bg-emerald-50/40 rounded-xl border border-emerald-100/50 flex items-center justify-center gap-2 text-xs text-emerald-700 animate-pulse">
        <Tag className="w-4 h-4 animate-spin" />
        <span>Menyemak anggaran harga ruji KPDN & Pasar Awam...</span>
      </div>
    );
  }

  if (error || !priceData || priceData.matchedCount === 0) {
    return null;
  }

  // Parse servings count (e.g. "4 orang" -> 4)
  const numericServings = servings ? parseInt(servings.replace(/\D/g, ''), 10) : 0;
  const perServingAvg = numericServings > 0 && priceData.estimatedCost.avg > 0
    ? (priceData.estimatedCost.avg / numericServings).toFixed(2)
    : null;

  const currentZone = priceData.activeZone || {
    id: 'national',
    name: 'Purata Nasional',
    supermarkets: ['Econsave', 'Mydin', "Lotus's"],
    wetMarkets: ['Pasar Awam Tempatan', 'Pasar Basah']
  };

  return (
    <div className="mt-4 border-t border-gray-200/60 pt-4">
      {/* Collapsible Accordion Trigger Button */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.006 }}
        whileTap={{ scale: 0.994 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-3.5 sm:p-4 bg-gradient-to-r from-emerald-50/70 via-teal-50/50 to-emerald-50/70 hover:from-emerald-100/60 hover:to-teal-100/60 rounded-2xl border border-emerald-200/60 transition-all group shadow-sm text-left"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-2.5 bg-emerald-600 text-white rounded-xl shadow-sm group-hover:scale-105 transition-transform flex-shrink-0">
            <Tag className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm sm:text-base font-bold text-gray-800">
                Anggaran Kos Bahan
              </span>
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                KPDN PriceCatcher
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-emerald-800">{priceData.estimatedCost.formattedRange}</span>
              {perServingAvg && (
                <span className="text-gray-500 hidden sm:inline">
                  (~RM {perServingAvg} / porsi)
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-[11px] text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200/50">
                <MapPin className="w-2.5 h-2.5" />
                {currentZone.name.split('(')[0].trim()}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-medium text-emerald-700 hidden sm:inline">
            {isOpen ? 'Tutup' : `${priceData.matchedCount} bahan ruji`}
          </span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            className="p-1.5 rounded-full bg-white/80 text-emerald-700 shadow-sm border border-emerald-100"
          >
            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
          </motion.div>
        </div>
      </motion.button>

      {/* Accordion Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-3 p-4 sm:p-5 bg-white/70 backdrop-blur-md rounded-2xl border border-white/80 shadow-md ring-1 ring-black/5 space-y-4">
              
              {/* Zone / Location Selector Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900">
                  <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Pilih Lokasi / Zon Anda:</span>
                </div>
                <div className="relative">
                  <select
                    value={selectedZone}
                    onChange={(e) => handleZoneChange(e.target.value)}
                    className="w-full sm:w-auto text-xs font-medium bg-white text-gray-800 border border-emerald-200 rounded-lg px-3 py-1.5 pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm cursor-pointer appearance-none"
                  >
                    {priceData.zones?.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>

              {/* Regional Premise Badges (Supermarket vs Pasar Awam) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Pasar Awam Box */}
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70 space-y-1">
                  <div className="flex items-center justify-between font-bold text-amber-900">
                    <span className="flex items-center gap-1.5">
                      <span className="text-base">🥬</span> Pasar Awam / Basah
                    </span>
                    {priceData.estimatedCost.wetMarketFormatted && (
                      <span className="text-amber-800 font-extrabold text-sm">
                        ~{priceData.estimatedCost.wetMarketFormatted}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-amber-800/90 leading-tight">
                    Disyorkan untuk bahan segar (santan perah, ayam sembelih, ikan & ulam):
                  </p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {currentZone.wetMarkets.map((wm, idx) => (
                      <span key={idx} className="bg-white/90 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md text-[10px] font-semibold">
                        {wm}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Pasaraya Box */}
                <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-200/70 space-y-1">
                  <div className="flex items-center justify-between font-bold text-teal-900">
                    <span className="flex items-center gap-1.5">
                      <span className="text-base">🏪</span> Pasaraya / Hypermarket
                    </span>
                    {priceData.estimatedCost.supermarketFormatted && (
                      <span className="text-teal-800 font-extrabold text-sm">
                        ~{priceData.estimatedCost.supermarketFormatted}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-teal-800/90 leading-tight">
                    Disyorkan untuk barangan kering, telur, tepung & minyak masak:
                  </p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {currentZone.supermarkets.map((sm, idx) => (
                      <span key={idx} className="bg-white/90 text-teal-900 border border-teal-200 px-2 py-0.5 rounded-md text-[10px] font-semibold">
                        {sm}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Summary Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-center">
                  <span className="block text-[10px] uppercase font-bold tracking-wider text-gray-500">
                    Purata Anggaran
                  </span>
                  <span className="text-base sm:text-lg font-black text-emerald-700">
                    {priceData.estimatedCost.averageFormatted}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-100 text-center">
                  <span className="block text-[10px] uppercase font-bold tracking-wider text-gray-500">
                    Julat Anggaran
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-teal-800 truncate block">
                    {priceData.estimatedCost.formattedRange}
                  </span>
                </div>
                {perServingAvg && (
                  <div className="p-3 rounded-xl bg-cyan-50/70 border border-cyan-100 text-center col-span-2 sm:col-span-1">
                    <span className="block text-[10px] uppercase font-bold tracking-wider text-gray-500">
                      Anggaran Per Porsi
                    </span>
                    <span className="text-base sm:text-lg font-black text-cyan-800">
                      ~RM {perServingAvg}
                    </span>
                  </div>
                )}
              </div>

              {/* Matched Ingredients Breakdown */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ShoppingCart className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Pecahan Bahan Ruji ({priceData.matchedCount} Bahan)</span>
                  </span>
                  <span className="text-[10px] font-normal text-gray-400 lowercase">
                    data rujukan KPDN
                  </span>
                </h4>
                
                <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl bg-white/80 overflow-hidden text-xs sm:text-sm">
                  {priceData.items.map((item) => (
                    <div key={item.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-gray-50/80 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          <span className="font-semibold text-gray-800">{item.name}</span>
                          <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.2 rounded">
                            {item.unit}
                          </span>
                          {item.channel === 'wet_market' && (
                            <span className="text-[10px] font-medium bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                              🥬 Pasar Awam
                            </span>
                          )}
                          {item.channel === 'supermarket' && (
                            <span className="text-[10px] font-medium bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded">
                              🏪 Pasaraya
                            </span>
                          )}
                        </div>

                        {/* Recommendation hints */}
                        <div className="flex items-center gap-1.5 mt-1 ml-5 text-[11px] text-gray-500 flex-wrap">
                          <Store className="w-3 h-3 text-teal-600" />
                          <span>Pilihan peruncit:</span>
                          {item.channel === 'wet_market' ? (
                            <span className="text-amber-800 font-medium">
                              {currentZone.wetMarkets[0] || 'Pasar Basah Tempatan'}
                            </span>
                          ) : (
                            item.cheapestRetailers.slice(0, 3).map((retailer, idx) => (
                              <span key={idx} className="bg-gray-100 text-gray-700 px-1.5 py-0.2 rounded text-[10px] font-medium">
                                {retailer}
                              </span>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="sm:text-right ml-5 sm:ml-0 flex items-center sm:flex-col justify-between sm:justify-center">
                        <span className="font-bold text-emerald-700 sm:text-sm">
                          RM {item.avgPrice.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          (RM {item.minPrice.toFixed(2)} - RM {item.maxPrice.toFixed(2)})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Official Legal Disclaimer Notice */}
              <div className="p-3 bg-amber-50/80 border border-amber-200/70 rounded-xl flex items-start gap-2.5 text-[11px] text-amber-900 leading-relaxed shadow-sm">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-950 mb-0.5">Penafian Anggaran Kos:</p>
                  <p className="text-amber-800">
                    {priceData.metadata.disclaimer || 
                      'Data harga barangan dapur dipetik daripada inisiatif terbuka KPDN PriceCatcher (data.gov.my) sebagai panduan anggaran kos masakan sahaja. Harga sebenar di premis mungkin berbeza mengikut lokasi, gred, atau tawaran promosi semasa peruncit.'
                    }
                  </p>
                  <p className="mt-1 text-[10px] text-amber-700 font-medium">
                    Sumber: Terbuka data.gov.my (KPDN) • Dikemas kini suku tahunan • Tanpa sebarang caj.
                  </p>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PriceEstimateDisplay;
