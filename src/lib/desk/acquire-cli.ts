import { readFile, writeFile } from "node:fs/promises";
import { acquireDesk } from "./collect.server.ts";
import type { CompanyHolding } from "./types.ts";

const target = new URL("../../data/desk-snapshot.json", import.meta.url);
let previous: CompanyHolding[] = [];
try {
  const prev = JSON.parse(await readFile(target, "utf8")) as { dat?: { holdings?: CompanyHolding[] } };
  previous = prev.dat?.holdings ?? [];
} catch {
  previous = [];
}
const snap = await acquireDesk(process.argv[2], previous);
await writeFile(new URL("../../data/desk-snapshot.json", import.meta.url), JSON.stringify(snap));
console.log(
  JSON.stringify(
    {
      generatedAt: snap.generatedAt,
      assets: snap.assets.length,
      quotes: snap.quotes.filter((q) => q.priceUsd != null).length,
      etfProducts: snap.etf.products.length,
      sessions: snap.etf.sessions.length,
      holdings: snap.dat.holdings.length,
      disclosures: snap.dat.disclosures.length,
      reconciliations: snap.dat.reconciliations.length,
      news: snap.news.length,
      posts: snap.social.posts.length,
      memes: snap.memes.length,
      modules: snap.modules,
      warnings: snap.warnings,
    },
    null,
    2,
  ),
);
