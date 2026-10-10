# Grok Build — Crypto Investor Desk
## Zero-base product and implementation prompt | 2026-10-10 | Standalone

Build a useful cryptocurrency investment research website, not an evidence-management console, static mockup, documentation portal, or another proposal. This prompt replaces the previous Crypto Evidence & Signal Desk specification. Redesign the product and information architecture; reuse sound code only inside the project explicitly selected for this task. Do not touch unrelated projects or erase existing user records.

The user needs to discover and compare coins, understand ETF and corporate treasury demand, follow meaningful statements and news, research meme coins including posts by @theunipcs, and maintain a practical watchlist. Korean UI and analysis; original-language excerpts alongside Korean translations. USD comparisons, optional KRW context, Asia/Seoul display, UTC storage. Research horizons: tactical 1 day–4 weeks and strategic 1–3 years. No order execution, wallet connection, seed phrases, or withdrawal/trading permissions.

## 1. What success looks like

A user must be able to:
1. Open Home and identify what changed, which coins deserve review, and why.
2. Click any coin to see price reaction, relevant ETF/DAT activity, catalysts, risk, and original evidence together.
3. Compare daily ETF flows and inspect a product's application/listing history.
4. Compare corporate holdings and distinguish purchases, sales, rewards, and financing intentions.
5. Follow a meme mention into the correct token's actual markets and risk context.
6. Save a research candidate, define an invalidation/alert condition, and revisit the original evidence later.

These workflows—not the number of widgets, metadata fields, tests, or generated documents—are the product acceptance criteria. A site containing only price quotes, empty ETF/DAT/social tables, and setup notices is incomplete. Truthful failure messages are necessary, but are not a substitute for working features.

## 2. Product navigation and design

Implement these primary destinations:
- `/` 오늘의 투자판 — today's changes and review candidates.
- `/coins` 코인 탐색; `/coins/:assetId` shared coin research page.
- `/etf` ETF 자금·일정 — flows, product directory, lifecycle/calendar.
- `/dat` 기업 코인 보유 — by coin/by company; company detail.
- `/meme` 밈 레이더 — practical candidates, early discovery, KOL tracking.
- `/intel` 뉴스·주요인물 — deduplicated events and separate account timelines.
- `/watch` 관심·알림 — saved candidates, conditions, decision notes.
- `/settings` — small bottom navigation item for connections, refresh history, coverage and usage.

Use a desktop-first research terminal layout: compact left navigation, persistent top search/filter bar, readable tables, restrained light/dark themes, tabular numbers and clear spacing. At 1440×900 the first viewport must contain actual research content, not a giant title, hero, setup wizard or wall of status badges. Support 1280-wide and mobile layouts without overlapping controls. Hide optional columns or provide contained horizontal scrolling. Use text and icons as well as color.

Global controls: asset search, all tracked assets/watchlist, tactical/strategic horizon, date window, refresh. Keep filters in URL state; preserve them when returning from detail. Display units, exact window and as-of date. Every meaningful number opens its contributing records; every event opens original evidence and related entities. Put operational detail in drawers/settings. Show a prominent warning only for a material security, market-access, or data problem affecting the current decision.

## 3. Home and coin-centric analysis

Home composition, top to bottom:
A. One compact market strip: BTC/ETH price and 24h change, selected venue activity, plus funding/OI context when available. This is context, not a generic price homepage.
B. Main two-column area: approximately two-thirds review-candidate table, one-third upcoming catalysts/new material events.
C. Two compact panels: institutional-flow changes and meme-attention changes.
D. A small coverage/last-refresh footer. Partial modules must not replace functioning panels with full-page error screens.

Candidate table default columns: coin; 24h/7d price change; new material change; why review now; review status; save button. Keep numeric ETF/DAT/liquidity columns available through column selection and the full explorer. Do not manufacture candidates to fill a quota. Default to at most ten qualifying candidates, then show all. Show saved assets separately even when no rule fired.

