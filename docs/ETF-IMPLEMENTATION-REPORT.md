# Crypto ETF implementation report

## Root cause

The previous ETF screen derived its universe exclusively from secondary daily-flow rows. The saved snapshot contained 37 products across BTC (12), ETH (11), SOL (9), and XRP (5), with no lifecycle/application registry. The collector had an `ETF_ASSET` map and reverted to a four-symbol array when its index failed; the UI could not discover a filing without a flow row. The restriction was therefore the ingestion/fallback and data contract, not four hardcoded React asset buttons or a database limitation.

## Architecture and changed files

| Files | Change |
| --- | --- |
| `src/lib/desk/types.ts` | Add compatible optional `etf.catalog`, explicit lifecycle/exposure types, constituents, multi-asset mandate, stable identifiers, unknown fields, and dated primary evidence. Existing flow/session types remain intact. |
| `src/lib/desk/etf.ts` | Normalize/validate records, reconcile stable identities and dated conflicts, classify lifecycle sections, discover/sort groups, calculate counts, and combine search/filters. Multi-asset grouping preserves leverage/inverse exposure. |
| `src/lib/desk/etf.server.ts` | Merge bundled records with measured flow identities; discover missing assets without inventing market pairs; verify configured feed evidence against fetched primary documents and preserve earlier records after failures. |
| `src/lib/desk/api.ts`, `load.server.ts` | Add POST `refreshEtfCatalog`; attach the catalog during snapshot loading/research refresh and maintain the server cache. |
| `src/lib/desk/collect.server.ts`, `parse.ts` | Remove symbol whitelist/four-asset fallback, discover source slugs dynamically, retain prior measurements after partial failures, and stop interpreting secondary rows as verified spot exposure. |
| `src/components/etf-catalog.tsx`, `src/routes/_desk/etf.tsx` | Dynamic grouped overview, approved/trading, applications, historical and unverified sections; asset/issuer/exposure/status filters, search, evidence details, freshness and scope warnings; desktop tables/mobile cards and server refresh. Keep flows/calendar and the old products URL alias. |
| `src/routes/_desk/coins/index.tsx`, `coins/$assetId.tsx`, `_desk/index.tsx` | Catalog-aware single-asset ETF presence and details, separate flow applicability, and preserved dashboard navigation directly to flows. |
| `src/data/etf-catalog.json`, `etf-listing-exclusions.json` | Reviewed US product/filing registry and identity-specific exclusions for indirect corporate-equity/mining/industry funds. |
| `scripts/import-etf-catalog.mjs`, `discover-etf-listings.mjs` | Reusable reviewed-import and official-listing discovery commands; preserve existing identities and save uncertain candidates separately. |
| `src/lib/desk/etf.test.ts`, `etf.server.test.ts`, `scripts/discover-etf-listings.test.mjs`, `package.json` | Add lifecycle, grouping, deduplication, validation, refresh and discovery tests to the standard test command. |
| `docs/ETF-CATALOG.md`, this report | Document source maintenance, feed configuration, scope, evidence and validation. |

No database migration, new authentication flow or destructive data replacement was introduced. Synthetic test fixtures are not loaded by the application.

## Coverage in the reviewed registry

**US scope: 248 registry records; 37 single-asset groups and 46 named underlying identities including basket-only constituents.** There are 172 approved/trading products across 18 single-asset groups; 57 dated application events across 30 single-asset groups; 18 historical entries (14 application withdrawals and 4 exchange-removal notices); and 1 unverified record (Grayscale Ethereum Premium Income ETF / ETPI). Approved product totals include multi-asset and unidentified-underlying products, but asset-group totals exclude both.

Counts below describe saved evidence, not exhaustive current market totals. Applications mean filing/amendment events as of each document date; they do not establish that the application remains under active regulatory review today. Historical withdrawals and `delisting_filed` exchange-removal notices are separate. A Form 25 filing does not establish completed liquidation or an effective delisting. A 0 is zero matching records in this registry, not proof that the asset has no other product or filing.

