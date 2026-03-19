const SECTORS = [
  { id: "ai", label: "AI", color: "#0b6e69", description: "AI 伺服器、運算平台、關鍵零組件與概念股。", sourceType: "concept" },
  { id: "semiconductor", label: "半導體", color: "#0f8f63", description: "晶圓代工、IC 設計、封測與半導體設備。", sourceType: "industry" },
  { id: "electronics", label: "電子", color: "#1b5fa7", description: "電子零組件、電腦週邊、網通與其他電子。", sourceType: "industry" },
  { id: "industrial", label: "工業", color: "#5f6b7a", description: "機械、自動化、汽車零組件與工業設備。", sourceType: "industry" },
  { id: "medical", label: "醫療", color: "#c04b72", description: "生技醫療、製藥與醫材相關公司。", sourceType: "industry" },
  { id: "finance", label: "金融", color: "#8c5a17", description: "銀行、金控、保險與證券相關個股。", sourceType: "industry" },
  { id: "energy", label: "能源", color: "#cb5a1f", description: "電力、儲能、油氣與能源管理相關公司。", sourceType: "industry" },
  { id: "defense-aerospace", label: "國防航太", color: "#7a445f", description: "軍工、航太、無人機與航太零組件概念股。", sourceType: "concept" },
  { id: "green-energy", label: "綠能", color: "#2c8a52", description: "太陽能、風電、電動車供應鏈與節能概念。", sourceType: "concept" },
  { id: "materials", label: "原物料", color: "#8b6b3c", description: "塑化、鋼鐵、化工與基礎材料個股。", sourceType: "industry" }
];

const INDUSTRY_SECTOR_RULES = {
  semiconductor: ["Semiconductor", "半導體"],
  electronics: [
    "Electronic Components",
    "Computer & Peripheral",
    "Optoelectronics",
    "Communication",
    "Electronics",
    "Other Electronics"
  ],
  industrial: ["Electrical Machinery", "Machinery", "Auto", "Industrial"],
  medical: ["Medical", "Biotech", "Pharma"],
  finance: ["Finance", "Bank", "Insurance", "Securities"],
  energy: ["Energy", "Oil", "Gas", "Power"],
  materials: ["Plastics", "Chemicals", "Steel", "Cable", "Rubber", "Materials"]
};

