import fs from 'fs';
import path from 'path';

async function processPremises() {
  console.log('Downloading lookup_premise.csv from storage.data.gov.my...');
  const res = await fetch('https://storage.data.gov.my/pricecatcher/lookup_premise.csv');
  const txt = await res.text();
  const lines = txt.split(/\r?\n/).slice(1);

  // Approximate representative coordinates for major Malaysian districts
  // so that GPS (lat, lon) can accurately snap to the closest district!
  const districtCoords = {
    // Perak
    "Perak::Kerian": { lat: 5.0167, lon: 100.5333, label: "Kerian (Bagan Serai & Parit Buntar)" },
    "Perak::Larut, Matang Dan Selama": { lat: 4.8500, lon: 100.7333, label: "Larut, Matang & Selama (Taiping)" },
    "Perak::Kinta": { lat: 4.5975, lon: 101.0901, label: "Kinta (Ipoh & Batu Gajah)" },
    "Perak::Manjung": { lat: 4.2167, lon: 100.6667, label: "Manjung (Sitiawan & Lumut)" },
    "Perak::Kuala Kangsar": { lat: 4.7667, lon: 100.9333, label: "Kuala Kangsar" },
    "Perak::Hilir Perak": { lat: 4.0167, lon: 101.0167, label: "Hilir Perak (Teluk Intan)" },
    "Perak::Batang Padang": { lat: 4.1833, lon: 101.2667, label: "Batang Padang (Tapah)" },
    "Perak::Muallim": { lat: 3.6833, lon: 101.5167, label: "Muallim (Tanjong Malim)" },
    "Perak::Perak Tengah": { lat: 4.3500, lon: 100.9667, label: "Perak Tengah (Seri Iskandar)" },
    "Perak::Kampar": { lat: 4.3000, lon: 101.1500, label: "Kampar" },
    "Perak::Hulu Perak": { lat: 5.4333, lon: 101.1333, label: "Hulu Perak (Gerik)" },
    "Perak::Bagan Datuk": { lat: 3.9833, lon: 100.7833, label: "Bagan Datuk" },

    // Terengganu
    "Terengganu::Kuala Terengganu": { lat: 5.3302, lon: 103.1408, label: "Kuala Terengganu" },
    "Terengganu::Kuala Nerus": { lat: 5.3900, lon: 103.0900, label: "Kuala Nerus (Gong Badak)" },
    "Terengganu::Kemaman": { lat: 4.2333, lon: 103.4167, label: "Kemaman (Chukai)" },
    "Terengganu::Dungun": { lat: 4.7667, lon: 103.4167, label: "Dungun" },
    "Terengganu::Besut": { lat: 5.7667, lon: 102.5500, label: "Besut (Jertih)" },
    "Terengganu::Marang": { lat: 5.2000, lon: 103.2000, label: "Marang" },
    "Terengganu::Hulu Terengganu": { lat: 5.0667, lon: 103.0167, label: "Hulu Terengganu (Kuala Berang)" },
    "Terengganu::Setiu": { lat: 5.5333, lon: 102.7333, label: "Setiu" },

    // Pulau Pinang
    "Pulau Pinang::Timur Laut": { lat: 5.4164, lon: 100.3327, label: "Timur Laut (Georgetown)" },
    "Pulau Pinang::Barat Daya": { lat: 5.3500, lon: 100.2333, label: "Barat Daya (Bayan Lepas)" },
    "Pulau Pinang::Seberang Perai Utara": { lat: 5.5000, lon: 100.4333, label: "Seberang Perai Utara (Butterworth)" },
    "Pulau Pinang::Seberang Perai Tengah": { lat: 5.3667, lon: 100.4500, label: "Seberang Perai Tengah (Bukit Mertajam)" },
    "Pulau Pinang::Seberang Perai Selatan": { lat: 5.2000, lon: 100.5000, label: "Seberang Perai Selatan (Nibong Tebal)" },

    // Kedah
    "Kedah::Kota Setar": { lat: 6.1167, lon: 100.3667, label: "Kota Setar (Alor Setar)" },
    "Kedah::Kuala Muda": { lat: 5.6500, lon: 100.5000, label: "Kuala Muda (Sungai Petani)" },
    "Kedah::Kulim": { lat: 5.3667, lon: 100.5500, label: "Kulim" },
    "Kedah::Kubang Pasu": { lat: 6.3000, lon: 100.4167, label: "Kubang Pasu (Jitra)" },
    "Kedah::Langkawi": { lat: 6.3500, lon: 99.8000, label: "Langkawi" },

    // Selangor
    "Selangor::Petaling": { lat: 3.0738, lon: 101.5183, label: "Petaling (Shah Alam, PJ, Subang)" },
    "Selangor::Hulu Langat": { lat: 2.9927, lon: 101.7909, label: "Hulu Langat (Kajang, Bangi, Ampang)" },
    "Selangor::Klang": { lat: 3.0438, lon: 101.4497, label: "Klang" },
    "Selangor::Gombak": { lat: 3.2500, lon: 101.6500, label: "Gombak (Selayang, Rawang)" },
    "Selangor::Sepang": { lat: 2.8167, lon: 101.6833, label: "Sepang (Cyberjaya, KLIA)" },
    "Selangor::Kuala Langat": { lat: 2.8167, lon: 101.5000, label: "Kuala Langat (Banting)" },
    "Selangor::Kuala Selangor": { lat: 3.3500, lon: 101.2500, label: "Kuala Selangor" },
    "Selangor::Hulu Selangor": { lat: 3.5500, lon: 101.6500, label: "Hulu Selangor (Kuala Kubu Bharu)" },
    "Selangor::Sabak Bernam": { lat: 3.7667, lon: 100.9833, label: "Sabak Bernam" },

    // W.P. Kuala Lumpur & Putrajaya
    "W.P. Kuala Lumpur::W.P. Kuala Lumpur": { lat: 3.1390, lon: 101.6869, label: "Kuala Lumpur" },
    "W.P. Putrajaya::W.P. Putrajaya": { lat: 2.9264, lon: 101.6964, label: "Putrajaya" },

    // Johor
    "Johor::Johor Bahru": { lat: 1.4927, lon: 103.7414, label: "Johor Bahru" },
    "Johor::Batu Pahat": { lat: 1.8548, lon: 102.9325, label: "Batu Pahat" },
    "Johor::Muar": { lat: 2.0442, lon: 102.5689, label: "Muar" },
    "Johor::Kluang": { lat: 2.0251, lon: 103.3328, label: "Kluang" },
    "Johor::Kulai": { lat: 1.6561, lon: 103.6032, label: "Kulai" },

    // Melaka
    "Melaka::Melaka Tengah": { lat: 2.2000, lon: 102.2500, label: "Melaka Tengah" },
    "Melaka::Alor Gajah": { lat: 2.3833, lon: 102.2000, label: "Alor Gajah" },

    // Negeri Sembilan
    "Negeri Sembilan::Seremban": { lat: 2.7297, lon: 101.9381, label: "Seremban" },
    "Negeri Sembilan::Port Dickson": { lat: 2.5333, lon: 101.8000, label: "Port Dickson" },

    // Pahang
    "Pahang::Kuantan": { lat: 3.8077, lon: 103.3260, label: "Kuantan" },
    "Pahang::Temerloh": { lat: 3.4500, lon: 102.4167, label: "Temerloh" },

    // Kelantan
    "Kelantan::Kota Bharu": { lat: 6.1254, lon: 102.2386, label: "Kota Bharu" },
    "Kelantan::Pasir Mas": { lat: 6.0417, lon: 102.1417, label: "Pasir Mas" },

    // Perlis
    "Perlis::Perlis": { lat: 6.4414, lon: 100.1986, label: "Kangar (Perlis)" },

    // Sabah
    "Sabah::Kota Kinabalu": { lat: 5.9804, lon: 116.0735, label: "Kota Kinabalu" },
    "Sabah::Sandakan": { lat: 5.8402, lon: 118.1179, label: "Sandakan" },

    // Sarawak
    "Sarawak::Kuching": { lat: 1.5533, lon: 110.3592, label: "Kuching" },
    "Sarawak::Miri": { lat: 4.4148, lon: 114.0089, label: "Miri" }
  };

  const parsedDistricts = {};

  for (const line of lines) {
    if (!line.trim()) continue;
    // CSV parser handling commas inside quotes
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
    const premiseType = cols[3];
    const state = cols[4];
    const district = cols[5];

    if (!state || !district || state === 'Unknown State') continue;
    const key = `${state}::${district}`;

    if (!parsedDistricts[key]) {
      const coordInfo = districtCoords[key] || {
        lat: 3.1390,
        lon: 101.6869,
        label: `${district}, ${state}`
      };

      parsedDistricts[key] = {
        id: key.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        key,
        state,
        district,
        label: coordInfo.label || `${district}, ${state}`,
        lat: coordInfo.lat,
        lon: coordInfo.lon,
        wetMarkets: [],
        supermarkets: []
      };
    }

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
      pNameLower.includes('lotus') || 
      pNameLower.includes('mydin') || 
      pNameLower.includes('econsave') || 
      pNameLower.includes('tf value') || 
      pNameLower.includes('sabasun') ||
      pNameLower.includes('giant') ||
      pNameLower.includes('billion');

    if (isWetMarket && !parsedDistricts[key].wetMarkets.includes(premise)) {
      if (parsedDistricts[key].wetMarkets.length < 6) {
        parsedDistricts[key].wetMarkets.push(premise);
      }
    } else if (isSupermarket && !parsedDistricts[key].supermarkets.includes(premise)) {
      if (parsedDistricts[key].supermarkets.length < 6) {
        parsedDistricts[key].supermarkets.push(premise);
      }
    }
  }

  // Filter out empty or fill fallbacks
  const districtList = Object.values(parsedDistricts).map(d => {
    if (d.wetMarkets.length === 0) {
      d.wetMarkets = [`Pasar Awam ${d.district}`, `Pasar Basah Tempatan`];
    }
    if (d.supermarkets.length === 0) {
      d.supermarkets = [`Pasaraya Tempatan (${d.district})`, `Econsave`, `Mydin`];
    }
    return d;
  });

  console.log(`Generated ${districtList.length} districts.`);
  const kerian = districtList.find(d => d.district === 'Kerian');
  console.log('Kerian (Bagan Serai):', JSON.stringify(kerian, null, 2));

  // Save to data/kpdn_districts.json
  const outPath = path.resolve('data', 'kpdn_districts.json');
  fs.writeFileSync(outPath, JSON.stringify(districtList, null, 2));
  console.log('Saved districts to', outPath, `(${fs.statSync(outPath).size} bytes)`);
}

processPremises();
