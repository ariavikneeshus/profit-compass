import { useMemo, useState } from 'react';
import { Search, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStockQuote } from './useStockQuote';

const SUGGESTED = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'ITC'];

function formatMoney(value: number | null, currency: string | null) {
  if (value === null || Number.isNaN(value)) return '—';
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return value.toFixed(2);
  }
}

function formatPct(value: number | null) {
  if (value === null || Number.isNaN(value)) return '—';
  return `${value.toFixed(2)}%`;
}

export default function StockDashboard() {
  const [symbol, setSymbol] = useState('RELIANCE');
  const { data, loading, fetchQuote, insight } = useStockQuote();

  const trend = useMemo(() => {
    if (!data?.changePercent && data?.changePercent !== 0) return 'flat' as const;
    return data.changePercent >= 0 ? ('up' as const) : ('down' as const);
  }, [data?.changePercent]);

  return (
    <div className="grid gap-6">
      <article className="rounded-lg border border-border bg-card shadow-elegant">
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-base font-semibold">Live NSE quote</h2>
              <p className="text-sm text-muted-foreground">
                Enter a ticker (e.g. <span className="font-medium">RELIANCE</span>) — we’ll query{' '}
                <span className="font-medium">RELIANCE.NS</span> automatically.
              </p>
            </div>

            <form
              className="flex w-full items-center gap-2 sm:w-auto"
              onSubmit={(e) => {
                e.preventDefault();
                void fetchQuote(symbol);
              }}
            >
              <label className="relative w-full sm:w-72">
                <span className="sr-only">NSE symbol</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  placeholder="RELIANCE"
                  className="w-full rounded-md border border-input bg-background px-9 py-2 text-sm outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring"
                  inputMode="text"
                  autoComplete="off"
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity disabled:opacity-60"
              >
                {loading ? 'Loading…' : 'Get quote'}
              </button>
            </form>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {SUGGESTED.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setSymbol(t);
                  void fetchQuote(t);
                }}
                className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground transition hover:opacity-90"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-border p-5 sm:p-6">
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Symbol</p>
                  <p className="text-base font-semibold">{data?.symbol ?? '—'}</p>
                </div>

                <div
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold',
                    trend === 'up' && 'border-accent/30 bg-accent/10 text-foreground',
                    trend === 'down' && 'border-primary/30 bg-primary/10 text-foreground',
                    trend === 'flat' && 'border-border bg-secondary text-secondary-foreground'
                  )}
                >
                  {trend === 'up' ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : trend === 'down' ? (
                    <TrendingDown className="h-4 w-4" />
                  ) : null}
                  <span>{insight?.label ?? '—'}</span>
                </div>
              </div>

              <div className="mt-5 grid gap-3 rounded-lg border border-border bg-background p-4">
                <div className="flex items-baseline justify-between gap-4">
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="text-lg font-semibold">{formatMoney(data?.price ?? null, data?.currency ?? 'INR')}</p>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <p className="text-sm text-muted-foreground">Change</p>
                  <p className="text-sm font-semibold">
                    {data?.change === null || data?.change === undefined
                      ? '—'
                      : `${data.change >= 0 ? '+' : ''}${data.change.toFixed(2)}`}{' '}
                    <span className="text-muted-foreground">({formatPct(data?.changePercent ?? null)})</span>
                  </p>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <p className="text-sm text-muted-foreground">Updated</p>
                  <p className="text-sm font-medium">
                    {data?.marketTime ? new Date(data.marketTime).toLocaleString('en-IN') : '—'}
                  </p>
                </div>
              </div>
            </div>

            <aside className="rounded-lg border border-border bg-secondary p-4 text-secondary-foreground">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Note</p>
              <p className="mt-2 text-sm leading-relaxed">
                This is a lightweight signal (up/down/flat) based on today’s change %. If you want a real
                model-based forecast (LSTM/XGBoost) we can add a backend pipeline next.
              </p>
            </aside>
          </div>
        </div>
      </article>

      <article className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground shadow-elegant">
        <h3 className="text-sm font-semibold text-foreground">How to use</h3>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Type an NSE ticker (we’ll append .NS automatically).</li>
          <li>Press “Get quote” to fetch the latest available market price.</li>
          <li>Use the bias chip as a quick directional read (not a prediction).</li>
        </ol>
      </article>
    </div>
  );
}