const STOCKS = {
  "1301": { symbol: "1301", name: "台塑", market: "TWSE", industry: "Plastics", active: true },
  "1303": { symbol: "1303", name: "南亞", market: "TWSE", industry: "Plastics", active: true },
  "1513": { symbol: "1513", name: "中興電", market: "TWSE", industry: "Electrical Machinery", active: true },
  "1519": { symbol: "1519", name: "華城", market: "TWSE", industry: "Electrical Machinery", active: true },
  "1536": { symbol: "1536", name: "和大", market: "TWSE", industry: "Auto", active: true },
  "1590": { symbol: "1590", name: "亞德客-KY", market: "TWSE", industry: "Electrical Machinery", active: true },
  "1609": { symbol: "1609", name: "大亞", market: "TWSE", industry: "Cable", active: true },
  "1717": { symbol: "1717", name: "長興", market: "TWSE", industry: "Chemicals", active: true },
  "1723": { symbol: "1723", name: "中碳", market: "TWSE", industry: "Chemicals", active: true },
  "2002": { symbol: "2002", name: "中鋼", market: "TWSE", industry: "Steel", active: true },
  "2049": { symbol: "2049", name: "上銀", market: "TWSE", industry: "Electrical Machinery", active: true },
  "2066": { symbol: "2066", name: "世德", market: "TPEX", industry: "Electrical Machinery", active: true },
  "2208": { symbol: "2208", name: "台船", market: "TWSE", industry: "Transportation", active: true },
  "2308": { symbol: "2308", name: "台達電", market: "TWSE", industry: "Electronic Components", active: true },
  "2317": { symbol: "2317", name: "鴻海", market: "TWSE", industry: "Other Electronics", active: true },
  "2327": { symbol: "2327", name: "國巨", market: "TWSE", industry: "Electronic Components", active: true },
  "2330": { symbol: "2330", name: "台積電", market: "TWSE", industry: "Semiconductor", active: true },
  "2356": { symbol: "2356", name: "英業達", market: "TWSE", industry: "Computer & Peripheral", active: true },
  "2357": { symbol: "2357", name: "華碩", market: "TWSE", industry: "Computer & Peripheral", active: true },
  "2368": { symbol: "2368", name: "金像電", market: "TWSE", industry: "Electronic Components", active: true },
  "2376": { symbol: "2376", name: "技嘉", market: "TWSE", industry: "Computer & Peripheral", active: true },
  "2377": { symbol: "2377", name: "微星", market: "TWSE", industry: "Computer & Peripheral", active: true },
  "2379": { symbol: "2379", name: "瑞昱", market: "TWSE", industry: "Semiconductor", active: true },
  "2382": { symbol: "2382", name: "廣達", market: "TWSE", industry: "Computer & Peripheral", active: true },
  "2383": { symbol: "2383", name: "台光電", market: "TWSE", industry: "Electronic Components", active: true },
  "2454": { symbol: "2454", name: "聯發科", market: "TWSE", industry: "Semiconductor", active: true },
  "2634": { symbol: "2634", name: "漢翔", market: "TWSE", industry: "Transportation", active: true },
  "2645": { symbol: "2645", name: "長榮航太", market: "TWSE", industry: "Transportation", active: true },
  "2881": { symbol: "2881", name: "富邦金", market: "TWSE", industry: "Finance", active: true },
  "2882": { symbol: "2882", name: "國泰金", market: "TWSE", industry: "Finance", active: true },
  "2886": { symbol: "2886", name: "兆豐金", market: "TWSE", industry: "Finance", active: true },
  "2891": { symbol: "2891", name: "中信金", market: "TWSE", industry: "Finance", active: true },
  "3004": { symbol: "3004", name: "豐達科", market: "TPEX", industry: "Electrical Machinery", active: true },
  "3017": { symbol: "3017", name: "奇鋐", market: "TWSE", industry: "Electronic Components", active: true },
  "3034": { symbol: "3034", name: "聯詠", market: "TWSE", industry: "Semiconductor", active: true },
  "3037": { symbol: "3037", name: "欣興", market: "TWSE", industry: "Electronic Components", active: true },
  "3231": { symbol: "3231", name: "緯創", market: "TWSE", industry: "Computer & Peripheral", active: true },
  "3324": { symbol: "3324", name: "雙鴻", market: "TPEX", industry: "Computer & Peripheral", active: true },
  "3443": { symbol: "3443", name: "創意", market: "TWSE", industry: "Semiconductor", active: true },
  "3576": { symbol: "3576", name: "聯合再生", market: "TWSE", industry: "Optoelectronics", active: true },
  "3623": { symbol: "3623", name: "富晶通", market: "TPEX", industry: "Other Electronics", active: true },
  "3686": { symbol: "3686", name: "達能", market: "TWSE", industry: "Optoelectronics", active: true },
  "3706": { symbol: "3706", name: "神達", market: "TWSE", industry: "Computer & Peripheral", active: true },
  "3708": { symbol: "3708", name: "上緯投控", market: "TWSE", industry: "Other", active: true },
  "3711": { symbol: "3711", name: "日月光投控", market: "TWSE", industry: "Semiconductor", active: true },
  "4123": { symbol: "4123", name: "晟德", market: "TPEX", industry: "Medical", active: true },
  "4147": { symbol: "4147", name: "中裕", market: "TPEX", industry: "Medical", active: true },
  "4541": { symbol: "4541", name: "晟田", market: "TPEX", industry: "Electrical Machinery", active: true },
  "4542": { symbol: "4542", name: "科嶠", market: "TPEX", industry: "Electrical Machinery", active: true },
  "4549": { symbol: "4549", name: "桓達", market: "TPEX", industry: "Electrical Machinery", active: true },
  "4551": { symbol: "4551", name: "智伸科", market: "TWSE", industry: "Auto", active: true },
  "4572": { symbol: "4572", name: "駐龍", market: "TPEX", industry: "Electrical Machinery", active: true },
  "4576": { symbol: "4576", name: "大銀微系統", market: "TPEX", industry: "Electrical Machinery", active: true },
  "4743": { symbol: "4743", name: "合一", market: "TPEX", industry: "Medical", active: true },
  "4938": { symbol: "4938", name: "和碩", market: "TWSE", industry: "Other Electronics", active: true },
  "5243": { symbol: "5243", name: "乙盛-KY", market: "TWSE", industry: "Other Electronics", active: true },
  "5306": { symbol: "5306", name: "桂盟", market: "TPEX", industry: "Other", active: true },
  "6114": { symbol: "6114", name: "久威", market: "TPEX", industry: "Other Electronics", active: true },
  "6409": { symbol: "6409", name: "旭隼", market: "TWSE", industry: "Other Electronics", active: true },
  "6443": { symbol: "6443", name: "元晶", market: "TWSE", industry: "Optoelectronics", active: true },
  "6446": { symbol: "6446", name: "藥華藥", market: "TPEX", industry: "Medical", active: true },
  "6477": { symbol: "6477", name: "安集", market: "TWSE", industry: "Optoelectronics", active: true },
  "6505": { symbol: "6505", name: "台塑化", market: "TWSE", industry: "Energy", active: true },
  "6581": { symbol: "6581", name: "鋼聯", market: "TPEX", industry: "Other", active: true },
  "6589": { symbol: "6589", name: "台康生技", market: "TPEX", industry: "Medical", active: true },
  "6667": { symbol: "6667", name: "信紘科", market: "TWSE", industry: "Semiconductor", active: true },
  "6669": { symbol: "6669", name: "緯穎", market: "TWSE", industry: "Computer & Peripheral", active: true },
  "6806": { symbol: "6806", name: "森崴能源", market: "TWSE", industry: "Energy", active: true },
  "6829": { symbol: "6829", name: "千附精密", market: "TWSE", industry: "Electrical Machinery", active: true },
  "6873": { symbol: "6873", name: "泓德能源", market: "TWSE", industry: "Energy", active: true },
  "7402": { symbol: "7402", name: "邑錡", market: "TPEX", industry: "Optoelectronics", active: true },
  "8033": { symbol: "8033", name: "雷虎", market: "TPEX", industry: "Other", active: true },
  "8083": { symbol: "8083", name: "瑞穎", market: "TPEX", industry: "Other", active: true },
  "8222": { symbol: "8222", name: "寶一", market: "TPEX", industry: "Electrical Machinery", active: true },
  "8926": { symbol: "8926", name: "台汽電", market: "TWSE", industry: "Energy", active: true },
  "8996": { symbol: "8996", name: "高力", market: "TWSE", industry: "Electrical Machinery", active: true },
  "9937": { symbol: "9937", name: "全國", market: "TWSE", industry: "Energy", active: true },
  "9942": { symbol: "9942", name: "茂順", market: "TWSE", industry: "Auto", active: true },
  "9955": { symbol: "9955", name: "佳龍", market: "TWSE", industry: "Other", active: true },
  "9958": { symbol: "9958", name: "世紀鋼", market: "TWSE", industry: "Steel", active: true }
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
  INDUSTRY_SECTOR_RULES,
  SECTOR_MEMBERSHIPS,
  getSectorSymbols,
  getStock,
  getStockSectors
};
