import fs from 'fs';
import path from 'path';

async function processPremises() {
  console.log('Downloading lookup_premise.csv from storage.data.gov.my...');
  const res = await fetch('https://storage.data.gov.my/pricecatcher/lookup_premise.csv');
  const txt = await res.text();
  const lines = txt.split(/\r?\n/).slice(1);

  // Approximate coordinates for major towns/districts
  const baseCoords = {
    // Perak
    "Perak::TANJUNG RAMBUTAN": { lat: 4.6700, lon: 101.1550 },
    "Perak::SUNGAI SIPUT": { lat: 4.8167, lon: 101.0667 },
    "Perak::BAGAN SERAI": { lat: 5.0108, lon: 100.5408 },
    "Perak::PARIT BUNTAR": { lat: 5.1278, lon: 100.4897 },
    "Perak::KUALA KURAU": { lat: 5.0167, lon: 100.4333 },
    "Perak::TAIPING": { lat: 4.8500, lon: 100.7333 },
    "Perak::IPOH": { lat: 4.5975, lon: 101.0901 },
    "Perak::BATU GAJAH": { lat: 4.4692, lon: 101.0411 },
    "Perak::KAMPAR": { lat: 4.3000, lon: 101.1500 },
    "Perak::TAPAH": { lat: 4.1833, lon: 101.2667 },
    "Perak::BIDOR": { lat: 4.1167, lon: 101.2833 },
    "Perak::TELUK INTAN": { lat: 4.0167, lon: 101.0167 },
    "Perak::KUALA KANGSAR": { lat: 4.7667, lon: 100.9333 },
    "Perak::SITIAWAN": { lat: 4.2167, lon: 100.7000 },
    "Perak::LUMUT": { lat: 4.2333, lon: 100.6333 },
    "Perak::SERI ISKANDAR": { lat: 4.3500, lon: 100.9667 },
    "Perak::TANJONG MALIM": { lat: 3.6833, lon: 101.5167 },
    "Perak::GERIK": { lat: 5.4333, lon: 101.1333 },

    // Terengganu
    "Terengganu::KUALA TERENGGANU": { lat: 5.3302, lon: 103.1408 },
    "Terengganu::GONG BADAK": { lat: 5.3900, lon: 103.0900 },
    "Terengganu::CHUKAI": { lat: 4.2333, lon: 103.4167 },
    "Terengganu::DUNGUN": { lat: 4.7667, lon: 103.4167 },
    "Terengganu::JERTIH": { lat: 5.7667, lon: 102.5500 },
    "Terengganu::MARANG": { lat: 5.2000, lon: 103.2000 }
  };

  const townMap = new Map();
  const districtFallbacks = new Map();

  for (const line of lines) {
    if (!line.trim()) continue;
    const regex = /(?:^|,)(\"(?:[^\"]+|\"\")*\"|[^,]*)/g;
    const cols = [];
    let match;
    while ((match = regex.exec(line)) !== null) {
      let col = match[1].trim();
      if (col.startsWith('"') && col.endsWith('"')) {
        col = col.substring(1, col.length - 1).replace(/""/g, '"').trim();
      }
      cols.push(col);
      if (regex.lastIndex >= line.length) break;
    }

    if (cols.length < 6) continue;
    const premise = cols[1];
    const address = cols[2];
    const premiseType = cols[3];
    const state = cols[4];
    const district = cols[5];

    if (!state || !district || state === 'Unknown State') continue;

    const pTypeLower = premiseType.toLowerCase();
    const pNameLower = premise.toLowerCase();

    const isWetMarket = pTypeLower.includes('pasar basah') || 
      pTypeLower.includes('pasar awam') || 
      pNameLower.includes('pasar awam') || 
      pNameLower.includes('pasar basah') || 
      pNameLower.includes('pasar besar');

    const isSupermarket = pTypeLower.includes('supermarket') || 
      pTypeLower.includes('hypermarket') || 
      pTypeLower.includes('pasar raya') || 
      pTypeLower.includes('pasar mini') ||
      pNameLower.includes('lotus') || 
      pNameLower.includes('mydin') || 
      pNameLower.includes('econsave') || 
      pNameLower.includes('tf value') || 
      pNameLower.includes('sabasun') ||
      pNameLower.includes('giant') ||
      pNameLower.includes('billion') ||
      pNameLower.includes('segi') ||
      pNameLower.includes('mart');

    // Extract town from postcode
    const m = address.match(/\b\d{5}\s+([A-Za-z\s\.\(\)\/]+?)(?:,|$|\.|\n)/);
    let town = '';
    if (m) {
      town = m[1]
        .replace(/PERAK|SELANGOR|JOHOR|KEDAH|PAHANG|KELANTAN|TERENGGANU|MELAKA|SABAH|SARAWAK|PULAU PINANG|NEGERI SEMBILAN|PERLIS|W\.?P\.?\s*KUALA LUMPUR/gi, '')
        .replace(/DARUL\s+[A-Z]+/gi, '')
        .replace(/BANDARAYA|BANDAR DIRAJA|BANDAR/gi, '')
        .replace(/[\(\)\.\/]/g, '')
        .replace(/\bU\b/g, '')
        .trim();
    }

    // Direct town overrides for notable places
    const pUpper = (premise + ' ' + address).toUpperCase();
    if (pUpper.includes('TANJUNG RAMBUTAN') || pUpper.includes('TG RAMBUTAN') || pUpper.includes('TG. RAMBUTAN')) town = 'TANJUNG RAMBUTAN';
    else if (pUpper.includes('SUNGAI SIPUT') || pUpper.includes('SG SIPUT') || pUpper.includes('SG. SIPUT')) town = 'SUNGAI SIPUT';
    else if (pUpper.includes('BAGAN SERAI')) town = 'BAGAN SERAI';
    else if (pUpper.includes('PARIT BUNTAR')) town = 'PARIT BUNTAR';
    else if (pUpper.includes('KUALA KURAU')) town = 'KUALA KURAU';

    // If town still empty, fallback to district name
    if (!town || town.length < 3) {
      town = district.toUpperCase();
    }

    const cleanTown = town.toUpperCase().replace(/\s+/g, ' ').trim();
    const townKey = `${state}::${cleanTown}`;

    if (!townMap.has(townKey)) {
      const coord = baseCoords[townKey] || { lat: 4.5, lon: 101.0 };
      townMap.set(townKey, {
        id: `${state}-${cleanTown}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        key: townKey,
        town: cleanTown,
        district: district,
        state: state,
        label: `${cleanTown}, ${district} (${state})`,
        lat: coord.lat,
        lon: coord.lon,
        wetMarkets: [],
        supermarkets: []
      });
    }

    const entry = townMap.get(townKey);
    if (isWetMarket && !entry.wetMarkets.includes(premise) && entry.wetMarkets.length < 6) {
      entry.wetMarkets.push(premise);
    } else if (isSupermarket && !entry.supermarkets.includes(premise) && entry.supermarkets.length < 6) {
      entry.supermarkets.push(premise);
    }

    // Also build district fallback
    const distKey = `${state}::${district}`;
    if (!districtFallbacks.has(distKey)) {
      districtFallbacks.set(distKey, { wetMarkets: [], supermarkets: [] });
    }
    const distEntry = districtFallbacks.get(distKey);
    if (isWetMarket && !distEntry.wetMarkets.includes(premise) && distEntry.wetMarkets.length < 6) {
      distEntry.wetMarkets.push(premise);
    }
    if (isSupermarket && !distEntry.supermarkets.includes(premise) && distEntry.supermarkets.length < 6) {
      distEntry.supermarkets.push(premise);
    }
  }

  // Final town list with smart fallbacks
  const towns = Array.from(townMap.values()).map(t => {
    const distFallback = districtFallbacks.get(`${t.state}::${t.district}`) || { wetMarkets: [], supermarkets: [] };
    if (t.wetMarkets.length === 0) {
      t.wetMarkets = distFallback.wetMarkets.length > 0 
        ? distFallback.wetMarkets 
        : [`Pasar Awam ${t.town}`, `Pasar Basah ${t.district}`];
    }
    if (t.supermarkets.length === 0) {
      t.supermarkets = distFallback.supermarkets.length > 0 
        ? distFallback.supermarkets 
        : [`Pasaraya ${t.town}`, 'Econsave', 'Mydin'];
    }
    return t;
  });

  // Sort alphabetically by state, then town
  towns.sort((a, b) => a.state.localeCompare(b.state) || a.town.localeCompare(b.town));

  console.log(`Generated ${towns.length} towns and localities.`);

  const tjRambutan = towns.find(t => t.town.includes('RAMBUTAN'));
  console.log('Tanjung Rambutan:', JSON.stringify(tjRambutan, null, 2));

  const sgSiput = towns.find(t => t.town.includes('SUNGAI SIPUT'));
  console.log('Sungai Siput:', JSON.stringify(sgSiput, null, 2));

  const baganSerai = towns.find(t => t.town === 'BAGAN SERAI');
  console.log('Bagan Serai:', JSON.stringify(baganSerai, null, 2));

  const outPath = path.resolve('data', 'kpdn_districts.json');
  fs.writeFileSync(outPath, JSON.stringify(towns, null, 2));
  console.log('Saved to', outPath, `(${fs.statSync(outPath).size} bytes)`);
}

processPremises();