The explorer adds sortable ETF 1-session/5-session net flow, disclosed DAT changes over 30 calendar days, latest catalyst, venue/liquidity availability, and risk. Inapplicable ETF/DAT coverage is N/A, not a negative score. Filter by theme, market-cap range, venue, ETF coverage, DAT ownership, new event and watchlist. Compare up to four coins with aligned units and periods.

The shared coin page is the core product. Include:
- Identity, aliases, verified chain/contract, market venues and saved status.
- Price/candlestick and volume chart, timeframe controls, relative return against BTC where meaningful, and event markers. Use separate aligned panels for price, ETF daily flows and DAT disclosed holdings; never imply causation through a dual-axis visual.
- A short thesis panel: observed change; possible transmission to demand/supply; competing explanation; observed price reaction; next condition to check; invalidation.
- Tabs for ETF, DAT, market/liquidity, meme/social, news/catalysts, and notes, reusing the same underlying records as specialist pages.
- “Add to watchlist,” “Create condition,” “Compare,” and “Open source.” No decorative buttons.

For event reaction, show returns since publication and since first system observation separately when data resolution permits. Also show pre-event movement over the chosen comparable window. Do not label an unresponsive price as “not priced in”: report the actual measured reaction and the uncertainty. An official deadline must remain separate from a speculative expected date.

## 4. ETF desk: daily money and product lifecycle

Make discovery global and extensible; prioritize usable US flow coverage first. Enumerate available products from the chosen sources rather than hard-coding BTC/ETH/SOL/XRP as the entire universe. Show jurisdiction, included products and unresolved coverage explicitly. Include discovery of additions, launches, withdrawals, closures and renamings; preserve point-in-time membership.

Provide three tabs:
1. **Flows:** rows by coin with expandable fund rows. Latest source session, net flow, 5/20 trading-session cumulative, 7/30 calendar-day options, prior-window comparison, positive/negative issuer breadth, and reporting-fund count. Include a coin×session heatmap and daily/cumulative charts. Display partial totals and their missing contributors without declaring a complete reversal or streak from missing sessions.
2. **Products:** issuer, fund/ticker, jurisdiction, exposure type, underlying asset, launch/trading state, AUM and source. Separate spot, futures, leveraged/inverse, options-income, multi-asset and equity proxies.
3. **Lifecycle/calendar:** last verified change, relevant filing links, effectiveness/listing/trading milestones, next verified date, uncertainty and completed events. Model legal status dimensions separately; a friendly summary label is not a universal linear legal workflow. Generic-listing-eligible products must not be forced into a fictional individual 19b-4 schedule.

Use net creation/redemption flow as the default meaning of “daily inflow/outflow.” Gross inflows/outflows appear only when actually supplied. AUM change and ETF exchange turnover are not net flow; flow is not proof of immediate unhedged spot buying. Keep currency/FX, fund-session dates, provisional/revised values and multi-asset allocations explicit. Do not double-count ETF exposure in corporate totals. Holidays are not zero-flow sessions.

## 5. DAT desk: who holds coins and what actually changed

Provide both **coin-first** and **company-first** views. Discover a broader directory while initially completing usable histories for Strategy/MSTR and Bitmine/BMNR. Add verified records for Metaplanet, Strive, Sharplink, DeFi Development Corp and other discovered companies. Keep miners/operating companies separate from treasury-focused businesses; exclude governments and customer custody from corporate-owned totals.

Main table: company/ticker; coin; latest disclosed quantity; previous comparable quantity; net change and percentage; disclosed-period dates; supply share with denominator; valuation timestamp; acquisition/sale/reward classification; latest financing event; as-of/source. A company's multiple assets require separate rows or expansion, not a single primary-coin shortcut.

Coin-group totals must disclose company coverage and the range of holdings dates. Summing last-known holdings from different dates is a latest-known composite, not a synchronized balance. Calendar-window totals mean events disclosed in that window unless actual transaction dates are known; never distribute weekly disclosures into daily buys.

Company detail: holdings step chart, purchases/sales/rewards timeline, disclosed average acquisition costs, capital-capacity summary, and linked principal statements. Reconcile beginning balance + buys − sales + rewards + disclosed adjustments = ending balance; expose unexplained residuals. Staking is not extra ownership; internal transfers are not new purchases.