| Single asset / separate category | Approved/trading | Applications | Historical | Unverified |
| --- | ---: | ---: | ---: | ---: |
| AAVE (Aave) | 0 | 1 | 0 | 0 |
| ADA (Cardano) | 2 | 1 | 1 | 0 |
| APT (Aptos) | 0 | 1 | 0 | 0 |
| AVAX (Avalanche) | 4 | 1 | 0 | 0 |
| AXL (Axelar) | 0 | 0 | 1 | 0 |
| BCH (Bitcoin Cash) | 0 | 1 | 0 | 0 |
| BNB | 1 | 3 | 0 | 0 |
| BONK (Bonk) | 0 | 2 | 0 | 0 |
| BTC (Bitcoin) | 69 | 4 | 2 | 0 |
| CC (Canton Coin) | 0 | 2 | 0 | 0 |
| CRO (Cronos) | 0 | 2 | 0 | 0 |
| DOGE (Dogecoin) | 5 | 1 | 1 | 0 |
| DOT (Polkadot) | 1 | 0 | 1 | 0 |
| ETH (Ethereum) | 26 | 0 | 1 | 1 |
| HBAR (Hedera) | 1 | 0 | 1 | 0 |
| HYPE (Hyperliquid) | 4 | 0 | 0 | 0 |
| INJ (Injective) | 0 | 2 | 0 | 0 |
| JITOSOL (Jito Staked SOL) | 0 | 1 | 0 | 0 |
| LINK (Chainlink) | 4 | 1 | 0 | 0 |
| LTC (Litecoin) | 1 | 2 | 1 | 0 |
| MOG (Mog Coin) | 0 | 1 | 0 | 0 |
| MOVE (Movement) | 0 | 1 | 0 | 0 |
| NEAR (NEAR Protocol) | 1 | 1 | 0 | 0 |
| ONDO (Ondo) | 0 | 1 | 0 | 0 |
| PEPE (Pepe) | 0 | 1 | 0 | 0 |
| SEI (Sei) | 0 | 2 | 0 | 0 |
| SOL (Solana) | 15 | 0 | 3 | 0 |
| STETH (Lido Staked Ether) | 0 | 1 | 0 | 0 |
| SUI (Sui) | 5 | 3 | 0 | 0 |
| TAO (Bittensor) | 0 | 1 | 0 | 0 |
| TRUMP (Official Trump) | 0 | 3 | 0 | 0 |
| TRX (TRON) | 1 | 1 | 0 | 0 |
| UNI (Uniswap) | 0 | 1 | 0 | 0 |
| WLD (Worldcoin) | 0 | 1 | 0 | 0 |
| XLM (Stellar) | 2 | 1 | 0 | 0 |
| XRP | 12 | 0 | 3 | 0 |
| ZEC (Zcash) | 1 | 3 | 0 | 0 |
| Multi-asset / basket (separate) | 14 | 10 | 3 | 0 |
| Underlying unidentified (separate) | 3 | 0 | 0 | 0 |
| **Total records** | **172** | **57** | **18** | **1** |

Basket-only named constituents: **CTX, ICP, PENGU, POL, PUDGY-PENGUINS-NFT, RENDER, SHIB, TON, WLFI**. These are constituent identities (including an explicitly identified NFT category), not additional single-coin ETF groups. Seven listed products have unknown constituent lists: BEGS, BLOX, KRYP, SATO, TKNZ, TTOP and TXBC; verified multi-asset mandates remain in the basket group, while unspecified mandates remain in the unidentified-underlying group.

The runtime also preserves unmatched secondary flow rows as unverified observations. With the current saved snapshot, all **37** original flow products match registry identities, so `catalogWithFlows` adds **0** secondary-only records: normalized and runtime totals both remain **248**. Existing flow/AUM/session values are not replaced by catalog status or synthetic figures.

## Primary sources and freshness

