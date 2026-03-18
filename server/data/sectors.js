const SECTORS = [
  { id: "ai", label: "AI", color: "#0b6e69", description: "AI servers, accelerators, and data-center suppliers.", sourceType: "concept" },
  { id: "semiconductor", label: "Semiconductor", color: "#0f8f63", description: "Foundry, IC design, assembly, test, and equipment.", sourceType: "industry" },
  { id: "electronics", label: "Electronics", color: "#1b5fa7", description: "Components, ODM, OEM, and consumer electronics.", sourceType: "industry" },
  { id: "industrial", label: "Industrial", color: "#5f6b7a", description: "Automation, machinery, tooling, and industrial systems.", sourceType: "industry" },
  { id: "medical", label: "Medical", color: "#c04b72", description: "Biotech, pharma, and medical devices.", sourceType: "industry" },
  { id: "finance", label: "Finance", color: "#8c5a17", description: "Financial holding, banking, and insurance.", sourceType: "industry" },
  { id: "energy", label: "Energy", color: "#cb5a1f", description: "Energy supply and infrastructure.", sourceType: "industry" },
  { id: "defense-aerospace", label: "Defense & Aerospace", color: "#7a445f", description: "Aerospace, drone, defense, and repair chains.", sourceType: "concept" },
  { id: "green-energy", label: "Green Energy", color: "#2c8a52", description: "Solar, storage, wind, and energy-saving themes.", sourceType: "concept" },
  { id: "materials", label: "Materials", color: "#8b6b3c", description: "Steel, petrochemicals, chemicals, and base materials.", sourceType: "industry" }
];

