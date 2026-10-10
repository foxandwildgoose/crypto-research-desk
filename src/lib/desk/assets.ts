import type { Asset, CompanyKind } from "./types.ts";

/** Venue routing table. ETF/DAT universes come from sources, not this list. */
export const SEED_ASSETS: Asset[] = [
  { id: "btc", symbol: "BTC", name: "Bitcoin", nameKo: "비트코인", themes: ["메이저"], okxSpot: "BTC-USDT", okxSwap: "BTC-USDT-SWAP", contract: null, identity: "native" },
  { id: "eth", symbol: "ETH", name: "Ethereum", nameKo: "이더리움", themes: ["메이저"], okxSpot: "ETH-USDT", okxSwap: "ETH-USDT-SWAP", contract: null, identity: "native" },
  { id: "sol", symbol: "SOL", name: "Solana", nameKo: "솔라나", themes: ["메이저"], okxSpot: "SOL-USDT", okxSwap: "SOL-USDT-SWAP", contract: null, identity: "native" },
  { id: "xrp", symbol: "XRP", name: "XRP", nameKo: "엑스알피", themes: ["메이저"], okxSpot: "XRP-USDT", okxSwap: "XRP-USDT-SWAP", contract: null, identity: "native" },
  { id: "doge", symbol: "DOGE", name: "Dogecoin", nameKo: "도지코인", themes: ["밈"], okxSpot: "DOGE-USDT", okxSwap: "DOGE-USDT-SWAP", contract: null, identity: "native" },
  { id: "link", symbol: "LINK", name: "Chainlink", nameKo: "체인링크", themes: ["인프라"], okxSpot: "LINK-USDT", okxSwap: "LINK-USDT-SWAP", contract: null, identity: "native" },
  { id: "sui", symbol: "SUI", name: "Sui", nameKo: "수이", themes: ["메이저"], okxSpot: "SUI-USDT", okxSwap: "SUI-USDT-SWAP", contract: null, identity: "native" },
  {
    id: "pepe",
    symbol: "PEPE",
    name: "Pepe",
    nameKo: "페페",
    themes: ["밈"],
    okxSpot: "PEPE-USDT",
    okxSwap: "PEPE-USDT-SWAP",
    contract: {
      chain: "ethereum",
      address: "0x6982508145454ce325ddbe47a25d4ec3d2311933",
      note: "DEX Screener 응답의 base token과 심볼 PEPE가 일치한 주소",
    },
    identity: "verified",
  },
  { id: "wif", symbol: "WIF", name: "dogwifhat", nameKo: "도그위프햇", themes: ["밈"], okxSpot: "WIF-USDT", okxSwap: "WIF-USDT-SWAP", contract: null, identity: "unresolved" },
  { id: "bonk", symbol: "BONK", name: "Bonk", nameKo: "봉크", themes: ["밈"], okxSpot: "BONK-USDT", okxSwap: "BONK-USDT-SWAP", contract: null, identity: "unresolved" },
  { id: "shib", symbol: "SHIB", name: "Shiba Inu", nameKo: "시바이누", themes: ["밈"], okxSpot: "SHIB-USDT", okxSwap: "SHIB-USDT-SWAP", contract: null, identity: "unresolved" },
  { id: "floki", symbol: "FLOKI", name: "FLOKI", nameKo: "플로키", themes: ["밈"], okxSpot: "FLOKI-USDT", okxSwap: "FLOKI-USDT-SWAP", contract: null, identity: "unresolved" },
];

export const CG_IDS: Record<string, string> = {
  btc: "bitcoin",
  eth: "ethereum",
  sol: "solana",
  xrp: "ripple",
  doge: "dogecoin",
  link: "chainlink",
  sui: "sui",
  pepe: "pepe",
  wif: "dogwifcoin",
  bonk: "bonk",
  shib: "shiba-inu",
  floki: "floki",
};

const TREASURY = new Set(["MSTR", "XXI", "3350", "ASST", "SBET", "BMNR", "ETHM", "CEPO", "SMLR", "FRMM", "BTCS", "FGNX"]);
const MINER = new Set(["MARA", "RIOT", "HUT", "CLSK", "CAN"]);
const OPERATING = new Set(["TSLA", "GLXY", "ORBS", "COIN"]);
const EXCHANGE = new Set(["COIN", "BLSH", "GEMI"]);

export function companyKind(ticker: string, name: string): CompanyKind {
  const sym = ticker.split(".")[0].toUpperCase();
  const n = name.toLowerCase();
  if (n.includes("government") || n.includes("el salvador") || n.includes("kingdom of")) return "other";
  if (EXCHANGE.has(sym) && !TREASURY.has(sym)) return "exchange";
  if (MINER.has(sym)) return "miner";
  if (TREASURY.has(sym)) return "treasury";
  if (OPERATING.has(sym)) return "operating";
  if (n.includes("mining") || n.includes("miner")) return "miner";
  return "other";
}

export function coinFromTreasurySlug(slug: string): string | null {
  if (slug === "bitcoin") return "btc";
  if (slug === "ethereum") return "eth";
  return null;
}

export function assetBySymbol(assets: Asset[], symbol: string): Asset | undefined {
  const s = symbol.replace(/^\$/, "").toUpperCase();
  return assets.find((a) => a.symbol.toUpperCase() === s);
}
