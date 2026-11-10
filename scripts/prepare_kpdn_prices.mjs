import fs from 'fs';
import path from 'path';

async function generateCuratedGroceryPrices() {
  const zones = [
    {
      id: "national",
      name: "Purata Nasional (Semua Zon)",
      supermarkets: ["Econsave", "Mydin", "Lotus's"],
      wetMarkets: ["Pasar Awam Tempatan", "Pasar Basah", "Pasar Tani"]
    },
    {
      id: "timur",
      name: "Pantai Timur (Terengganu, Kelantan, Pahang)",
      states: ["Terengganu", "Kelantan", "Pahang"],
      supermarkets: ["Sabasun HyperRuncit", "Mydin", "Tunas Manja (TMG)"],
      wetMarkets: ["Pasar Besar Kedai Payang (KT)", "Pasar Chabang Tiga", "Pasar Siti Khadijah (KB)", "Pasar Besar Kuantan"]
    },
    {
      id: "utara",
      name: "Zon Utara (Perak/Bagan Serai, Kedah, P.Pinang, Perlis)",
      states: ["Perak", "Kedah", "Pulau Pinang", "Perlis"],
      supermarkets: ["TF Value-Mart", "Econsave", "C-Mart", "Mydin"],
      wetMarkets: ["Pasar Awam Bagan Serai", "Pasar Parit Buntar", "Pasar Besar Alor Setar", "Pasar Chowrasta"]
    },
    {
      id: "tengah",
      name: "Zon Tengah (Selangor, KL, Putrajaya)",
      states: ["Selangor", "Kuala Lumpur", "Putrajaya"],
      supermarkets: ["NSK Trade City", "Lotus's", "Econsave", "Giant", "Segi Fresh"],
      wetMarkets: ["Pasar Chow Kit", "Pasar Borong Selayang", "Pasar Seksyen 16 Shah Alam", "Pasar Pudu"]
    },
    {
      id: "selatan",
      name: "Zon Selatan (Johor, Melaka, N.Sembilan)",
      states: ["Johor", "Melaka", "Negeri Sembilan"],
      supermarkets: ["Maslee", "Econsave", "Lotus's", "Target Supermarket"],
      wetMarkets: ["Pasar Awam Larkin", "Pasar Besar Melaka Sentral", "Pasar Besar Seremban"]
    },
    {
      id: "borneo",
      name: "Sabah & Sarawak",
      states: ["Sabah", "Sarawak", "Labuan"],
      supermarkets: ["Bataras", "Servay", "Everrise", "Emart"],
      wetMarkets: ["Pasar Besar Kota Kinabalu", "Pasar Tamu Donggongon", "Pasar Medan Niaga Satok"]
    }
  ];

  const staples = [
    {
      id: "ayam-standard",
      name: "Ayam Bersih (Standard)",
      unit: "1 kg",
      category: "Ayam",
      channel: "both",
      minPrice: 8.50,
      avgPrice: 9.40,
      maxPrice: 10.50,
      supermarketPrice: 9.20,
      wetMarketPrice: 9.80,
      cheapestRetailers: ["Econsave", "Mydin", "Lotus's"],
      keywords: ["ayam", "chicken", "daging ayam", "seekor ayam"]
    },
    {
      id: "ayam-super",
      name: "Ayam Bersih (Super)",
      unit: "1 kg",
      category: "Ayam",
      channel: "both",
      minPrice: 9.50,
      avgPrice: 10.40,
      maxPrice: 11.50,
      supermarketPrice: 10.20,
      wetMarketPrice: 10.80,
      cheapestRetailers: ["Mydin", "Giant", "Pasar Basah"],
      keywords: ["ayam super", "isi ayam", "peha ayam"]
    },
    {
      id: "daging-lembu-tempatan",
      name: "Daging Lembu Tempatan (Segar)",
      unit: "1 kg",
      category: "Daging",
      channel: "wet_market",
      minPrice: 38.00,
      avgPrice: 42.00,
      maxPrice: 45.00,
      supermarketPrice: 43.00,
      wetMarketPrice: 41.50,
      cheapestRetailers: ["Pasar Awam", "Pasar Borong", "Mydin"],
      keywords: ["daging", "beef", "daging lembu", "daging cincang"]
    },
    {
      id: "daging-import-beku",
      name: "Daging Kerbau / Lembu Import",
      unit: "1 kg",
      category: "Daging",
      channel: "supermarket",
      minPrice: 19.50,
      avgPrice: 22.00,
      maxPrice: 25.00,
      supermarketPrice: 21.50,
      wetMarketPrice: 23.00,
      cheapestRetailers: ["Econsave", "Lotus's", "Mydin"],
      keywords: ["daging beku", "daging import", "kerbau"]
    },
    {
      id: "ikan-kembung",
      name: "Ikan Kembung Segar",
      unit: "1 kg",
      category: "Ikan",
      channel: "both",
      minPrice: 14.00,
      avgPrice: 17.50,
      maxPrice: 22.00,
      supermarketPrice: 17.00,
      wetMarketPrice: 18.00,
      cheapestRetailers: ["Pasar Basah", "Econsave", "Lotus's"],
      keywords: ["ikan", "fish", "ikan kembung", "kembong"]
    },
    {
      id: "ikan-siakap",
      name: "Ikan Siakap (Barramundi)",
      unit: "1 kg",
      category: "Ikan",
      channel: "both",
      minPrice: 16.00,
      avgPrice: 19.50,
      maxPrice: 24.00,
      supermarketPrice: 19.00,
      wetMarketPrice: 20.50,
      cheapestRetailers: ["Mydin", "Lotus's", "Pasar Basah"],
      keywords: ["siakap", "ikan siakap", "barramundi"]
    },
    {
      id: "udang-sederhana",
      name: "Udang Putih / Harimau (Sederhana)",
      unit: "1 kg",
      category: "Makanan Laut",
      channel: "both",
      minPrice: 26.00,
      avgPrice: 32.00,
      maxPrice: 38.00,
      supermarketPrice: 31.00,
      wetMarketPrice: 33.00,
      cheapestRetailers: ["Pasar Awam", "Econsave", "Pasar Tani"],
      keywords: ["udang", "prawn", "shrimp"]
    },
    {
      id: "sotong",
      name: "Sotong Sederhana Segar",
      unit: "1 kg",
      category: "Makanan Laut",
      channel: "both",
      minPrice: 28.00,
      avgPrice: 34.00,
      maxPrice: 40.00,
      supermarketPrice: 33.00,
      wetMarketPrice: 35.00,
      cheapestRetailers: ["Pasar Basah", "Mydin", "Lotus's"],
      keywords: ["sotong", "squid", "calamari"]
    },
    {
      id: "telur-gred-a",
      name: "Telur Ayam Gred A",
      unit: "10 biji",
      category: "Telur",
      channel: "supermarket",
      minPrice: 4.20,
      avgPrice: 4.50,
      maxPrice: 5.00,
      supermarketPrice: 4.40,
      wetMarketPrice: 4.80,
      cheapestRetailers: ["Lotus's", "Mydin", "Speedmart 99"],
      keywords: ["telur", "egg", "eggs", "telur ayam"]
    },
    {
      id: "telur-gred-b",
      name: "Telur Ayam Gred B",
      unit: "10 biji",
      category: "Telur",
      channel: "supermarket",
      minPrice: 3.90,
      avgPrice: 4.20,
      maxPrice: 4.60,
      supermarketPrice: 4.10,
      wetMarketPrice: 4.50,
      cheapestRetailers: ["Econsave", "Speedmart 99", "Mydin"],
      keywords: ["telur gred b", "telur b"]
    },
    {
      id: "bawang-besar-india",
      name: "Bawang Besar Merah (Import)",
      unit: "1 kg",
      category: "Sayur-Sayuran & Rempah",
      channel: "both",
      minPrice: 4.50,
      avgPrice: 5.50,
      maxPrice: 7.00,
      supermarketPrice: 5.20,
      wetMarketPrice: 5.80,
      cheapestRetailers: ["Mydin", "Econsave", "Kedai Runcit"],
      keywords: ["bawang", "onion", "bawang besar", "bawang merah"]
    },
    {
      id: "bawang-putih",
      name: "Bawang Putih (Garlic)",
      unit: "1 kg",
      category: "Sayur-Sayuran & Rempah",
      channel: "both",
      minPrice: 8.00,
      avgPrice: 9.80,
      maxPrice: 12.00,
      supermarketPrice: 9.50,
      wetMarketPrice: 10.20,
      cheapestRetailers: ["Lotus's", "Econsave", "Mydin"],
      keywords: ["bawang putih", "garlic"]
    },
    {
      id: "cili-merah",
      name: "Cili Merah (Kulai / Minyak)",
      unit: "1 kg",
      category: "Sayur-Sayuran & Rempah",
      channel: "both",
      minPrice: 12.00,
      avgPrice: 15.50,
      maxPrice: 19.00,
      supermarketPrice: 15.00,
      wetMarketPrice: 16.00,
      cheapestRetailers: ["Pasar Awam", "Lotus's", "Econsave"],
      keywords: ["cili", "chili", "cili merah", "chilli"]
    },
    {
      id: "cili-padi",
      name: "Cili Padi / Cili Api Kampung",
      unit: "1 kg",
      category: "Sayur-Sayuran & Rempah",
      channel: "both",
      minPrice: 10.00,
      avgPrice: 13.50,
      maxPrice: 17.00,
      supermarketPrice: 13.00,
      wetMarketPrice: 14.00,
      cheapestRetailers: ["Pasar Tani", "Mydin", "Econsave"],
      keywords: ["cili padi", "cili api", "bird eye chili"]
    },
    {
      id: "cili-kering",
      name: "Cili Kering (Gred Pedas/Biasa)",
      unit: "1 kg",
      category: "Barangan Kering",
      channel: "both",
      minPrice: 18.00,
      avgPrice: 22.50,
      maxPrice: 27.00,
      supermarketPrice: 21.50,
      wetMarketPrice: 23.50,
      cheapestRetailers: ["Mydin", "Pasar Borong", "Kedai Rempah"],
      keywords: ["cili kering", "dried chili"]
    },
    {
      id: "halia-tua",
      name: "Halia Tua",
      unit: "1 kg",
      category: "Sayur-Sayuran & Rempah",
      channel: "both",
      minPrice: 7.00,
      avgPrice: 9.00,
      maxPrice: 12.00,
      supermarketPrice: 8.80,
      wetMarketPrice: 9.50,
      cheapestRetailers: ["Lotus's", "Mydin", "Pasar Basah"],
      keywords: ["halia", "ginger"]
    },
    {
      id: "serai",
      name: "Serai (Lemongrass)",
      unit: "1 kg",
      category: "Sayur-Sayuran & Rempah",
      channel: "wet_market",
      minPrice: 3.50,
      avgPrice: 4.80,
      maxPrice: 6.50,
      supermarketPrice: 5.00,
      wetMarketPrice: 4.50,
      cheapestRetailers: ["Pasar Tani", "Econsave", "Kedai Runcit"],
      keywords: ["serai", "lemongrass", "batang serai"]
    },
    {
      id: "kunyit-hidup",
      name: "Kunyit Hidup",
      unit: "1 kg",
      category: "Sayur-Sayuran & Rempah",
      channel: "both",
      minPrice: 6.50,
      avgPrice: 8.50,
      maxPrice: 11.00,
      supermarketPrice: 8.20,
      wetMarketPrice: 8.80,
      cheapestRetailers: ["Pasar Basah", "Mydin", "Lotus's"],
      keywords: ["kunyit", "turmeric", "kunyit hidup"]
    },
    {
      id: "santan-kelapa",
      name: "Santan Kelapa Segar (Perahan)",
      unit: "1 kg / 1 liter",
      category: "Barangan Segar & Kotak",
      channel: "wet_market",
      minPrice: 10.00,
      avgPrice: 12.00,
      maxPrice: 14.00,
      supermarketPrice: 12.50,
      wetMarketPrice: 11.50,
      cheapestRetailers: ["Pasar Basah", "Speedmart 99", "Mydin"],
      keywords: ["santan", "coconut milk", "coconut cream"]
    },
    {
      id: "minyak-masak-paket",
      name: "Minyak Masak Sawit (Paket Bersubsidi)",
      unit: "1 kg",
      category: "Minyak",
      channel: "supermarket",
      minPrice: 2.50,
      avgPrice: 2.50,
      maxPrice: 2.50,
      supermarketPrice: 2.50,
      wetMarketPrice: 2.50,
      cheapestRetailers: ["Kedai Runcit", "Mydin", "Pasar Mini"],
      keywords: ["minyak masak", "cooking oil", "minyak"]
    },
    {
      id: "minyak-masak-botol-5kg",
      name: "Minyak Masak Sawit Tulen (Botol)",
      unit: "5 kg",
      category: "Minyak",
      channel: "supermarket",
      minPrice: 29.50,
      avgPrice: 30.90,
      maxPrice: 33.50,
      supermarketPrice: 30.50,
      wetMarketPrice: 32.00,
      cheapestRetailers: ["Econsave", "Lotus's", "Mydin"],
      keywords: ["minyak botol", "minyak sawit"]
    },
    {
      id: "beras-tempatan-5kg",
      name: "Beras Putih Tempatan (SST)",
      unit: "5 kg",
      category: "Beras & Bijirin",
      channel: "supermarket",
      minPrice: 13.00,
      avgPrice: 14.50,
      maxPrice: 16.00,
      supermarketPrice: 14.00,
      wetMarketPrice: 15.00,
      cheapestRetailers: ["Mydin", "Econsave", "Pasar Mini"],
      keywords: ["beras", "rice", "nasi"]
    },
    {
      id: "tepung-gandum",
      name: "Tepung Gandum Kegunaan Am",
      unit: "1 kg",
      category: "Tepung",
      channel: "supermarket",
      minPrice: 2.80,
      avgPrice: 3.20,
      maxPrice: 3.80,
      supermarketPrice: 3.10,
      wetMarketPrice: 3.40,
      cheapestRetailers: ["Speedmart 99", "Lotus's", "Econsave"],
      keywords: ["tepung", "flour", "tepung gandum"]
    },
    {
      id: "kentang",
      name: "Ubi Kentang (Import)",
      unit: "1 kg",
      category: "Sayur-Sayuran",
      channel: "both",
      minPrice: 3.20,
      avgPrice: 4.20,
      maxPrice: 5.50,
      supermarketPrice: 4.00,
      wetMarketPrice: 4.50,
      cheapestRetailers: ["Econsave", "Mydin", "Pasar Basah"],
      keywords: ["kentang", "potato", "ubi kentang"]
    },
    {
      id: "tomato",
      name: "Tomato Tanah Rendah / Cameron",
      unit: "1 kg",
      category: "Sayur-Sayuran",
      channel: "both",
      minPrice: 4.50,
      avgPrice: 5.80,
      maxPrice: 7.50,
      supermarketPrice: 5.50,
      wetMarketPrice: 6.20,
      cheapestRetailers: ["Lotus's", "Pasar Tani", "Econsave"],
      keywords: ["tomato", "buah tomato"]
    },
    {
      id: "kobis-bulat",
      name: "Kobis Bulat Tempatan / Import",
      unit: "1 kg",
      category: "Sayur-Sayuran",
      channel: "both",
      minPrice: 3.50,
      avgPrice: 4.50,
      maxPrice: 6.00,
      supermarketPrice: 4.20,
      wetMarketPrice: 4.80,
      cheapestRetailers: ["Mydin", "Econsave", "Pasar Basah"],
      keywords: ["kobis", "cabbage", "kubis"]
    },
    {
      id: "sawi-hijau",
      name: "Sawi Hijau (Choy Sum)",
      unit: "1 kg",
      category: "Sayur-Sayuran",
      channel: "both",
      minPrice: 4.00,
      avgPrice: 5.50,
      maxPrice: 7.50,
      supermarketPrice: 5.20,
      wetMarketPrice: 5.80,
      cheapestRetailers: ["Pasar Tani", "Pasar Basah", "Lotus's"],
      keywords: ["sawi", "choy sum", "mustard green"]
    },
    {
      id: "kangkung",
      name: "Kangkung",
      unit: "1 kg",
      category: "Sayur-Sayuran",
      channel: "wet_market",
      minPrice: 3.50,
      avgPrice: 4.80,
      maxPrice: 6.50,
      supermarketPrice: 5.00,
      wetMarketPrice: 4.50,
      cheapestRetailers: ["Pasar Basah", "Econsave", "Pasar Tani"],
      keywords: ["kangkung", "water spinach"]
    },
    {
      id: "kicap-manis",
      name: "Kicap Manis / Masin",
      unit: "640 ml",
      category: "Sos & Perasa",
      channel: "supermarket",
      minPrice: 5.80,
      avgPrice: 6.90,
      maxPrice: 8.20,
      supermarketPrice: 6.80,
      wetMarketPrice: 7.20,
      cheapestRetailers: ["Speedmart 99", "Econsave", "Mydin"],
      keywords: ["kicap", "soy sauce", "kicap manis", "kicap pekat"]
    },
    {
      id: "sos-tiram",
      name: "Sos Tiram",
      unit: "510 g",
      category: "Sos & Perasa",
      channel: "supermarket",
      minPrice: 4.90,
      avgPrice: 5.80,
      maxPrice: 6.80,
      supermarketPrice: 5.70,
      wetMarketPrice: 6.00,
      cheapestRetailers: ["Lotus's", "Speedmart 99", "Mydin"],
      keywords: ["sos tiram", "oyster sauce"]
    },
    {
      id: "gula-pasir-kasar",
      name: "Gula Pasir Kasar / Halus (Bersubsidi)",
      unit: "1 kg",
      category: "Barangan Kering",
      channel: "supermarket",
      minPrice: 2.85,
      avgPrice: 2.85,
      maxPrice: 3.00,
      supermarketPrice: 2.85,
      wetMarketPrice: 2.90,
      cheapestRetailers: ["Kedai Runcit", "Mydin", "Econsave"],
      keywords: ["gula", "sugar"]
    },
    {
      id: "garam-halus",
      name: "Garam Halus / Kasar",
      unit: "450 g",
      category: "Barangan Kering",
      channel: "supermarket",
      minPrice: 0.90,
      avgPrice: 1.20,
      maxPrice: 1.60,
      supermarketPrice: 1.10,
      wetMarketPrice: 1.30,
      cheapestRetailers: ["Speedmart 99", "Mydin", "Kedai Runcit"],
      keywords: ["garam", "salt"]
    }
  ];

  const payload = {
    metadata: {
      source: "KPDN PriceCatcher via data.gov.my",
      cadence: "Quarterly Snapshot Reference",
      lastUpdated: new Date().toISOString(),
      disclaimer: "Penafian: Data harga barangan dapur dipetik daripada inisiatif terbuka KPDN PriceCatcher (data.gov.my) sebagai panduan anggaran kos masakan sahaja. Harga sebenar di premis mungkin berbeza mengikut lokasi, gred, promosi, atau perubahan semasa peruncit."
    },
    zones,
    items: staples
  };

  const outDir = path.resolve('data');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPath = path.join(outDir, 'kpdn_prices.json');
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
  console.log('Saved', staples.length, 'staples and', zones.length, 'zones to', outPath, `(${fs.statSync(outPath).size} bytes)`);
}

generateCuratedGroceryPrices();
