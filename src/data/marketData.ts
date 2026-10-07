export interface MarketIndex {
  id: string;
  symbol: string;
  name: string;
  region: 'Americas' | 'Europe' | 'Asia-Pacific' | 'Global';
  badgeText: string;
  badgeColor: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  high24h: number;
  low24h: number;
  openPrice: number;
  prevClose: number;
  sparkline: number[];
  intradaySeries: {
    '1D': { time: string; value: number; volume: number }[];
    '5D': { time: string; value: number; volume: number }[];
    '1M': { time: string; value: number; volume: number }[];
    '6M': { time: string; value: number; volume: number }[];
    'YTD': { time: string; value: number; volume: number }[];
    '1Y': { time: string; value: number; volume: number }[];
    '5Y': { time: string; value: number; volume: number }[];
  };
}

export interface StockAsset {
  symbol: string;
  name: string;
  exchange: string;
  sector: 'Technology' | 'Semiconductors' | 'Financials' | 'Healthcare' | 'Consumer Discretionary' | 'Energy' | 'Industrial';
  badgeBg: string;
  badgeText: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number; // in millions
  relVolume: number;
  marketCap: number; // in billions
  peRatio: number;
  epsDiluted: number;
  epsGrowthYoY: number;
  divYield: number;
  analystRating: 'Strong Buy' | 'Buy' | 'Neutral' | 'Sell';
  sparkline: number[];
  dayLow: number;
  dayHigh: number;
  week52Low: number;
  week52High: number;
  description: string;
}

export interface SectorMetric {
  name: string;
  code: string;
  changePercent: number;
  marketCapWeight: number;
  topGainer: { symbol: string; changePercent: number };
  topLoser: { symbol: string; changePercent: number };
  volumeBillions: number;
}

export interface EconomicEvent {
  id: string;
  time: string;
  country: 'US' | 'EU' | 'JP' | 'UK' | 'CN';
  event: string;
  impact: 'High' | 'Medium' | 'Low';
  actual: string;
  forecast: string;
  previous: string;
}

export interface OrderExecution {
  id: string;
  timestamp: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'LIMIT' | 'MARKET' | 'STOP';
  qty: number;
  price: number;
  status: 'FILLED' | 'WORKING' | 'CANCELLED';
}

function generateSeries(base: number, points: number, volatility: number, trend: number, labels: string[]) {
  const result: { time: string; value: number; volume: number }[] = [];
  let current = base * (1 - trend * 0.6);
  for (let i = 0; i < points; i++) {
    const noise = (Math.sin(i * 1.7) * 0.4 + Math.cos(i * 0.9) * 0.6) * volatility * base;
    const stepTrend = (trend * base) / points;
    current = current + stepTrend + noise * 0.25;
    if (i === points - 1) current = base;
    result.push({
      time: labels[i] || `${i}`,
      value: Number(current.toFixed(2)),
      volume: Math.round(120 + Math.abs(Math.sin(i * 2.3)) * 180),
    });
  }
  return result;
}

const INTRADAY_LABELS = [
  '09:30', '09:45', '10:00', '10:15', '10:30', '10:45', '11:00', '11:15',
  '11:30', '11:45', '12:00', '12:15', '12:30', '12:45', '13:00', '13:15',
  '13:30', '13:45', '14:00', '14:15', '14:30', '14:45', '15:00', '15:15',
  '15:30', '15:45', '16:00'
];

const FIVE_DAY_LABELS = [
  'Mon 10:00', 'Mon 14:00', 'Tue 10:00', 'Tue 14:00', 'Wed 10:00', 'Wed 14:00',
  'Thu 10:00', 'Thu 14:00', 'Fri 10:00', 'Fri 12:00', 'Fri 14:00', 'Fri 16:00'
];

const MONTH_LABELS = [
  'Sep 08', 'Sep 11', 'Sep 14', 'Sep 17', 'Sep 20', 'Sep 23', 'Sep 26',
  'Sep 29', 'Oct 01', 'Oct 03', 'Oct 05', 'Oct 06'
];