Capital summary distinguishes financing authorization, execution, net cash raised and crypto acquired. Show available cash, material obligations and policy changes where verified. Put detailed dilution, token-per-share and formula-defined mNAV in an expandable advanced view: useful for financing capacity, not a mandatory home-screen equity valuation model. Do not permanently hard-code any holding amount, purchase target or buying cap.

## 6. Meme radar: attention connected to tradable markets

Make this a first-class destination, not a small news subsection. Seed the user-requested account @theunipcs without assuming investment skill or assigning wallets to it. Discover and verify the account's actual token references; do not invent a current recommendation list.

Three views:
- **Practical candidates:** configurable USD-M perpetual availability filter ON by default, alongside actual spot availability. Availability is not a leverage recommendation or a guarantee that the user can trade there.
- **Early discovery:** separate pool without the futures requirement, so the site does not erase newly emerging DEX candidates. Label the greater information/liquidity uncertainty.
- **KOL timeline:** posts, original/reply/repost distinction, position/sponsorship disclosure when present, Korean summary and original link.

Candidate columns: verified token identity; first observed mention; tracked authors/origin clusters; attention change; 24h volume and available liquidity/depth; price reaction since observation; spot/perpetual venues; funding/OI when comparable; Korean-market status; risk; review reason.

Use chain+contract/mint and verified venue mappings, including 1,000-token contract multipliers. Aggregate DEX pools without duplicates; distinguish pool liquidity from executable order-book depth. Do not equate DEX transaction counts with unique people or all reported volume with genuine demand. Social metrics must name the observed sample and measurement window. Ranked search hits are not global mention counts. No history means “baseline building,” not a fabricated spike.

Show mint/freeze/admin or equivalent chain-specific risks, supply/holder concentration with labeled exclusions, liquidity uncertainty, paid promotion and trading restrictions when genuinely sourced. Unknown checks remain unknown. DEX Screener Boosts must be labeled paid visibility. Checks do not prove safety; never execute transactions as a test.

Korean catalysts: verified KRW/BTC/USDT market availability, official listing/market-addition notices, trading start, warning/delisting and deposit/withdrawal information. Potential KRW-market addition remains a hypothesis. Compute Korean premium only with identical assets, synchronized quotes, explicit KRW/USD conversion and USDT adjustment where relevant; distinguish indicative last-price premium from executable quotes.

## 7. News, principals and a useful review queue

Track Strategy/Michael Saylor and Bitmine/Tom Lee plus verified CEOs, financing executives and company IR accounts. Do not identify Tom Lee as CEO merely because he is the principal of interest; verify current roles. Separate his Bitmine-policy comments from Fundstrat market views. Other accounts are configurable.

Run X, official disclosures/transcripts, and external-news discovery independently. A failed X route must not cancel the other two. Cover both followed principals and coin-specific events beyond ETF/DAT topics. News categories: regulation, financing, security, listings, token supply, adoption, project catalysts and narratives. Reddit is a separately replaceable source, not a prerequisite for all social analysis.

One economic event may have multiple source links but appears once in the main feed. Preserve company-reported claims versus independently established facts. Offer original excerpt, Korean summary, what is new, affected coins, potential consequence, counterargument and next check. Keep first-seen times and correction/retraction history.

Implement named, inspectable review recipes instead of an opaque buy score:
- **ETF strengthening:** complete positive latest 5-session total exceeding the preceding comparable 5-session total. Explain the actual values; otherwise no qualifying label.
- **DAT action:** a newly disclosed executed acquisition/sale or documented policy/financing change, with purchase/reward distinction.
- **Catalyst:** newly verified filing milestone, launch/listing or project event with a direct asset link.
- **Meme attention/liquidity:** a stable observed sample with at least three distinct observed authors from distinct origin clusters, current 24h mentions at least twice the median of the previous seven comparable complete windows, and an independently recorded market-liquidity/volume observation. The liquidity observation is context, not proof of organic demand. Without the baseline, show a new-mention watch item instead of a spike.

