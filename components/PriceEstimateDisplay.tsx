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
  Navigation,
  RefreshCw
} from 'lucide-react';

export interface KpdnDistrictSummary {
  id: string;
  state: string;
  district: string;
  label: string;
}

export interface KpdnActiveDistrict {
  id: string;
  key: string;
  state: string;
  district: string;
  label: string;
  lat: number;
  lon: number;
  wetMarkets: string[];
  supermarkets: string[];
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
  districts: KpdnDistrictSummary[];
  activeDistrict: KpdnActiveDistrict;
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

const STORAGE_KEY_DISTRICT = 'toma_price_district_id';
const STORAGE_KEY_COORDS = 'toma_price_user_coords';

const PriceEstimateDisplay: React.FC<PriceEstimateDisplayProps> = ({ ingredients, servings }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [priceData, setPriceData] = useState<PriceEstimateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);

  // Read saved district id or coords
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_DISTRICT) || 'perak-kerian';
    } catch {
      return 'perak-kerian';
    }
  });

  const [selectedState, setSelectedState] = useState<string>('Perak');

  const fetchPrices = async (params: { districtId?: string; lat?: number; lon?: number }) => {
    if (!ingredients || ingredients.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients,
          districtId: params.districtId,
          lat: params.lat,
          lon: params.lon,
        }),
      });
      if (!res.ok) throw new Error('Gagal memuatkan data harga');
      const data: PriceEstimateResponse = await res.json();
      setPriceData(data);
      if (data.activeDistrict) {
        setSelectedDistrictId(data.activeDistrict.id);
        setSelectedState(data.activeDistrict.state);
        try {
          localStorage.setItem(STORAGE_KEY_DISTRICT, data.activeDistrict.id);
        } catch {
          // ignore
        }
      }
    } catch (err: any) {
      setError(err.message || 'Ralat sambungan harga');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch based on saved district id or fallback
    fetchPrices({ districtId: selectedDistrictId });
  }, [ingredients]);

  // Handle GPS Auto-Detect
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationNotice('Pelayar anda tidak menyokong fungsi GPS.');
      return;
    }

    setLocating(true);
    setLocationNotice('Sedang mengesan lokasi GPS anda...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          localStorage.setItem(STORAGE_KEY_COORDS, JSON.stringify({ lat: latitude, lon: longitude }));
        } catch {
          // ignore
        }
        await fetchPrices({ lat: latitude, lon: longitude });
        setLocating(false);
        setLocationNotice('Lokasi setempat berjaya dikesan melalui GPS!');
        setTimeout(() => setLocationNotice(null), 4000);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setLocating(false);
        setLocationNotice('Izin lokasi ditolak atau tidak dapat dikesan. Sila pilih daerah secara manual.');
        setTimeout(() => setLocationNotice(null), 5000);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleStateChange = (newState: string) => {
    setSelectedState(newState);
    // Find first district in that state
    const firstDistrict = priceData?.districts?.find(d => d.state === newState);
    if (firstDistrict) {
      setSelectedDistrictId(firstDistrict.id);
      fetchPrices({ districtId: firstDistrict.id });
    }
  };

  const handleDistrictChange = (newDistrictId: string) => {
    setSelectedDistrictId(newDistrictId);
    fetchPrices({ districtId: newDistrictId });
  };

  if (loading && !priceData) {
    return (
      <div className="mt-4 p-3 bg-emerald-50/40 rounded-xl border border-emerald-100/50 flex items-center justify-center gap-2 text-xs text-emerald-700 animate-pulse">
        <Tag className="w-4 h-4 animate-spin" />
        <span>Menyemak harga pasaran premis setempat anda...</span>
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

  const activeDistrict = priceData.activeDistrict || {
    label: 'Kerian (Bagan Serai & Parit Buntar)',
    state: 'Perak',
    district: 'Kerian',
    wetMarkets: ['PASAR AWAM BAGAN SERAI', 'PASAR AWAM PARIT BUNTAR'],
    supermarkets: ['SEGI CASH & CARRY BAGAN SERAI', 'ECONSAVE PARIT BUNTAR']
  };

  // Group districts for state selector
  const availableStates = Array.from(new Set(priceData.districts?.map(d => d.state) || [])).sort();
  const districtsInCurrentState = priceData.districts?.filter(d => d.state === selectedState) || [];

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
              <span className="inline-flex items-center gap-1 text-[11px] text-teal-800 bg-teal-50/90 font-medium px-2 py-0.5 rounded-md border border-teal-200/60">
                <MapPin className="w-3 h-3 text-emerald-600" />
                {activeDistrict.label || `${activeDistrict.district}, ${activeDistrict.state}`}
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
            <div className="mt-3 p-4 sm:p-5 bg-white/75 backdrop-blur-md rounded-2xl border border-white/80 shadow-md ring-1 ring-black/5 space-y-4">
              
              {/* Location Detection & District Picker Bar */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50/80 to-teal-50/60 border border-emerald-100 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                    <span className="text-xs font-bold text-gray-800">
                      Lokasi Semasa: <span className="text-emerald-700">{activeDistrict.label}</span>
                    </span>
                  </div>

                  {/* GPS Auto-detect Button */}
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={locating}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Navigation className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
                    <span>{locating ? 'Mengesan GPS...' : 'Kesan Lokasi Saya (GPS)'}</span>
                  </button>
                </div>

                {locationNotice && (
                  <p className="text-[11px] text-emerald-800 bg-emerald-100/70 p-1.5 rounded-md">
                    {locationNotice}
                  </p>
                )}

                {/* State & District Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-emerald-200/40 text-xs">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">
                      Negeri
                    </label>
                    <select
                      value={selectedState}
                      onChange={(e) => handleStateChange(e.target.value)}
                      className="w-full bg-white text-gray-800 border border-emerald-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {availableStates.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">
                      Daerah / Kawasan ({districtsInCurrentState.length} daerah)
                    </label>
                    <select
                      value={selectedDistrictId}
                      onChange={(e) => handleDistrictChange(e.target.value)}
                      className="w-full bg-white text-gray-800 border border-emerald-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {districtsInCurrentState.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.label || d.district}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Local Wet Markets vs Local Supermarkets in the Active District */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Local Pasar Awam */}
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/70 space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-amber-950">
                    <span className="flex items-center gap-1.5">
                      <span className="text-base">🥬</span> Pasar Awam / Basah Setempat
                    </span>
                    {priceData.estimatedCost.wetMarketFormatted && (
                      <span className="text-amber-900 font-black text-sm">
                        ~{priceData.estimatedCost.wetMarketFormatted}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-amber-800 leading-tight">
                    Premis rasmi KPDN untuk bahan segar di <strong>{activeDistrict.district}</strong>:
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {activeDistrict.wetMarkets && activeDistrict.wetMarkets.length > 0 ? (
                      activeDistrict.wetMarkets.map((wm, idx) => (
                        <span key={idx} className="bg-white/95 text-amber-950 border border-amber-200 px-2 py-0.5 rounded-md text-[10px] font-bold shadow-2xs">
                          {wm}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-gray-500">Pasar Awam {activeDistrict.district}</span>
                    )}
                  </div>
                </div>

                {/* Local Supermarkets */}
                <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200/70 space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-teal-950">
                    <span className="flex items-center gap-1.5">
                      <span className="text-base">🏪</span> Pasaraya / Runcit Setempat
                    </span>
                    {priceData.estimatedCost.supermarketFormatted && (
                      <span className="text-teal-900 font-black text-sm">
                        ~{priceData.estimatedCost.supermarketFormatted}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-teal-800 leading-tight">
                    Premis pasaraya & borong rasmi KPDN di <strong>{activeDistrict.district}</strong>:
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {activeDistrict.supermarkets && activeDistrict.supermarkets.length > 0 ? (
                      activeDistrict.supermarkets.map((sm, idx) => (
                        <span key={idx} className="bg-white/95 text-teal-950 border border-teal-200 px-2 py-0.5 rounded-md text-[10px] font-bold shadow-2xs">
                          {sm}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-gray-500">Pasaraya {activeDistrict.district}</span>
                    )}
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
                  <span className="text-[10px] font-normal text-gray-400">
                    KPDN PriceCatcher ({activeDistrict.district})
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

                        {/* Localized recommendation hint */}
                        <div className="flex items-center gap-1.5 mt-1 ml-5 text-[11px] text-gray-500 flex-wrap">
                          <Store className="w-3 h-3 text-teal-600" />
                          <span>Pilihan setempat:</span>
                          {item.channel === 'wet_market' ? (
                            <span className="text-amber-900 font-semibold">
                              {activeDistrict.wetMarkets?.[0] || 'Pasar Basah Tempatan'}
                            </span>
                          ) : (
                            <span className="text-teal-900 font-semibold">
                              {activeDistrict.supermarkets?.[0] || 'Pasaraya Tempatan'}
                            </span>
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
                  <p className="font-semibold text-amber-950 mb-0.5">Penafian Anggaran Kos Setempat:</p>
                  <p className="text-amber-800">
                    {priceData.metadata.disclaimer || 
                      'Data harga barangan dapur dipetik daripada inisiatif terbuka KPDN PriceCatcher (data.gov.my) sebagai panduan anggaran kos masakan sahaja. Harga sebenar di premis mungkin berbeza mengikut lokasi, gred, atau tawaran promosi semasa peruncit.'
                    }
                  </p>
                  <p className="mt-1 text-[10px] text-amber-700 font-medium">
                    Sumber: Terbuka data.gov.my (KPDN) • Dilokasikan untuk daerah {activeDistrict.district}, {activeDistrict.state}.
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