export const INITIAL_INDICES: MarketIndex[] = [
  {
    id: 'SPX',
    symbol: 'S&P 500',
    name: 'Standard & Poor’s 500 Index',
    region: 'Americas',
    badgeText: '500',
    badgeColor: '#E01E37', // badge-sp500
    price: 5842.47,
    change: 48.12,
    changePercent: 0.83,
    currency: 'USD',
    high24h: 5851.20,
    low24h: 5798.10,
    openPrice: 5804.35,
    prevClose: 5794.35,
    sparkline: [5794, 5802, 5799, 5811, 5818, 5814, 5825, 5831, 5828, 5836, 5840, 5842.47],
    intradaySeries: {
      '1D': generateSeries(5842.47, 27, 0.003, 0.0083, INTRADAY_LABELS),
      '5D': generateSeries(5842.47, 12, 0.006, 0.019, FIVE_DAY_LABELS),
      '1M': generateSeries(5842.47, 12, 0.011, 0.042, MONTH_LABELS),
      '6M': generateSeries(5842.47, 12, 0.018, 0.115, ['May', 'May 15', 'Jun', 'Jun 15', 'Jul', 'Jul 15', 'Aug', 'Aug 15', 'Sep', 'Sep 15', 'Oct', 'Now']),
      'YTD': generateSeries(5842.47, 12, 0.022, 0.214, ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct 1', 'Oct 4', 'Now']),
      '1Y': generateSeries(5842.47, 12, 0.025, 0.268, ['Oct 25', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Oct 26']),
      '5Y': generateSeries(5842.47, 12, 0.04, 0.84, ['2022', 'Q2 22', '2023', 'Q2 23', '2024', 'Q2 24', '2025', 'Q2 25', '2026', 'Q2 26', 'Q3 26', 'Now']),
    }
  },
  {
    id: 'NDX',
    symbol: 'Nasdaq 100',
    name: 'US Tech 100 Index',
    region: 'Americas',
    badgeText: '100',
    badgeColor: '#0083B8', // badge-nasdaq
    price: 20489.65,
    change: 241.80,
    changePercent: 1.19,
    currency: 'USD',
    high24h: 20518.00,
    low24h: 20240.50,
    openPrice: 20280.10,
    prevClose: 20247.85,
    sparkline: [20248, 20290, 20275, 20330, 20365, 20340, 20395, 20420, 20445, 20460, 20475, 20489.65],
    intradaySeries: {
      '1D': generateSeries(20489.65, 27, 0.004, 0.0119, INTRADAY_LABELS),
      '5D': generateSeries(20489.65, 12, 0.008, 0.028, FIVE_DAY_LABELS),
      '1M': generateSeries(20489.65, 12, 0.014, 0.056, MONTH_LABELS),
      '6M': generateSeries(20489.65, 12, 0.022, 0.148, ['May', 'May 15', 'Jun', 'Jun 15', 'Jul', 'Jul 15', 'Aug', 'Aug 15', 'Sep', 'Sep 15', 'Oct', 'Now']),
      'YTD': generateSeries(20489.65, 12, 0.028, 0.254, ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct 1', 'Oct 4', 'Now']),
      '1Y': generateSeries(20489.65, 12, 0.032, 0.318, ['Oct 25', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Oct 26']),
      '5Y': generateSeries(20489.65, 12, 0.05, 1.12, ['2022', 'Q2 22', '2023', 'Q2 23', '2024', 'Q2 24', '2025', 'Q2 25', '2026', 'Q2 26', 'Q3 26', 'Now']),
    }
  },
  {
    id: 'NI225',
    symbol: 'Nikkei 225',
    name: 'Tokyo Stock Price Index',
    region: 'Asia-Pacific',
    badgeText: '225',
    badgeColor: '#1B3B6F', // badge-nikkei
    price: 39341.20,
    change: -168.45,
    changePercent: -0.43,
    currency: 'JPY',
    high24h: 39610.00,
    low24h: 39215.80,
    openPrice: 39520.00,
    prevClose: 39509.65,
    sparkline: [39510, 39540, 39480, 39460, 39490, 39420, 39380, 39410, 39370, 39355, 39325, 39341.20],
    intradaySeries: {
      '1D': generateSeries(39341.20, 27, 0.0035, -0.0043, INTRADAY_LABELS),
      '5D': generateSeries(39341.20, 12, 0.007, 0.011, FIVE_DAY_LABELS),
      '1M': generateSeries(39341.20, 12, 0.013, 0.031, MONTH_LABELS),
      '6M': generateSeries(39341.20, 12, 0.02, 0.078, ['May', 'May 15', 'Jun', 'Jun 15', 'Jul', 'Jul 15', 'Aug', 'Aug 15', 'Sep', 'Sep 15', 'Oct', 'Now']),
      'YTD': generateSeries(39341.20, 12, 0.025, 0.165, ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct 1', 'Oct 4', 'Now']),
      '1Y': generateSeries(39341.20, 12, 0.03, 0.21, ['Oct 25', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Oct 26']),
      '5Y': generateSeries(39341.20, 12, 0.045, 0.68, ['2022', 'Q2 22', '2023', 'Q2 23', '2024', 'Q2 24', '2025', 'Q2 25', '2026', 'Q2 26', 'Q3 26', 'Now']),
    }
  },
  {
    id: 'UKX',
    symbol: 'FTSE 100',
    name: 'London Financial Times 100',
    region: 'Europe',
    badgeText: '100',
    badgeColor: '#24527A', // badge-ftse
    price: 8318.92,
    change: 29.54,
    changePercent: 0.36,
    currency: 'GBP',
    high24h: 8334.50,
    low24h: 8282.10,
    openPrice: 8289.38,
    prevClose: 8289.38,
    sparkline: [8289, 8295, 8291, 8302, 8298, 8306, 8312, 8308, 8315, 8319, 8316, 8318.92],
    intradaySeries: {
      '1D': generateSeries(8318.92, 27, 0.0025, 0.0036, INTRADAY_LABELS),
      '5D': generateSeries(8318.92, 12, 0.005, 0.009, FIVE_DAY_LABELS),
      '1M': generateSeries(8318.92, 12, 0.009, 0.018, MONTH_LABELS),
      '6M': generateSeries(8318.92, 12, 0.014, 0.054, ['May', 'May 15', 'Jun', 'Jun 15', 'Jul', 'Jul 15', 'Aug', 'Aug 15', 'Sep', 'Sep 15', 'Oct', 'Now']),
      'YTD': generateSeries(8318.92, 12, 0.018, 0.089, ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct 1', 'Oct 4', 'Now']),
      '1Y': generateSeries(8318.92, 12, 0.021, 0.112, ['Oct 25', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Oct 26']),
      '5Y': generateSeries(8318.92, 12, 0.032, 0.29, ['2022', 'Q2 22', '2023', 'Q2 23', '2024', 'Q2 24', '2025', 'Q2 25', '2026', 'Q2 26', 'Q3 26', 'Now']),
    }
  },
  {
    id: 'DAX',
    symbol: 'DAX 40',
    name: 'Deutscher Aktienindex Performance',
    region: 'Europe',
    badgeText: '40',
    badgeColor: '#24527A',
    price: 19412.80,
    change: 112.30,
    changePercent: 0.58,
    currency: 'EUR',
    high24h: 19445.00,
    low24h: 19290.00,
    openPrice: 19300.50,
    prevClose: 19300.50,
    sparkline: [19300, 19318, 19325, 19340, 19335, 19360, 19375, 19390, 19385, 19402, 19408, 19412.80],
    intradaySeries: {
      '1D': generateSeries(19412.80, 27, 0.003, 0.0058, INTRADAY_LABELS),
      '5D': generateSeries(19412.80, 12, 0.006, 0.015, FIVE_DAY_LABELS),
      '1M': generateSeries(19412.80, 12, 0.011, 0.034, MONTH_LABELS),
      '6M': generateSeries(19412.80, 12, 0.016, 0.092, ['May', 'May 15', 'Jun', 'Jun 15', 'Jul', 'Jul 15', 'Aug', 'Aug 15', 'Sep', 'Sep 15', 'Oct', 'Now']),
      'YTD': generateSeries(19412.80, 12, 0.02, 0.158, ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct 1', 'Oct 4', 'Now']),
      '1Y': generateSeries(19412.80, 12, 0.024, 0.224, ['Oct 25', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Oct 26']),
      '5Y': generateSeries(19412.80, 12, 0.038, 0.54, ['2022', 'Q2 22', '2023', 'Q2 23', '2024', 'Q2 24', '2025', 'Q2 25', '2026', 'Q2 26', 'Q3 26', 'Now']),
    }
  },
  {
    id: 'DJI',
    symbol: 'Dow 30',
    name: 'Dow Jones Industrial Average',
    region: 'Americas',
    badgeText: '30',
    badgeColor: '#0083B8',
    price: 42654.18,
    change: -54.90,
    changePercent: -0.13,
    currency: 'USD',
    high24h: 42780.00,
    low24h: 42580.40,
    openPrice: 42709.08,
    prevClose: 42709.08,
    sparkline: [42709, 42725, 42695, 42680, 42710, 42690, 42670, 42660, 42675, 42650, 42648, 42654.18],
    intradaySeries: {
      '1D': generateSeries(42654.18, 27, 0.0022, -0.0013, INTRADAY_LABELS),
      '5D': generateSeries(42654.18, 12, 0.005, 0.006, FIVE_DAY_LABELS),
      '1M': generateSeries(42654.18, 12, 0.009, 0.028, MONTH_LABELS),
      '6M': generateSeries(42654.18, 12, 0.015, 0.088, ['May', 'May 15', 'Jun', 'Jun 15', 'Jul', 'Jul 15', 'Aug', 'Aug 15', 'Sep', 'Sep 15', 'Oct', 'Now']),
      'YTD': generateSeries(42654.18, 12, 0.019, 0.132, ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct 1', 'Oct 4', 'Now']),
      '1Y': generateSeries(42654.18, 12, 0.022, 0.189, ['Oct 25', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Oct 26']),
      '5Y': generateSeries(42654.18, 12, 0.035, 0.48, ['2022', 'Q2 22', '2023', 'Q2 23', '2024', 'Q2 24', '2025', 'Q2 25', '2026', 'Q2 26', 'Q3 26', 'Now']),
    }
  }
];

export const INITIAL_STOCKS: StockAsset[] = [
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    exchange: 'NASDAQ',
    sector: 'Semiconductors',
    badgeBg: '#089981',
    badgeText: 'NV',
    price: 138.60,
    change: 4.82,
    changePercent: 3.60,
    volume: 68.4,
    relVolume: 1.42,
    marketCap: 3398.5,
    peRatio: 54.8,
    epsDiluted: 2.53,
    epsGrowthYoY: 108.4,
    divYield: 0.03,
    analystRating: 'Strong Buy',
    sparkline: [133.78, 134.2, 134.9, 135.4, 135.1, 136.3, 136.9, 137.4, 137.1, 137.9, 138.2, 138.60],
    dayLow: 133.90,
    dayHigh: 139.25,
    week52Low: 75.60,
    week52High: 140.76,
    description: 'Designs and accelerates full-stack computing infrastructure, data center GPUs, and AI foundational systems.'
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    exchange: 'NASDAQ',
    sector: 'Technology',
    badgeBg: '#131722',
    badgeText: 'AP',
    price: 231.78,
    change: 2.64,
    changePercent: 1.15,
    volume: 42.1,
    relVolume: 0.96,
    marketCap: 3524.0,
    peRatio: 34.9,
    epsDiluted: 6.64,
    epsGrowthYoY: 8.2,
    divYield: 0.44,
    analystRating: 'Buy',
    sparkline: [229.14, 229.5, 229.2, 229.9, 230.3, 230.1, 230.8, 231.2, 231.0, 231.4, 231.6, 231.78],
    dayLow: 228.85,
    dayHigh: 232.40,
    week52Low: 164.08,
    week52High: 237.23,
    description: 'Designs, manufactures, and markets smartphones, personal computers, wearables, and integrated digital services.'
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    exchange: 'NASDAQ',
    sector: 'Technology',
    badgeBg: '#0083B8',
    badgeText: 'MS',
    price: 424.92,
    change: 3.18,
    changePercent: 0.75,
    volume: 18.7,
    relVolume: 0.89,
    marketCap: 3158.2,
    peRatio: 35.8,
    epsDiluted: 11.86,
    epsGrowthYoY: 14.6,
    divYield: 0.78,
    analystRating: 'Strong Buy',
    sparkline: [421.74, 422.1, 421.9, 422.5, 423.0, 423.4, 423.2, 423.9, 424.2, 424.5, 424.7, 424.92],
    dayLow: 421.20,
    dayHigh: 426.10,
    week52Low: 385.58,
    week52High: 468.35,
    description: 'Develops enterprise cloud infrastructure (Azure), productivity software, and intelligent computing platforms.'
  },
  {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    exchange: 'NASDAQ',
    sector: 'Consumer Discretionary',
    badgeBg: '#E01E37',
    badgeText: 'TS',
    price: 241.05,
    change: -8.35,
    changePercent: -3.35,
    volume: 79.6,
    relVolume: 1.38,
    marketCap: 768.9,
    peRatio: 66.2,
    epsDiluted: 3.64,
    epsGrowthYoY: -18.5,
    divYield: 0.00,
    analystRating: 'Neutral',
    sparkline: [249.40, 248.1, 247.3, 246.0, 246.8, 245.1, 244.0, 243.2, 242.5, 241.9, 241.4, 241.05],
    dayLow: 239.80,
    dayHigh: 250.10,
    week52Low: 138.80,
    week52High: 271.00,
    description: 'Designs, manufactures, and sells electric vehicles, grid-scale battery energy storage, and autonomous software.'
  },
  {
    symbol: 'META',
    name: 'Meta Platforms, Inc.',
    exchange: 'NASDAQ',
    sector: 'Technology',
    badgeBg: '#2962FF',
    badgeText: 'MT',
    price: 594.30,
    change: 9.75,
    changePercent: 1.67,
    volume: 14.3,
    relVolume: 1.12,
    marketCap: 1502.4,
    peRatio: 29.6,
    epsDiluted: 20.08,
    epsGrowthYoY: 42.1,
    divYield: 0.34,
    analystRating: 'Strong Buy',
    sparkline: [584.55, 586.0, 585.4, 587.2, 588.9, 589.5, 590.8, 591.4, 592.6, 593.1, 593.9, 594.30],
    dayLow: 583.90,
    dayHigh: 596.80,
    week52Low: 390.42,
    week52High: 602.95,
    description: 'Builds social networking platforms, AI advertising infrastructure, and mixed-reality hardware ecosystems.'
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com, Inc.',
    exchange: 'NASDAQ',
    sector: 'Consumer Discretionary',
    badgeBg: '#1B3B6F',
    badgeText: 'AZ',
    price: 188.45,
    change: 1.92,
    changePercent: 1.03,
    volume: 34.8,
    relVolume: 0.94,
    marketCap: 1978.1,
    peRatio: 43.2,
    epsDiluted: 4.36,
    epsGrowthYoY: 52.3,
    divYield: 0.00,
    analystRating: 'Strong Buy',
    sparkline: [186.53, 186.9, 186.7, 187.2, 187.5, 187.3, 187.8, 188.0, 187.9, 188.2, 188.3, 188.45],
    dayLow: 186.10,
    dayHigh: 189.30,
    week52Low: 151.61,
    week52High: 201.20,
    description: 'Operates global e-commerce fulfillment, AWS cloud computing infrastructure, and digital streaming networks.'
  },
  {
    symbol: 'AVGO',
    name: 'Broadcom Inc.',
    exchange: 'NASDAQ',
    sector: 'Semiconductors',
    badgeBg: '#E01E37',
    badgeText: 'AV',
    price: 181.24,
    change: 5.14,
    changePercent: 2.92,
    volume: 26.9,
    relVolume: 1.25,
    marketCap: 846.2,
    peRatio: 39.4,
    epsDiluted: 4.60,
    epsGrowthYoY: 24.8,
    divYield: 1.18,
    analystRating: 'Strong Buy',
    sparkline: [176.10, 176.8, 177.4, 177.1, 178.0, 178.6, 179.2, 179.8, 180.1, 180.6, 180.9, 181.24],
    dayLow: 175.80,
    dayHigh: 182.10,
    week52Low: 118.45,
    week52High: 185.16,
    description: 'Designs custom AI accelerators, networking ethernet switches, and enterprise infraestructura software.'
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    exchange: 'NASDAQ',
    sector: 'Technology',
    badgeBg: '#2962FF',
    badgeText: 'GO',
    price: 167.85,
    change: -1.12,
    changePercent: -0.66,
    volume: 22.4,
    relVolume: 0.88,
    marketCap: 2076.3,
    peRatio: 23.8,
    epsDiluted: 7.05,
    epsGrowthYoY: 31.4,
    divYield: 0.48,
    analystRating: 'Buy',
    sparkline: [168.97, 169.1, 168.7, 168.4, 168.6, 168.2, 168.0, 168.1, 167.9, 167.7, 167.8, 167.85],
    dayLow: 166.90,
    dayHigh: 169.45,
    week52Low: 130.67,
    week52High: 191.75,
    description: 'Delivers global search, YouTube media platforms, Android operating systems, and Google Cloud infrastructure.'
  },
  {
    symbol: 'JPM',
    name: 'JPMorgan Chase & Co.',
    exchange: 'NYSE',
    sector: 'Financials',
    badgeBg: '#24527A',
    badgeText: 'JP',
    price: 224.60,
    change: 3.45,
    changePercent: 1.56,
    volume: 11.2,
    relVolume: 1.18,
    marketCap: 638.4,
    peRatio: 12.4,
    epsDiluted: 18.11,
    epsGrowthYoY: 12.9,
    divYield: 2.05,
    analystRating: 'Buy',
    sparkline: [221.15, 221.6, 222.0, 222.4, 222.1, 222.8, 223.2, 223.6, 223.9, 224.1, 224.4, 224.60],
    dayLow: 220.80,
    dayHigh: 225.30,
    week52Low: 165.40,
    week52High: 226.75,
    description: 'Global financial services leader in investment banking, commercial banking, asset management, and treasury.'
  },
  {
    symbol: 'LLY',
    name: 'Eli Lilly and Company',
    exchange: 'NYSE',
    sector: 'Healthcare',
    badgeBg: '#E01E37',
    badgeText: 'LL',
    price: 904.15,
    change: -6.80,
    changePercent: -0.75,
    volume: 3.1,
    relVolume: 0.84,
    marketCap: 859.2,
    peRatio: 74.5,
    epsDiluted: 12.14,
    epsGrowthYoY: 68.0,
    divYield: 0.58,
    analystRating: 'Strong Buy',
    sparkline: [910.95, 910.1, 909.2, 908.5, 909.0, 907.6, 906.8, 906.1, 905.4, 904.9, 904.5, 904.15],
    dayLow: 901.50,
    dayHigh: 912.80,
    week52Low: 553.00,
    week52High: 972.53,
    description: 'Discovers, develops, and manufactures pharmaceutical therapeutics across metabolic, oncology, and immunology.'
  },
  {
    symbol: 'AMD',
    name: 'Advanced Micro Devices',
    exchange: 'NASDAQ',
    sector: 'Semiconductors',
    badgeBg: '#089981',
    badgeText: 'AM',
    price: 171.90,
    change: 6.42,
    changePercent: 3.88,
    volume: 54.6,
    relVolume: 1.35,
    marketCap: 278.4,
    peRatio: 48.2,
    epsDiluted: 3.57,
    epsGrowthYoY: 38.4,
    divYield: 0.00,
    analystRating: 'Strong Buy',
    sparkline: [165.48, 166.2, 167.0, 167.8, 167.5, 168.4, 169.1, 169.9, 170.5, 171.0, 171.5, 171.90],
    dayLow: 165.10,
    dayHigh: 172.85,
    week52Low: 121.82,
    week52High: 227.30,
    description: 'Engineers high-performance EPYC server processors, Instinct AI accelerators, and Ryzen client architectures.'
  },
  {
    symbol: 'XOM',
    name: 'Exxon Mobil Corporation',
    exchange: 'NYSE',
    sector: 'Energy',
    badgeBg: '#9e3500',
    badgeText: 'XM',
    price: 123.40,
    change: 1.58,
    changePercent: 1.30,
    volume: 16.4,
    relVolume: 1.09,
    marketCap: 548.6,
    peRatio: 14.1,
    epsDiluted: 8.75,
    epsGrowthYoY: -4.2,
    divYield: 3.08,
    analystRating: 'Buy',
    sparkline: [121.82, 122.0, 122.3, 122.1, 122.5, 122.7, 122.9, 123.1, 123.0, 123.2, 123.3, 123.40],
    dayLow: 121.50,
    dayHigh: 124.05,
    week52Low: 95.77,
    week52High: 126.34,
    description: 'Explores for and produces crude oil, natural gas, petrochemicals, and low-carbon hydrogen solutions.'
  }
];

export const SECTOR_METRICS: SectorMetric[] = [
  {
    name: 'Semiconductors & AI Hardware',
    code: 'SOX',
    changePercent: 3.18,
    marketCapWeight: 11.4,
    topGainer: { symbol: 'AMD', changePercent: 3.88 },
    topLoser: { symbol: 'INTC', changePercent: -0.92 },
    volumeBillions: 48.2
  },
  {
    name: 'Information Technology',
    code: 'XLK',
    changePercent: 1.42,
    marketCapWeight: 31.8,
    topGainer: { symbol: 'META', changePercent: 1.67 },
    topLoser: { symbol: 'GOOGL', changePercent: -0.66 },
    volumeBillions: 64.5
  },
  {
    name: 'Financials & Capital Markets',
    code: 'XLF',
    changePercent: 1.18,
    marketCapWeight: 13.2,
    topGainer: { symbol: 'JPM', changePercent: 1.56 },
    topLoser: { symbol: 'PYPL', changePercent: -0.45 },
    volumeBillions: 29.1
  },
  {
    name: 'Energy & Upstream Commodities',
    code: 'XLE',
    changePercent: 0.94,
    marketCapWeight: 4.1,
    topGainer: { symbol: 'XOM', changePercent: 1.30 },
    topLoser: { symbol: 'SLB', changePercent: -0.28 },
    volumeBillions: 18.7
  },
  {
    name: 'Industrials & Aerospace',
    code: 'XLI',
    changePercent: 0.45,
    marketCapWeight: 8.6,
    topGainer: { symbol: 'GE', changePercent: 1.82 },
    topLoser: { symbol: 'BA', changePercent: -1.14 },
    volumeBillions: 16.4
  },
  {
    name: 'Healthcare & Biopharma',
    code: 'XLV',
    changePercent: -0.38,
    marketCapWeight: 11.9,
    topGainer: { symbol: 'UNH', changePercent: 0.64 },
    topLoser: { symbol: 'LLY', changePercent: -0.75 },
    volumeBillions: 21.8
  },
  {
    name: 'Consumer Discretionary',
    code: 'XLY',
    changePercent: -0.86,
    marketCapWeight: 10.1,
    topGainer: { symbol: 'AMZN', changePercent: 1.03 },
    topLoser: { symbol: 'TSLA', changePercent: -3.35 },
    volumeBillions: 38.9
  },
  {
    name: 'Utilities & Yield Infrastructure',
    code: 'XLU',
    changePercent: -0.52,
    marketCapWeight: 2.5,
    topGainer: { symbol: 'CEG', changePercent: 1.45 },
    topLoser: { symbol: 'NEE', changePercent: -1.10 },
    volumeBillions: 9.4
  }
];

export const ECONOMIC_EVENTS: EconomicEvent[] = [
  {
    id: 'evt-1',
    time: '08:30 EST',
    country: 'US',
    event: 'Core CPI (YoY)',
    impact: 'High',
    actual: '3.2%',
    forecast: '3.2%',
    previous: '3.3%'
  },
  {
    id: 'evt-2',
    time: '10:00 EST',
    country: 'US',
    event: 'ISM Services PMI',
    impact: 'High',
    actual: '54.9',
    forecast: '51.7',
    previous: '51.5'
  },
  {
    id: 'evt-3',
    time: '13:00 EST',
    country: 'US',
    event: '10-Year Treasury Note Auction',
    impact: 'Medium',
    actual: '4.035%',
    forecast: '4.040%',
    previous: '3.980%'
  },
  {
    id: 'evt-4',
    time: '14:00 EST',
    country: 'US',
    event: 'FOMC Meeting Minutes Release',
    impact: 'High',
    actual: 'Pending',
    forecast: '—',
    previous: '—'
  }
];
