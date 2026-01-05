export type StockQuote = {
  symbol: string;
  price: number | null;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
  currency: string | null;
  marketTime: string | null;
  exchangeName: string | null;
  shortName: string | null;
  longName: string | null;
};
