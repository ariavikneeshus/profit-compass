import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { StockQuote } from './types';

type State = {
  loading: boolean;
  data: StockQuote | null;
};

export function useStockQuote() {
  const [state, setState] = useState<State>({ loading: false, data: null });

  const fetchQuote = useCallback(async (symbol: string) => {
    const clean = symbol.trim();
    if (!clean) return;

    setState((s) => ({ ...s, loading: true }));

    const { data, error } = await supabase.functions.invoke('fetch-indian-stocks', {
      body: { symbol: clean },
    });

    if (error) {
      setState((s) => ({ ...s, loading: false }));
      toast.error('Failed to fetch quote', {
        description: error.message,
      });
      return;
    }

    setState({ loading: false, data: data as StockQuote });
  }, []);

  const insight = useMemo(() => {
    if (!state.data?.changePercent && state.data?.changePercent !== 0) return null;
    const cp = state.data.changePercent;
    if (cp >= 0.75) return { label: 'Bullish bias', tone: 'up' as const };
    if (cp <= -0.75) return { label: 'Bearish bias', tone: 'down' as const };
    return { label: 'Neutral bias', tone: 'flat' as const };
  }, [state.data?.changePercent]);

  return {
    ...state,
    fetchQuote,
    insight,
  };
}
