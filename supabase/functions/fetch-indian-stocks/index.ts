/// <reference lib="deno.ns" />

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "content-type": "application/json; charset=utf-8",
    },
  });
}

function normalizeSymbol(input: string) {
  const s = input.trim().toUpperCase();
  // Allow Yahoo-style symbols: RELIANCE, RELIANCE.NS, ^NSEI, etc.
  const safe = s.replace(/\s+/g, "");
  if (!safe.includes(".") && !safe.startsWith("^")) return `${safe}.NS`;
  return safe;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    // ignore
  }

  const rawSymbol = String(body?.symbol ?? "").trim();
  if (!rawSymbol) {
    return json({ error: "symbol is required" }, 400);
  }

  const symbol = normalizeSymbol(rawSymbol);
  console.log(`[fetch-indian-stocks] request symbol=${symbol}`);

  const url = new URL(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`
  );
  url.searchParams.set("range", "1d");
  url.searchParams.set("interval", "5m");

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ProfitCompass/1.0)",
        Accept: "application/json,text/plain,*/*",
      },
    });
  } catch (e) {
    console.error("[fetch-indian-stocks] fetch failed", e);
    return json({ error: "Upstream request failed" }, 502);
  }

  const text = await res.text();
  if (!res.ok) {
    console.error(
      `[fetch-indian-stocks] upstream status=${res.status} body=${text.slice(0, 400)}`
    );
    return json({ error: "Failed to fetch quote" }, 502);
  }

  let payload: any;
  try {
    payload = JSON.parse(text);
  } catch (e) {
    console.error("[fetch-indian-stocks] JSON parse error", e);
    return json({ error: "Invalid upstream response" }, 502);
  }

  const result = payload?.chart?.result?.[0];
  const meta = result?.meta;

  if (!meta) {
    console.warn("[fetch-indian-stocks] no meta in response");
    return json({ error: "No data found" }, 404);
  }

  const price = typeof meta?.regularMarketPrice === "number" ? meta.regularMarketPrice : null;
  const previousClose =
    typeof meta?.previousClose === "number"
      ? meta.previousClose
      : typeof meta?.chartPreviousClose === "number"
        ? meta.chartPreviousClose
        : null;

  const change =
    typeof price === "number" && typeof previousClose === "number"
      ? price - previousClose
      : typeof meta?.regularMarketChange === "number"
        ? meta.regularMarketChange
        : null;

  const changePercent =
    typeof change === "number" && typeof previousClose === "number" && previousClose !== 0
      ? (change / previousClose) * 100
      : typeof meta?.regularMarketChangePercent === "number"
        ? meta.regularMarketChangePercent
        : null;

  const marketTime =
    typeof meta?.regularMarketTime === "number"
      ? new Date(meta.regularMarketTime * 1000).toISOString()
      : null;

  const response = {
    symbol: String(meta?.symbol ?? symbol),
    price,
    previousClose,
    change,
    changePercent,
    currency: meta?.currency ?? "INR",
    marketTime,
    exchangeName: meta?.exchangeName ?? null,
    shortName: meta?.shortName ?? null,
    longName: meta?.longName ?? null,
  };

  console.log(
    `[fetch-indian-stocks] ok symbol=${response.symbol} price=${response.price} changePct=${response.changePercent}`
  );

  return json(response);
});
