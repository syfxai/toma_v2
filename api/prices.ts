import path from 'path';
import fs from 'fs';

const dirName = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

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

interface PriceDataPayload {
  metadata: {
    source: string;
    cadence: string;
    lastUpdated: string;
    disclaimer: string;
  };
  zones: KpdnZone[];
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

export default async function handler(req: any, res: any) {
  const data = loadPricesData();
  if (!data) {
    return res.status(500).json({ error: 'Gagal memuatkan data harga KPDN.' });
  }

  const requestedZoneId: string = req.body?.zone || req.query?.zone || 'national';
  const activeZone = data.zones?.find(z => z.id === requestedZoneId) || data.zones?.[0] || {
    id: 'national',
    name: 'Purata Nasional (Semua Zon)',
    supermarkets: ['Econsave', 'Mydin', "Lotus's"],
    wetMarkets: ['Pasar Awam Tempatan', 'Pasar Basah']
  };

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
      zones: data.zones,
      activeZone,
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
      zones: data.zones,
      activeZone,
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
    activeZone
  });
}
