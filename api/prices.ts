import path from 'path';
import fs from 'fs';

const dirName = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

export interface KpdnDistrict {
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

interface PriceDataPayload {
  metadata: {
    source: string;
    cadence: string;
    lastUpdated: string;
    disclaimer: string;
  };
  zones: any[];
  items: KpdnItem[];
}

function loadPricesData(): PriceDataPayload | null {
  try {
    const candidates = [
      path.resolve(process.cwd(), 'data', 'kpdn_prices.json'),
      path.resolve(dirName, 'data', 'kpdn_prices.json'),
      path.resolve(dirName, '..', 'data', 'kpdn_prices.json'),
      path.resolve(dirName, '..', '..', 'data', 'kpdn_prices.json'),
    ];

    for (const p of candidates) {
      if (fs.existsSync(p)) {
        return JSON.parse(fs.readFileSync(p, 'utf-8'));
      }
    }
  } catch (err) {
    console.error('Error loading kpdn_prices.json:', err);
  }
  return null;
}

function loadDistrictsData(): KpdnDistrict[] {
  try {
    const candidates = [
      path.resolve(process.cwd(), 'data', 'kpdn_districts.json'),
      path.resolve(dirName, 'data', 'kpdn_districts.json'),
      path.resolve(dirName, '..', 'data', 'kpdn_districts.json'),
      path.resolve(dirName, '..', '..', 'data', 'kpdn_districts.json'),
    ];

    for (const p of candidates) {
      if (fs.existsSync(p)) {
        return JSON.parse(fs.readFileSync(p, 'utf-8'));
      }
    }
  } catch (err) {
    console.error('Error loading kpdn_districts.json:', err);
  }
  return [];
}

function findNearestDistrict(lat: number, lon: number, districts: KpdnDistrict[]): KpdnDistrict | null {
  let closest: KpdnDistrict | null = null;
  let minDist = Infinity;
  for (const d of districts) {
    if (typeof d.lat === 'number' && typeof d.lon === 'number') {
      const dLat = d.lat - lat;
      const dLon = d.lon - lon;
      const dist = dLat * dLat + dLon * dLon;
      if (dist < minDist) {
        minDist = dist;
        closest = d;
      }
    }
  }
  return closest;
}

export default async function handler(req: any, res: any) {
  const data = loadPricesData();
  if (!data) {
    return res.status(500).json({ error: 'Gagal memuatkan data harga KPDN.' });
  }

  const districts = loadDistrictsData();

  // Resolve active district:
  // 1. By GPS latitude & longitude
  // 2. By districtId
  // 3. Fallback to Kerian (Bagan Serai & Parit Buntar) or default
  const reqLat = parseFloat(req.body?.lat || req.query?.lat);
  const reqLon = parseFloat(req.body?.lon || req.query?.lon);
  const reqDistrictId = req.body?.districtId || req.query?.districtId;

  let activeDistrict: KpdnDistrict | null = null;

  if (!isNaN(reqLat) && !isNaN(reqLon) && districts.length > 0) {
    activeDistrict = findNearestDistrict(reqLat, reqLon, districts);
  } else if (reqDistrictId && districts.length > 0) {
    activeDistrict = districts.find(d => d.id === reqDistrictId) || null;
  }

  if (!activeDistrict && districts.length > 0) {
    // Default to Kerian (Bagan Serai) or first district
    activeDistrict = districts.find(d => d.id === 'perak-kerian') || districts[0];
  }

  // District list summary for client dropdown selector
  const districtSummaries = districts.map(d => ({
    id: d.id,
    state: d.state,
    district: d.district,
    label: d.label
  }));

  // If request contains ingredients list from recipe
  const ingredients: string[] = req.body?.ingredients || [];
  const queryStr: string = (req.body?.query || req.query?.q || '').toLowerCase();

  if (queryStr) {
    const matched = data.items.filter(item => 
      item.name.toLowerCase().includes(queryStr) || 
      item.keywords.some(kw => queryStr.includes(kw) || kw.includes(queryStr))
    );
    return res.status(200).json({
      metadata: data.metadata,
      districts: districtSummaries,
      activeDistrict,
      items: matched,
    });
  }

  if (Array.isArray(ingredients) && ingredients.length > 0) {
    const matchedItems: KpdnItem[] = [];
    const usedIds = new Set<string>();

    for (const rawIng of ingredients) {
      const lower = rawIng.toLowerCase();
      // Match against keywords
      const found = data.items.find(item => 
        !usedIds.has(item.id) &&
        item.keywords.some(kw => lower.includes(kw))
      );

      if (found) {
        usedIds.add(found.id);
        matchedItems.push(found);
      }
    }

    const totalMin = Math.round(matchedItems.reduce((acc, it) => acc + it.minPrice, 0) * 100) / 100;
    const totalAvg = Math.round(matchedItems.reduce((acc, it) => acc + it.avgPrice, 0) * 100) / 100;
    const totalMax = Math.round(matchedItems.reduce((acc, it) => acc + it.maxPrice, 0) * 100) / 100;
    const wetMarketTotal = Math.round(matchedItems.reduce((acc, it) => acc + (it.wetMarketPrice || it.avgPrice), 0) * 100) / 100;
    const supermarketTotal = Math.round(matchedItems.reduce((acc, it) => acc + (it.supermarketPrice || it.avgPrice), 0) * 100) / 100;

    return res.status(200).json({
      metadata: data.metadata,
      districts: districtSummaries,
      activeDistrict,
      matchedCount: matchedItems.length,
      estimatedCost: {
        min: totalMin,
        avg: totalAvg,
        max: totalMax,
        wetMarketTotal,
        supermarketTotal,
        formattedRange: `RM ${totalMin.toFixed(2)} - RM ${totalMax.toFixed(2)}`,
        averageFormatted: `RM ${totalAvg.toFixed(2)}`,
        wetMarketFormatted: `RM ${wetMarketTotal.toFixed(2)}`,
        supermarketFormatted: `RM ${supermarketTotal.toFixed(2)}`
      },
      items: matchedItems
    });
  }

  // Default: return all curated staples
  return res.status(200).json({
    ...data,
    districts: districtSummaries,
    activeDistrict
  });
}
