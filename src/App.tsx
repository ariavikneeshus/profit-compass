import { Toaster } from 'sonner';
import StockDashboard from '@/features/stocks/StockDashboard';

export default function App() {
  return (
    <div className="min-h-dvh">
      <Toaster richColors position="top-center" />

      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
          <div className="flex flex-col">
            <p className="text-xs tracking-widest text-muted-foreground">PROFIT COMPASS</p>
            <h1 className="text-balance text-lg font-semibold">Indian Stock Predictor (NSE)</h1>
          </div>
          <p className="hidden text-sm text-muted-foreground sm:block">
            Quotes via public market data • Not financial advice
          </p>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-5xl px-5 py-8">
          <StockDashboard />
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-5xl px-5 py-6 text-xs text-muted-foreground">
          Data can be delayed. Always verify with your broker.
        </div>
      </footer>
    </div>
  );
}