const STOCKS = {
  "1301": { symbol: "1301", name: "Formosa Plastics", market: "TWSE", industry: "Plastics", active: true },
  "1303": { symbol: "1303", name: "Nan Ya Plastics", market: "TWSE", industry: "Plastics", active: true },
  "1513": { symbol: "1513", name: "Chung-Hsin Electric", market: "TWSE", industry: "Electrical Machinery", active: true },
  "1519": { symbol: "1519", name: "Fortune Electric", market: "TWSE", industry: "Electrical Machinery", active: true },
  "1536": { symbol: "1536", name: "Hota", market: "TWSE", industry: "Auto", active: true },
  "1590": { symbol: "1590", name: "Airtac-KY", market: "TWSE", industry: "Electrical Machinery", active: true },
  "1609": { symbol: "1609", name: "Taya", market: "TWSE", industry: "Cable", active: true },
  "1717": { symbol: "1717", name: "Evermore Chemical", market: "TWSE", industry: "Chemicals", active: true },
  "1723": { symbol: "1723", name: "China Carbon", market: "TWSE", industry: "Chemicals", active: true },
  "2002": { symbol: "2002", name: "China Steel", market: "TWSE", industry: "Steel", active: true },
  "2049": { symbol: "2049", name: "HIWIN", market: "TWSE", industry: "Electrical Machinery", active: true },
  "2066": { symbol: "2066", name: "Shih Her", market: "TPEX", industry: "Electrical Machinery", active: true },
  "2208": { symbol: "2208", name: "CSBC", market: "TWSE", industry: "Transportation", active: true },
  "2308": { symbol: "2308", name: "Delta", market: "TWSE", industry: "Electronic Components", active: true },
  "2317": { symbol: "2317", name: "Hon Hai", market: "TWSE", industry: "Other Electronics", active: true },
  "2327": { symbol: "2327", name: "Yageo", market: "TWSE", industry: "Electronic Components", active: true },
  "2330": { symbol: "2330", name: "TSMC", market: "TWSE", industry: "Semiconductor", active: true },
  "2356": { symbol: "2356", name: "Inventec", market: "TWSE", industry: "Computer & Peripheral", active: true },
  "2357": { symbol: "2357", name: "ASUS", market: "TWSE", industry: "Computer & Peripheral", active: true },
  "2368": { symbol: "2368", name: "Gold Circuit", market: "TWSE", industry: "Electronic Components", active: true },
  "2376": { symbol: "2376", name: "GIGABYTE", market: "TWSE", industry: "Computer & Peripheral", active: true },
  "2377": { symbol: "2377", name: "MSI", market: "TWSE", industry: "Computer & Peripheral", active: true },
  "2379": { symbol: "2379", name: "Realtek", market: "TWSE", industry: "Semiconductor", active: true },
  "2382": { symbol: "2382", name: "Quanta", market: "TWSE", industry: "Computer & Peripheral", active: true },
  "2383": { symbol: "2383", name: "EMC", market: "TWSE", industry: "Electronic Components", active: true },
  "2454": { symbol: "2454", name: "MediaTek", market: "TWSE", industry: "Semiconductor", active: true },
  "2634": { symbol: "2634", name: "AIDC", market: "TWSE", industry: "Transportation", active: true },
  "2645": { symbol: "2645", name: "Evergreen Aviation", market: "TWSE", industry: "Transportation", active: true },
  "2881": { symbol: "2881", name: "Fubon Financial", market: "TWSE", industry: "Finance", active: true },
  "2882": { symbol: "2882", name: "Cathay Financial", market: "TWSE", industry: "Finance", active: true },
  "2886": { symbol: "2886", name: "Mega Financial", market: "TWSE", industry: "Finance", active: true },
  "2891": { symbol: "2891", name: "CTBC Financial", market: "TWSE", industry: "Finance", active: true },
  "3004": { symbol: "3004", name: "Apex Dynamics", market: "TPEX", industry: "Electrical Machinery", active: true },
  "3017": { symbol: "3017", name: "AVC", market: "TWSE", industry: "Electronic Components", active: true },
  "3034": { symbol: "3034", name: "Novatek", market: "TWSE", industry: "Semiconductor", active: true },
  "3037": { symbol: "3037", name: "Unimicron", market: "TWSE", industry: "Electronic Components", active: true },
  "3231": { symbol: "3231", name: "Wistron", market: "TWSE", industry: "Computer & Peripheral", active: true },
  "3324": { symbol: "3324", name: "Auras", market: "TPEX", industry: "Computer & Peripheral", active: true },
  "3443": { symbol: "3443", name: "Alchip", market: "TWSE", industry: "Semiconductor", active: true },
  "3576": { symbol: "3576", name: "United Renewable", market: "TWSE", industry: "Optoelectronics", active: true },
  "3623": { symbol: "3623", name: "Richtek Placeholder", market: "TPEX", industry: "Other Electronics", active: true },
  "3686": { symbol: "3686", name: "Tainergy", market: "TWSE", industry: "Optoelectronics", active: true },
  "3706": { symbol: "3706", name: "MiTAC", market: "TWSE", industry: "Computer & Peripheral", active: true },
  "3708": { symbol: "3708", name: "Swancor", market: "TWSE", industry: "Other", active: true },
  "3711": { symbol: "3711", name: "ASEH", market: "TWSE", industry: "Semiconductor", active: true },
  "4123": { symbol: "4123", name: "Center Lab", market: "TPEX", industry: "Medical", active: true },
  "4147": { symbol: "4147", name: "TaiMed", market: "TPEX", industry: "Medical", active: true },
  "4541": { symbol: "4541", name: "Aerospace Industrial", market: "TPEX", industry: "Electrical Machinery", active: true },
  "4542": { symbol: "4542", name: "KEE", market: "TPEX", industry: "Electrical Machinery", active: true },
  "4549": { symbol: "4549", name: "Dah He", market: "TPEX", industry: "Electrical Machinery", active: true },
  "4551": { symbol: "4551", name: "Jye", market: "TWSE", industry: "Auto", active: true },
  "4572": { symbol: "4572", name: "Jiin Yeeh Ding", market: "TPEX", industry: "Electrical Machinery", active: true },
  "4576": { symbol: "4576", name: "Microsys", market: "TPEX", industry: "Electrical Machinery", active: true },
  "4743": { symbol: "4743", name: "Oneness", market: "TPEX", industry: "Medical", active: true },
  "4938": { symbol: "4938", name: "Pegatron", market: "TWSE", industry: "Other Electronics", active: true },
  "5243": { symbol: "5243", name: "Asia Vital", market: "TWSE", industry: "Other Electronics", active: true },
  "5306": { symbol: "5306", name: "KMC", market: "TPEX", industry: "Other", active: true },
  "6114": { symbol: "6114", name: "Brogent Placeholder", market: "TPEX", industry: "Other Electronics", active: true },
  "6409": { symbol: "6409", name: "Voltronic", market: "TWSE", industry: "Other Electronics", active: true },
  "6443": { symbol: "6443", name: "Neo Solar", market: "TWSE", industry: "Optoelectronics", active: true },
  "6446": { symbol: "6446", name: "PharmaEssentia", market: "TPEX", industry: "Medical", active: true },
  "6477": { symbol: "6477", name: "Anji", market: "TWSE", industry: "Optoelectronics", active: true },
  "6505": { symbol: "6505", name: "Formosa Petrochemical", market: "TWSE", industry: "Energy", active: true },
  "6581": { symbol: "6581", name: "Cleanaway Placeholder", market: "TPEX", industry: "Other", active: true },
  "6589": { symbol: "6589", name: "EirGenix", market: "TPEX", industry: "Medical", active: true },
  "6667": { symbol: "6667", name: "Foxsemicon", market: "TWSE", industry: "Semiconductor", active: true },
  "6669": { symbol: "6669", name: "Wiwynn", market: "TWSE", industry: "Computer & Peripheral", active: true },
  "6806": { symbol: "6806", name: "Shinfox Energy", market: "TWSE", industry: "Green Energy", active: true },
  "6829": { symbol: "6829", name: "Chian Fu Precision", market: "TWSE", industry: "Electrical Machinery", active: true },
  "6873": { symbol: "6873", name: "HD Renewable", market: "TWSE", industry: "Green Energy", active: true },
  "7402": { symbol: "7402", name: "Asia Optical Placeholder", market: "TPEX", industry: "Optoelectronics", active: true },
  "8033": { symbol: "8033", name: "Thunder Tiger", market: "TPEX", industry: "Other", active: true },
  "8083": { symbol: "8083", name: "Placeholder 8083", market: "TPEX", industry: "Other", active: true },
  "8222": { symbol: "8222", name: "AirTAC Placeholder", market: "TPEX", industry: "Electrical Machinery", active: true },
  "8926": { symbol: "8926", name: "Taiwan Cogeneration", market: "TWSE", industry: "Energy", active: true },
  "8996": { symbol: "8996", name: "Kaori", market: "TWSE", industry: "Electrical Machinery", active: true },
  "9921": { symbol: "9921", name: "Giant", market: "TWSE", industry: "Leisure", active: true },
  "9937": { symbol: "9937", name: "Fullon Gas", market: "TWSE", industry: "Energy", active: true },
  "9942": { symbol: "9942", name: "Mao Shun", market: "TWSE", industry: "Auto", active: true },
  "9946": { symbol: "9946", name: "Sanfar", market: "TWSE", industry: "Construction", active: true },
  "9951": { symbol: "9951", name: "Imperial", market: "TWSE", industry: "Auto", active: true },
  "9955": { symbol: "9955", name: "Ji-Long", market: "TWSE", industry: "Other", active: true },
  "9958": { symbol: "9958", name: "Century Iron", market: "TWSE", industry: "Steel", active: true }
};

