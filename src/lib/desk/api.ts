import { createServerFn } from "@tanstack/react-start";

export const getDesk = createServerFn({ method: "GET" }).handler(async () => {
  const { loadDesk } = await import("./load.server");
  return loadDesk("no");
});

export const refreshMarket = createServerFn({ method: "POST" }).handler(async () => {
  const { loadDesk } = await import("./load.server");
  return loadDesk("market");
});

export const refreshResearch = createServerFn({ method: "POST" }).handler(async () => {
  const { loadDesk } = await import("./load.server");
  return loadDesk("research");
});

export const refreshEtfCatalog = createServerFn({ method: "POST" }).handler(async () => {
  const { loadEtfCatalog } = await import("./load.server");
  return loadEtfCatalog();
});

export const refreshSocial = createServerFn({ method: "POST" }).handler(async () => {
  const { loadSocial } = await import("./load.server");
  return loadSocial();
});