- Official NasdaqTrader [Nasdaq-listed directory](https://www.nasdaqtrader.com/dynamic/SymDir/nasdaqlisted.txt) and [other-listed directory](https://www.nasdaqtrader.com/dynamic/SymDir/otherlisted.txt), published **2026-10-09**: ETF=Y, Test Issue=N, dated listing evidence. Listing does not supply a transaction price, approval date or exact exposure.
- SEC 2025–2026 indexes, registrant/series histories and original statements/prospectuses/withdrawals/Form 25 exchange-removal notices. Examples: [REX-Osprey Crypto Yield amendment](https://www.sec.gov/Archives/edgar/data/1771146/000177114626001838/etfot-rexospreycryptoindex.htm), **2026-09-17**; [ARK CoinDesk 20 registration](https://www.sec.gov/Archives/edgar/data/2106116/000121390026007058/ea027372601-s1_arkcoin20.htm), **2026-01-23**; [Grayscale Cardano withdrawal](https://www.sec.gov/Archives/edgar/data/2083106/000119312526340377/ada_rw_08072026.htm), **2026-08-07**; [REX-Osprey ESK Form 25](https://www.sec.gov/Archives/edgar/data/1771146/000141783526000182/xslF25X02/primary_doc.xml), **2026-06-26**, records an exchange-removal filing rather than its final effectiveness.
- Original issuer product materials and SEC prospectuses supply identities/exposure/constituents: examples include [Volatility Shares CRDD](https://www.volatilityshares.com/crdd), [REX BTCL](https://www.rexshares.com/btcl/), and [Canary HBR](https://canaryetfs.com/hbr/). Each registry record retains its actual source URLs, supporting excerpts and source dates.

The registry was reviewed **2026-10-10**. `statusAsOf` records the last supported dated event; `lastVerifiedAt` records document verification. Newer retrieval does not turn an old filing into today's active review. A matching primary excerpt and dated status are required; SEC registration effectiveness and generic listing standards are not individual fund approval.

Reusable updates: review and import normalized records with `scripts/import-etf-catalog.mjs`; run `scripts/discover-etf-listings.mjs` to obtain fresh directory evidence and a separate candidate report. New records automatically generate asset groups without changing React code. Runtime refresh supports server-only `ETF_CATALOG_URL` and exact allowed `ETF_CATALOG_HOSTS`, then fetches/matches primary evidence with bounded requests and TLS verification. **No runtime feed is configured in this environment**. The refresh action reports that limitation and keeps the reviewed registry; runtime cache updates are process-local, while reviewed imports are durable after publication/rebuild.

## Validation

| Check | Result |
| --- | --- |
| Standard `npm test` | Passed: 204 script tests + 112 TypeScript tests = **316**. |
| ETF-specific tests | Passed: **53** (29 pure model/grouping, 17 server/refresh, 7 listing discovery). |
| `npm run typecheck` | Passed. |
| ESLint on changed implementation/test files | Passed. |
| Full `npm run lint` | Existing failure: `no-empty` in `src/lib/app-data/client.server.ts:281`; three existing Fast Refresh warnings. |
| Production build | Passed with the final 248-record registry. The existing migration step skipped because no database is configured; this change needs no database. |
| Desktop/mobile development and production smoke | Passed with the final 248-record registry: HTTP 200, visible content, no overflow or console/page/auth errors; matching body hashes and no baseline divergence. |
| Interactive UI checks | Passed: BTC/IBIT search, LTC, BCH, baskets/unidentified groups, history, ETH flows, theme, safe refresh failure and BTC detail. The final 248-record revision passed both interaction and rendering checks. |
| Live primary-document read-through | Passed: IBIT trading evidence, ARK CoinDesk 20 filing and Grayscale ADA withdrawal. |

The ETF tests cover arbitrary new assets, every lifecycle class, pending/historical separation, Form 25 filing versus completed delisting, basket and unknown grouping, leverage preservation, combined search/filters, same-product deduplication, distinct series/ticker identities, unknown fields, dated/conflicting evidence, preservation after fetch/verification failure, and non-mutating flow integration.

## Remaining limits

US scope includes ETFs/ETPs with direct crypto-linked spot, futures, leveraged/inverse, income/options and basket exposure; international markets and indirect corporate stock/mining/industry funds are outside this review. Mixed-asset mandates may also hold equities, gold or other assets. Unknown exposure, constituents/weights, issuer, ticker and lifecycle dates remain unknown rather than inferred. Products with unidentified underlyings remain in a separate group and do not increase single-asset coverage.

**Full US or global completeness is not established; `complete` remains false.** Name-based listing discovery can miss unnamed strategies; SEC index review does not resolve every fund series or subsequent lifecycle event. Dates and fields not independently supported remain visible as unknown. Discovery/import are repeatable update paths, not an automatic comprehensive freshness schedule. See [ETF-CATALOG.md](ETF-CATALOG.md) for operational details.