const SECTOR_MEMBERSHIPS = {
  ai: ["2382", "6669", "3231", "3017", "2317", "2356", "2376", "4938", "3324", "6667", "3706", "2377", "2383", "2308", "2357", "2379", "3443", "3711", "2368", "3037"],
  semiconductor: ["2330", "2454", "3711", "3034", "2379", "3443", "6667"],
  electronics: ["2308", "2317", "2327", "2357", "2383", "3017", "3037", "4938", "5243", "6409"],
  industrial: ["2049", "1519", "1590", "1536", "4551", "6829", "8996", "4549"],
  medical: ["6446", "4743", "4147", "4123", "6589"],
  finance: ["2882", "2881", "2891", "2886"],
  energy: ["6505", "8926", "9937", "6806", "6873"],
  "defense-aerospace": ["2634", "8222", "4541", "7402", "8033", "2645", "4572", "2208", "3004", "5306", "4551", "6829", "4576", "4542", "4549", "6114", "8996"],
  "green-energy": ["6443", "6806", "1513", "6589", "3576", "6477", "5243", "3708", "9958", "3686", "3623", "6409", "6581", "9942", "2066", "1723", "6873", "9955", "8083", "1609"],
  materials: ["1301", "1303", "2002", "1717", "6505", "9958"]
};

function getSectorSymbols(sectorId) {
  return SECTOR_MEMBERSHIPS[sectorId] || [];
}

function getStock(symbol) {
  return STOCKS[symbol] || null;
}

function getStockSectors(symbol) {
  return SECTORS.filter((sector) => getSectorSymbols(sector.id).includes(symbol)).map((sector) => ({
    id: sector.id,
    label: sector.label,
    color: sector.color
  }));
}

module.exports = {
  SECTORS,
  STOCKS,
  SECTOR_MEMBERSHIPS,
  getSectorSymbols,
  getStock,
  getStockSectors
};
