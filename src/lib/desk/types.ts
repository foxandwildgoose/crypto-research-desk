export type Mode = "live" | "snapshot" | "mixed";

export type Provenance = {
  source: string;
  url: string;
  retrievedAt: string;
  asOf: string | null;
  kind: Mode | "parsed-filing";
  note: string;
};

export type Asset = {
  id: string;
  symbol: string;
  name: string;
  nameKo: string;
  themes: string[];
  okxSpot: string | null;
  okxSwap: string | null;
  contract: { chain: string; address: string; note: string } | null;
  identity: "verified" | "native" | "unresolved";
};

export type Quote = {
  assetId: string;
  priceUsd: number | null;
  change24hPct: number | null;
  change7dPct: number | null;
  volume24hUsd: number | null;
  marketCapUsd: number | null;
  circulatingSupply: number | null;
  high24h: number | null;
  low24h: number | null;
  venue: string;
  asOf: string;
  krwPrice: number | null;
  krwPerUsdt: number | null;
  premiumPct: number | null;
  premiumNote: string;
  fundingRate: number | null;
  fundingTime: string | null;
  openInterestUsd: number | null;
  contractMultiplier: number | null;
  perpAvailable: boolean;
  upbitKrw: boolean;
  upbitUsdt: boolean;
  sourceUrl: string;
};

export type Candle = {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
};

export type EtfProduct = {
  assetId: string;
  ticker: string;
  issuer: string;
  jurisdiction: "US";
  exposure: "spot" | "unresolved";
  sessionDate: string | null;
  dailyFlowUsd: number | null;
  aumUsd: number | null;
  cumulativeFlowUsd: number | null;
  feePct: number | null;
  tradingState: "reported" | "unreported";
  sourceUrl: string;
};

export type EtfSession = {
  assetId: string;
  date: string;
  netFlowUsd: number | null;
  valueTradedUsd: number | null;
  netAssetsUsd: number | null;
  cumFlowUsd: number | null;
  partial: boolean;
  missingTickers: string[];
  positiveIssuers: number | null;
  negativeIssuers: number | null;
  flatIssuers: number | null;
  reportingFunds: number | null;
};

export type EtfHeat = {
  assetId: string;
  ticker: string;
  date: string;
  flowUsd: number | null;
};

export type EtfMilestone = {
  id: string;
  assetId: string | null;
  ticker: string | null;
  title: string;
  date: string | null;
  uncertainty: string;
  url: string;
  summary: string;
};

export type CompanyKind = "treasury" | "miner" | "operating" | "exchange" | "other";

export type CompanyHolding = {
  companyId: string;
  name: string;
  ticker: string;
  country: string;
  kind: CompanyKind;
  assetId: string;
  holdings: number;
  entryValueUsd: number | null;
  currentValueUsd: number | null;
  supplySharePct: number | null;
  asOf: string | null;
  source: string;
  url: string;
  retrievedAt: string;
};

export type Disclosure = {
  id: string;
  companyId: string;
  assetId: string;
  published: string;
  asOf: string;
  periodStart: string | null;
  periodEnd: string | null;
  endingQty: number | null;
  acquiredQty: number | null;
  soldQty: number | null;
  rewardQty: number | null;
  avgPurchaseUsd: number | null;
  aggregatePurchaseUsd: number | null;
  proceedsFromEquityUsd: number | null;
  cashUsedUsd: number | null;
  cashAndSecuritiesUsd: number | null;
  stakingQty: number | null;
  classification: "purchase" | "sale" | "reward" | "balance" | "policy";
  excerpt: string;
  sourceUrl: string;
  retrievedAt: string;
};

export type Reconciliation = {
  companyId: string;
  assetId: string;
  beginQty: number;
  beginAsOf: string;
  endQty: number;
  endAsOf: string;
  buys: number;
  sales: number;
  rewards: number;
  adjustments: number;
  residual: number;
  note: string;
  sourceUrl: string;
};

export type NewsItem = {
  id: string;
  title: string;
  source: string;
  url: string;
  published: string | null;
  firstSeen: string;
  category: string;
  assetIds: string[];
  excerpt: string;
  summaryKo: string;
  whatsNew: string;
  route: "disclosure" | "news" | "x";
  counter: string;
};

export type SocialPost = {
  id: string;
  handle: string;
  url: string | null;
  published: string | null;
  kind: "original" | "reply" | "repost" | "unknown";
  text: string;
  summaryKo: string;
  tokens: string[];
  contracts: string[];
  disclosure: string | null;
  firstSeen: string;
};

export type MemeCandidate = {
  assetId: string;
  mention: string | null;
  firstObserved: string | null;
  authors: string[];
  originClusters: number;
  attentionNote: string;
  volume24hUsd: number | null;
  liquidityUsd: number | null;
  liquidityKind: "order-book-volume" | "dex-pool" | "unknown";
  priceReactionNote: string;
  spotVenues: string[];
  perpVenues: string[];
  contractMultiplier: number | null;
  krwListed: boolean;
  risk: string;
  reason: string;
  identityNote: string;
  poolCount: number | null;
};

export type ModuleStatus = {
  id: string;
  label: string;
  state: "live" | "snapshot" | "failed" | "partial";
  detail: string;
  checkedAt: string;
};

export type DeskSnapshot = {
  generatedAt: string;
  mode: Mode;
  warnings: { level: "info" | "warn"; scope: string; message: string }[];
  modules: ModuleStatus[];
  assets: Asset[];
  quotes: Quote[];
  candles: Record<string, Candle[]>;
  etf: {
    provenance: Provenance;
    products: EtfProduct[];
    sessions: EtfSession[];
    heat: EtfHeat[];
    milestones: EtfMilestone[];
    coverageNote: string;
  };
  dat: {
    provenance: Provenance;
    holdings: CompanyHolding[];
    disclosures: Disclosure[];
    reconciliations: Reconciliation[];
    coverageNote: string;
  };
  news: NewsItem[];
  social: {
    provenance: Provenance | null;
    posts: SocialPost[];
    blockedReason: string | null;
  };
  memes: MemeCandidate[];
  krwPerUsdt: number | null;
};