These are editable research heuristics, not calibrated predictions. Sort urgent verified risks to watched assets first, then new verified material events, then corroborated watch candidates, then other saved assets; break ties by event recency. Deduplicate shared evidence. Display the rule/version and reason. Use review states such as “우선 검토,” “관찰,” “조건 대기,” “위험 점검,” and “자료 부족”; absence of new events is distinct from missing data. No forced buy/sell verdict.

Support user-defined watch/alert conditions with explicit field, comparator, value, window and data prerequisite. Separate research invalidation notes from executable alert predicates. Save, edit, snooze, dismiss and show change since last visit. A correction must update the review item and any affected alert.

## 8. Real data plan: choose working routes, not vague providers

Inspect the current app runtime briefly and use its supported stack. Prefer TypeScript/React when native. Reuse supported secrets, server actions, storage and deployment rather than introducing a second platform. Distinguish build-time browsing from a deployed app's runtime capabilities.

Use this concrete source plan; verify current documentation and actual entitlement, then implement the selected adapter:
- Market candles/quotes/venue metadata: official Upbit and Binance market-data routes; DEX Screener for identified DEX tokens. Use only endpoints accessible to this environment and label venue coverage.
- ETF numeric feed: SoSoValue's documented ETF API when an authorized key provides the required fields; Farside for permitted source comparison or sourced snapshot acquisition. Do not invent a Farside API. Validate fund lists, units and response methods against actual documentation rather than marketing/sample figures.
- ETF lifecycle: regulator/EDGAR filings, exchange notices and issuer pages. Fetch SEC data through the backend, not browser-only cross-origin code.
- DAT: official company holdings disclosures first for the initial companies; CoinGecko's documented treasury/entity/history APIs if the authorized plan supports them for expansion and comparison. Never copy numbers from API examples as current holdings.
- Social: actual authorized Grok/X Search or X API access; official web/news routes remain independent. Native app model access is not proof of runtime X Search entitlement.
- Korean notices: official exchange notices; Upbit's announcement stream requires authenticated private WebSocket access under its current documentation. Do not assume a public unauthenticated historical feed. Use permitted official-page discovery if no streaming credential exists.
- Reddit: use a permitted access method compatible with its current Developer Platform/API transition. Do not build a dependency on unauthenticated JSON/RSS scraping or claim complete coverage from web-search excerpts.

Use source adapters behind a small stable internal API. Minimum records: assets/venue mappings, market series, ETF products/flows/milestones, DAT disclosures, events/social observations, watch conditions and refresh runs. Records preserve source URL, as-of/publication/first-seen/retrieval times, units, value or null, revision and provenance class. Use precision-safe arithmetic. Unknown, zero, inapplicable, partial, stale and failed retrieval must remain distinct.

Prefer persistent server storage and cache; one collector per source. The website reads these records. Bot consumes the same snapshot and may submit validated attributed events; Bot integration is optional and must not be needed to use the site's existing data. Provide authenticated JSON import/export as a secondary interoperability route, not the primary product. Keep arithmetic and rule evaluation in code; AI writes attributed interpretations, not numeric truth.

## 9. First usable release and graceful degradation

Do not open an empty production shell and call it finished. Before handoff, attempt a real initial acquisition for every core workflow:
- Real market data for at least BTC and ETH and discovered meme candidates with valid identity.
- Latest obtainable actual ETF sessions plus available historical rows and at least one sourced lifecycle record.
- At least two comparable disclosed holdings records for MSTR and BMNR when retrievable; no fabricated history if not.
- Recent retrievable original principal/news and @theunipcs items, with independent route results.

Use live refresh where supported. Where automatic refresh is not yet connected, a genuine, lawfully obtained build-time snapshot may populate the page with a permanent snapshot/as-of label and working source links. Snapshots are not mock data and must never be presented as live. Missing historical data disables only the dependent statistic. Unavailable social content is not evidence of no posts.

For an unmet credential dependency, provide one precise settings action stating the provider, required secret and feature it unlocks. Preserve useful data in the meantime. Do not let one source failure blank unrelated modules. Do not mark a blocked workflow complete; report the release as partially connected. If no permitted real data can be obtained, deliver the functioning code and clearly report the failed data acceptance—never fabricate data to satisfy a quota.

Refresh defaults: cache selected market data approximately 60 seconds while viewed, batch watched assets, collect disclosures/news at a configurable low frequency only if a real worker exists, and refresh ETF data around actual reporting availability. Use provider rate limits and bounded retries. A browser timer is foreground-only. Show whether alerts work only while the app is open or through a verified background worker. No automatic paid subscription, unapproved overage, or unlimited LLM polling.

## 10. Implementation order and acceptance

Implement in complete user-visible slices, continuing without asking whether to proceed:
1. Home, explorer and shared coin page with real market data, source drawer and persistent watch actions.
2. ETF flow/lifecycle and DAT histories feeding those same coin pages and Home.
3. Meme radar, independent principal/news routes, event links and review recipes.
4. Conditions/alerts, comparison, refresh/settings and quality checks.

Keep advanced mNAV, broad unlock/onchain attribution, complex macro models and extensive backtesting out of the critical path. Add verified material supply/security events to existing timelines now; do not create ten empty advanced dashboards. Complete core ETF/DAT/social workflows before expanding decorative features.

Run build/type checks and applicable unit/integration tests. Test zero/missing flows, partial sessions, holidays, supply denominators, reward-versus-purchase reconciliation, revised disclosures, contract collisions, social sample insufficiency and duplicate alerts. Treat external content as untrusted data; sanitize output, keep secrets server-side, protect writes and private notes, prevent unsafe arbitrary URL fetching and CSV formula injection. Do not publish the user's private research or enable unapproved external delivery.

Run actual browser checks, if the environment supports them, at desktop and mobile widths. Verify:
- Home → coin → original evidence → save → refresh → saved item persists.
- ETF coin total → contributing funds/session → lifecycle evidence.
- DAT company → two disclosures → reconciled change → linked coin.
- Meme post → correct contract → actual venue → review condition.
- Failed X plus successful non-X keeps news visible; failed provider retains a dated snapshot where available.
- A revised source changes the dependent metric/review item without double-counting.
- All buttons, filters, chart tooltips and back navigation work.

Use fixture data only in isolated test/demo mode, never as production content. Fixture passes are not live-access passes. Label browser checks that could not run.

Return the working app/code and a short feature-by-feature handoff: implemented; real-data test passed; snapshot-only; blocked with exact activation step; actual alert execution mode. Include the tested preview/deployment location only when it exists. Do not lead with a capability manifest or a long compliance report. Do not claim completion because one price-data request worked. The final result must prioritize a usable investment workflow and expose precisely what still cannot operate.

## Documentation starting points

These are documentation/source routes, not a guarantee of the user's entitlement. Resolve exact endpoint schemas from the current official documentation.
- https://x.ai/news/grok-build-for-everyone
- https://docs.x.ai/developers/tools/x-search
- https://docs.x.ai/grok-bot/skills-routines-and-automations
- https://sosovalue.com/developer
- https://sosovalue-1.gitbook.io/sosovalue-api-doc
- https://farside.co.uk/btc/
- https://www.sec.gov/search-filings/edgar-application-programming-interfaces
- https://www.sec.gov/newsroom/press-releases/2025-121-sec-approves-generic-listing-standards-commodity-based-trust-shares
- https://www.strategy.com/ledger
- https://www.bitminetech.io/
- https://www.coingecko.com/en/api/treasuries
- https://docs.coingecko.com/reference/entities-list
- https://docs.dexscreener.com/api/reference
- https://docs.dexscreener.com/boosting
- https://docs.upbit.com/kr/reference/websocket-announcement
- https://developers.binance.com/en/docs/catalog/core-trading-derivatives-trading-usd-s-m-futures/api/rest-api/market-data
- https://developers.reddit.com/app-registration
- https://redditinc.com/policies/data-api-terms
