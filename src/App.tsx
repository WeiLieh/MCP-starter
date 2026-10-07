import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronRight,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal,
  Plus,
  Check,
  X,
  TrendingUp,
  TrendingDown,
  Download,
  Bookmark
} from 'lucide-react';
import {
  INITIAL_INDICES,
  INITIAL_STOCKS,
  SECTOR_METRICS,
  ECONOMIC_EVENTS,
  MarketIndex,
  StockAsset,
  OrderExecution
} from './data/marketData';
import { SparklineChart } from './components/SparklineChart';
import { InteractiveMainChart } from './components/InteractiveMainChart';

type NavView = 'Markets' | 'Screener' | 'Sectors' | 'Watchlist' | 'Economy';
type RegionTab = 'All' | 'Americas' | 'Europe' | 'Asia-Pacific';
type MoverFilter = 'Most Active' | 'Top Gainers' | 'Top Losers';
type TimeframeKey = '1D' | '5D' | '1M' | '6M' | 'YTD' | '1Y' | '5Y';
type SortField = 'symbol' | 'price' | 'changePercent' | 'volume' | 'relVolume' | 'marketCap' | 'peRatio' | 'epsDiluted' | 'divYield';

export default function App() {
  // Primary Navigation & View State
  const [activeNav, setActiveNav] = useState<NavView>('Markets');
  const [indices, setIndices] = useState<MarketIndex[]>(INITIAL_INDICES);
  const [stocks, setStocks] = useState<StockAsset[]>(INITIAL_STOCKS);

  // Market Indices Selection & Filters
  const [regionFilter, setRegionFilter] = useState<RegionTab>('All');
  const [selectedIndexId, setSelectedIndexId] = useState<string>('SPX');
  const [chartTimeframe, setChartTimeframe] = useState<TimeframeKey>('1D');

  // Stock Movers Card Grid Filter
  const [moverFilter, setMoverFilter] = useState<MoverFilter>('Most Active');

  // Financial Screener Table Controls
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sectorFilter, setSectorFilter] = useState<string>('All Sectors');
  const [ratingFilter, setRatingFilter] = useState<string>('All Ratings');
  const [sortField, setSortField] = useState<SortField>('marketCap');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Watchlist & Trade Drawer State
  const [watchlist, setWatchlist] = useState<string[]>(['NVDA', 'AAPL', 'MSFT', 'META', 'AVGO']);
  const [inspectedStockSymbol, setInspectedStockSymbol] = useState<string | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState<boolean>(false);
  const [orderTicker, setOrderTicker] = useState<string>('NVDA');
  const [orderSide, setOrderSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'LIMIT' | 'MARKET' | 'STOP'>('LIMIT');
  const [orderQty, setOrderQty] = useState<string>('100');
  const [orderLimitPrice, setOrderLimitPrice] = useState<string>('138.60');
  const [orders, setOrders] = useState<OrderExecution[]>([
    {
      id: 'ORD-9042',
      timestamp: '10:42:18 EST',
      symbol: 'NVDA',
      side: 'BUY',
      type: 'LIMIT',
      qty: 150,
      price: 136.50,
      status: 'FILLED'
    },
    {
      id: 'ORD-9039',
      timestamp: '09:58:04 EST',
      symbol: 'AAPL',
      side: 'BUY',
      type: 'MARKET',
      qty: 80,
      price: 230.40,
      status: 'FILLED'
    }
  ]);
  const [orderSuccessBanner, setOrderSuccessBanner] = useState<string | null>(null);

  // Subtle Realistic Market Tick Simulation (tabular numbers stay rock-solid)
  useEffect(() => {
    const interval = setInterval(() => {
      setStocks((prevStocks) =>
        prevStocks.map((st) => {
          if (Math.random() > 0.45) return st;
          const deltaPct = (Math.random() - 0.485) * 0.0022;
          const newPrice = Number((st.price * (1 + deltaPct)).toFixed(2));
          const prevClose = st.price - st.change;
          const newChange = Number((newPrice - prevClose).toFixed(2));
          const newChangePct = Number(((newChange / prevClose) * 100).toFixed(2));
          const updatedSpark = [...st.sparkline.slice(0, -1), newPrice];
          return {
            ...st,
            price: newPrice,
            change: newChange,
            changePercent: newChangePct,
            sparkline: updatedSpark
          };
        })
      );

      setIndices((prevIndices) =>
        prevIndices.map((idx) => {
          if (Math.random() > 0.5) return idx;
          const deltaPct = (Math.random() - 0.48) * 0.0008;
          const newPrice = Number((idx.price * (1 + deltaPct)).toFixed(2));
          const newChange = Number((newPrice - idx.prevClose).toFixed(2));
          const newChangePct = Number(((newChange / idx.prevClose) * 100).toFixed(2));
          const updatedSpark = [...idx.sparkline.slice(0, -1), newPrice];
          return {
            ...idx,
            price: newPrice,
            change: newChange,
            changePercent: newChangePct,
            sparkline: updatedSpark
          };
        })
      );
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  // Currently selected index object
  const selectedIndex = useMemo(
    () => indices.find((i) => i.id === selectedIndexId) || indices[0],
    [indices, selectedIndexId]
  );

  // Filtered indices by region
  const visibleIndices = useMemo(() => {
    if (regionFilter === 'All') return indices;
    return indices.filter((i) => i.region === regionFilter);
  }, [indices, regionFilter]);

  // Top 4 stock cards based on mover filter
  const featuredMoverStocks = useMemo(() => {
    const copy = [...stocks];
    if (moverFilter === 'Most Active') {
      return copy.sort((a, b) => b.volume - a.volume).slice(0, 4);
    }
    if (moverFilter === 'Top Gainers') {
      return copy.sort((a, b) => b.changePercent - a.changePercent).slice(0, 4);
    }
    return copy.sort((a, b) => a.changePercent - b.changePercent).slice(0, 4);
  }, [stocks, moverFilter]);

  // Screener filtered & sorted stocks
  const filteredScreenerStocks = useMemo(() => {
    return stocks
      .filter((s) => {
        if (activeNav === 'Watchlist' && !watchlist.includes(s.symbol)) {
          return false;
        }
        const matchesQuery =
          s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.sector.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSector = sectorFilter === 'All Sectors' || s.sector === sectorFilter;
        const matchesRating = ratingFilter === 'All Ratings' || s.analystRating === ratingFilter;
        return matchesQuery && matchesSector && matchesRating;
      })
      .sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortDirection === 'asc'
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }
        const numA = Number(valA);
        const numB = Number(valB);
        return sortDirection === 'asc' ? numA - numB : numB - numA;
      });
  }, [stocks, activeNav, watchlist, searchQuery, sectorFilter, ratingFilter, sortField, sortDirection]);

  const inspectedStock = useMemo(
    () => stocks.find((s) => s.symbol === inspectedStockSymbol) || null,
    [stocks, inspectedStockSymbol]
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const toggleWatchlist = (symbol: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setWatchlist((prev) =>
      prev.includes(symbol) ? prev.filter((item) => item !== symbol) : [...prev, symbol]
    );
  };

  const openOrderTicketForStock = (symbol: string, side: 'BUY' | 'SELL' = 'BUY', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const target = stocks.find((s) => s.symbol === symbol) || stocks[0];
    setOrderTicker(target.symbol);
    setOrderSide(side);
    setOrderLimitPrice(target.price.toFixed(2));
    setIsOrderModalOpen(true);
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const target = stocks.find((s) => s.symbol === orderTicker) || stocks[0];
    const execPrice = orderType === 'MARKET' ? target.price : Number(orderLimitPrice) || target.price;
    const qtyNum = Math.max(1, parseInt(orderQty, 10) || 100);

    const newOrder: OrderExecution = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }) + ' EST',
      symbol: orderTicker,
      side: orderSide,
      type: orderType,
      qty: qtyNum,
      price: execPrice,
      status: 'FILLED'
    };

    setOrders((prev) => [newOrder, ...prev]);
    setOrderSuccessBanner(`${orderSide} ${qtyNum} ${orderTicker} @ $${execPrice.toFixed(2)} (${orderType}) routed & filled.`);
    setTimeout(() => {
      setOrderSuccessBanner(null);
      setIsOrderModalOpen(false);
    }, 1500);
  };

  const exportScreenerCSV = () => {
    const headers = ['Symbol', 'Name', 'Sector', 'Price', 'Change %', 'Volume (M)', 'Market Cap ($B)', 'P/E', 'EPS', 'Rating'];
    const rows = filteredScreenerStocks.map((s) => [
      s.symbol,
      `"${s.name}"`,
      s.sector,
      s.price.toFixed(2),
      `${s.changePercent.toFixed(2)}%`,
      s.volume.toFixed(1),
      s.marketCap.toFixed(1),
      s.peRatio.toFixed(1),
      s.epsDiluted.toFixed(2),
      s.analystRating
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `market_precision_screener_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#131722] flex flex-col">
      {/* Top Navigation Bar — Strict 3-Zone Contract */}
      <header className="sticky top-0 z-30 bg-[#FFFFFF]/92 backdrop-blur-md border-b border-[#E0E3EB]">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          {/* Zone 1: Brand Title (Single text element wordmark) */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveNav('Markets');
            }}
            className="text-[19px] font-bold tracking-[-0.03em] text-[#131722] whitespace-nowrap shrink-0"
          >
            Market Precision
          </a>

          {/* Zone 2: 5 Single-Line Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-[14px] font-medium text-[#787B86]">
            {(['Markets', 'Screener', 'Sectors', 'Watchlist', 'Economy'] as NavView[]).map((item) => {
              const isActive = activeNav === item;
              return (
                <button
                  key={item}
                  onClick={() => setActiveNav(item)}
                  className={`py-5 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'border-[#2962FF] text-[#131722] font-semibold'
                      : 'border-transparent text-[#787B86] hover:text-[#131722]'
                  }`}
                >
                  {item}
                  {item === 'Watchlist' ? ` (${watchlist.length})` : ''}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Actions (Max 2 controls) */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                setActiveNav('Screener');
                const el = document.getElementById('equity-screener-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3.5 py-2 text-[13px] font-semibold text-[#131722] bg-transparent border border-[#E0E3EB] hover:border-[#131722] rounded-[8px] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Screener ({stocks.length})
            </button>
            <button
              onClick={() => openOrderTicketForStock('NVDA', 'BUY')}
              className="px-4 py-2 text-[13px] font-semibold text-[#FFFFFF] bg-[#2962FF] hover:bg-[#0049db] rounded-[8px] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              New Order
            </button>
          </div>
        </div>

        {/* Mobile View Switcher Bar */}
        <div className="flex md:hidden items-center gap-1 px-4 py-2 border-t border-[#E0E3EB] overflow-x-auto no-scrollbar bg-[#FFFFFF]">
          {(['Markets', 'Screener', 'Sectors', 'Watchlist', 'Economy'] as NavView[]).map((item) => (
            <button
              key={item}
              onClick={() => setActiveNav(item)}
              className={`px-3 py-1.5 text-[12px] font-semibold rounded-full whitespace-nowrap shrink-0 ${
                activeNav === item
                  ? 'bg-[#F0F3FA] text-[#2962FF]'
                  : 'text-[#787B86]'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content Container (1440px Desktop Grid, 32px desktop margin) */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 md:px-8 py-6 md:py-8 space-y-10">
        {/* SECTION 1: MARKET SUMMARY & GLOBAL INDICES */}
        {(activeNav === 'Markets' || activeNav === 'Watchlist') && (
          <section aria-labelledby="market-summary-heading" className="space-y-5">
            {/* Header Row + Pill Filter Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <button
                  onClick={() => setActiveNav('Markets')}
                  className="group inline-flex items-center gap-1.5 text-left cursor-pointer"
                >
                  <h1
                    id="market-summary-heading"
                    className="text-[28px] md:text-[36px] font-bold tracking-[-0.03em] leading-[34px] md:leading-[44px] text-[#131722]"
                  >
                    Market summary
                  </h1>
                  <ChevronRight className="w-6 h-6 text-[#131722] transition-transform group-hover:translate-x-0.5 mt-0.5" />
                </button>
              </div>

              {/* Pill Filter Navigation (#F0F3FA container, #FFFFFF active pill with 1px #E0E3EB border) */}
              <div
                role="tablist"
                aria-label="Regional market indices filter"
                className="inline-flex items-center p-1 bg-[#F0F3FA] rounded-full self-start sm:self-auto overflow-x-auto max-w-full no-scrollbar"
              >
                {(['All', 'Americas', 'Europe', 'Asia-Pacific'] as RegionTab[]).map((tab) => {
                  const active = regionFilter === tab;
                  return (
                    <button
                      key={tab}
                      role="tab"
                      aria-selected={active}
                      onClick={() => setRegionFilter(tab)}
                      className={`px-4 py-1.5 text-[13px] rounded-full transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                        active
                          ? 'bg-[#FFFFFF] text-[#131722] font-semibold border border-[#E0E3EB]'
                          : 'bg-transparent text-[#131722] font-medium hover:text-[#2962FF] border border-transparent'
                      }`}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Global Benchmark Index Pills Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {visibleIndices.slice(0, 4).map((idx) => {
                const isSelected = idx.id === selectedIndex.id;
                const isBullish = idx.change >= 0;
                return (
                  <button
                    key={idx.id}
                    onClick={() => setSelectedIndexId(idx.id)}
                    className={`w-full text-left p-4 rounded-[16px] bg-[#FFFFFF] border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-[#2962FF] shadow-[0_4px_12px_rgba(19,23,34,0.06)]'
                        : 'border-[#E0E3EB] hover:border-[#2962FF]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Market Index Badge: 24px x 24px circular identifier */}
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[#FFFFFF] text-[11px] font-bold tracking-[0.02em] shrink-0"
                        style={{ backgroundColor: idx.badgeColor }}
                      >
                        {idx.badgeText}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[14px] font-semibold text-[#131722] truncate">
                            {idx.symbol}
                          </span>
                        </div>
                        <div className="text-[12px] text-[#787B86] truncate">
                          {idx.name}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 tabular-nums">
                      <div className="text-[14px] font-semibold text-[#131722]">
                        {idx.price.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                        <span className="text-[11px] font-normal text-[#787B86] ml-1">
                          {idx.currency}
                        </span>
                      </div>
                      <div
                        className={`text-[13px] font-semibold ${
                          isBullish ? 'text-[#089981]' : 'text-[#F23645]'
                        }`}
                      >
                        {isBullish ? '+' : ''}
                        {idx.changePercent.toFixed(2)}%
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Index Interactive Benchmark Chart Canvas (Single-Elevation Tier 1 Card) */}
            <div className="p-5 md:p-6 rounded-[16px] bg-[#FFFFFF] border border-[#E0E3EB]">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 mb-4 border-b border-[#E0E3EB]">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[#FFFFFF] text-[11px] font-bold tracking-[0.02em] shrink-0"
                    style={{ backgroundColor: selectedIndex.badgeColor }}
                  >
                    {selectedIndex.badgeText}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-[20px] md:text-[24px] font-bold tracking-[-0.02em] text-[#131722]">
                        {selectedIndex.symbol}
                      </h2>
                      <span className="text-[13px] text-[#787B86]">
                        · {selectedIndex.name} · {selectedIndex.region}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Big Price & Timeframe Pill Selector */}
                <div className="flex flex-wrap items-center justify-between lg:justify-end gap-5">
                  <div className="flex items-baseline gap-2.5 tabular-nums">
                    <span className="text-[24px] md:text-[28px] font-bold tracking-[-0.02em] text-[#131722]">
                      {selectedIndex.price.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </span>
                    <span className="text-[12px] font-medium text-[#787B86]">
                      {selectedIndex.currency}
                    </span>
                    <span
                      className={`text-[14px] font-semibold ${
                        selectedIndex.change >= 0 ? 'text-[#089981]' : 'text-[#F23645]'
                      }`}
                    >
                      {selectedIndex.change >= 0 ? '+' : ''}
                      {selectedIndex.change.toFixed(2)} ({selectedIndex.change >= 0 ? '+' : ''}
                      {selectedIndex.changePercent.toFixed(2)}%)
                    </span>
                  </div>

                  {/* Timeframe Pill Track */}
                  <div className="inline-flex items-center p-1 bg-[#F0F3FA] rounded-full">
                    {(['1D', '5D', '1M', '6M', 'YTD', '1Y', '5Y'] as TimeframeKey[]).map((tf) => {
                      const active = chartTimeframe === tf;
                      return (
                        <button
                          key={tf}
                          onClick={() => setChartTimeframe(tf)}
                          className={`px-2.5 py-1 text-[12px] rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            active
                              ? 'bg-[#FFFFFF] text-[#131722] font-semibold border border-[#E0E3EB]'
                              : 'text-[#787B86] hover:text-[#131722] font-medium border border-transparent'
                          }`}
                        >
                          {tf}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Interactive SVG Chart */}
              <InteractiveMainChart
                series={selectedIndex.intradaySeries[chartTimeframe]}
                isPositive={selectedIndex.change >= 0}
                prevClose={selectedIndex.prevClose}
                currency={selectedIndex.currency}
                symbol={selectedIndex.symbol}
              />

              {/* Key Index Telemetry Strip (Unboxed clean inline stats separated by hairlines) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 mt-4 border-t border-[#E0E3EB] text-[13px] tabular-nums">
                <div>
                  <span className="text-[#787B86] block text-[12px]">Open</span>
                  <span className="font-semibold text-[#131722]">
                    {selectedIndex.openPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-[#787B86] block text-[12px]">Previous Close</span>
                  <span className="font-semibold text-[#131722]">
                    {selectedIndex.prevClose.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-[#787B86] block text-[12px]">Day High</span>
                  <span className="font-semibold text-[#089981]">
                    {selectedIndex.high24h.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-[#787B86] block text-[12px]">Day Low</span>
                  <span className="font-semibold text-[#F23645]">
                    {selectedIndex.low24h.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 2: STOCK TICKER CARDS (4-Column Grid with Embedded Sparkline Charts) */}
        {(activeNav === 'Markets' || activeNav === 'Watchlist') && (
          <section aria-labelledby="top-movers-heading" className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <h2
                  id="top-movers-heading"
                  className="text-[24px] font-bold tracking-[-0.02em] leading-[30px] text-[#131722]"
                >
                  Equities in focus
                </h2>
                <ChevronRight className="w-5 h-5 text-[#131722] mt-0.5" />
              </div>

              {/* Pill Filter Navigation for Stock Cards */}
              <div className="inline-flex items-center p-1 bg-[#F0F3FA] rounded-full self-start sm:self-auto">
                {(['Most Active', 'Top Gainers', 'Top Losers'] as MoverFilter[]).map((filter) => {
                  const active = moverFilter === filter;
                  return (
                    <button
                      key={filter}
                      onClick={() => setMoverFilter(filter)}
                      className={`px-3.5 py-1.5 text-[13px] rounded-full transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                        active
                          ? 'bg-[#FFFFFF] text-[#131722] font-semibold border border-[#E0E3EB]'
                          : 'bg-transparent text-[#131722] font-medium hover:text-[#2962FF] border border-transparent'
                      }`}
                    >
                      {filter}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4-Column Stock Ticker Card Grid (margin-desktop 32px, gutter-desktop 24px, internal padding 20px) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredMoverStocks.map((stock) => {
                const isBullish = stock.change >= 0;
                const inWatchlist = watchlist.includes(stock.symbol);
                return (
                  <div
                    key={stock.symbol}
                    onClick={() => setInspectedStockSymbol(stock.symbol)}
                    className="group p-5 rounded-[16px] bg-[#FFFFFF] border border-[#E0E3EB] hover:border-[#2962FF] hover:shadow-[0_4px_12px_rgba(19,23,34,0.06)] transition-all cursor-pointer flex flex-col justify-between"
                  >
                    {/* Card Header: 24px circular logomark + Ticker Symbol (Bold) + Full Name (text-muted) */}
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[#FFFFFF] text-[11px] font-bold tracking-[0.02em] shrink-0"
                            style={{ backgroundColor: stock.badgeBg }}
                          >
                            {stock.badgeText}
                          </span>
                          <div className="min-w-0">
                            <div className="text-[14px] font-semibold text-[#131722] leading-tight">
                              {stock.symbol}
                            </div>
                            <div className="text-[12px] text-[#787B86] truncate">
                              {stock.name}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={(e) => toggleWatchlist(stock.symbol, e)}
                          title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                          className={`p-1.5 rounded-[8px] border transition-colors shrink-0 ${
                            inWatchlist
                              ? 'border-[#2962FF] text-[#2962FF] bg-[#F0F3FA]'
                              : 'border-transparent text-[#787B86] hover:text-[#131722] hover:border-[#E0E3EB]'
                          }`}
                        >
                          <Bookmark className="w-3.5 h-3.5 fill-current" />
                        </button>
                      </div>

                      {/* Card Body: Current Asset Price in Bold Tabular Numbers + Delta */}
                      <div className="flex items-baseline justify-between gap-2 mb-4 tabular-nums">
                        <div>
                          <span className="text-[22px] font-bold tracking-[-0.02em] text-[#131722]">
                            ${stock.price.toFixed(2)}
                          </span>
                          <span className="text-[11px] text-[#787B86] ml-1">USD</span>
                        </div>
                        <div
                          className={`text-[13px] font-semibold flex items-center gap-0.5 ${
                            isBullish ? 'text-[#089981]' : 'text-[#F23645]'
                          }`}
                        >
                          {isBullish ? (
                            <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <TrendingDown className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span>
                            {isBullish ? '+' : ''}
                            {stock.changePercent.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Sparkline Chart Occupying Lower Half */}
                    <div className="pt-2 border-t border-[#F0F3FA]">
                      <SparklineChart
                        id={`card-${stock.symbol}`}
                        data={stock.sparkline}
                        isPositive={isBullish}
                        height={56}
                      />
                      <div className="flex items-center justify-between text-[11px] text-[#787B86] mt-2 tabular-nums">
                        <span>Vol {stock.volume.toFixed(1)}M</span>
                        <span>·</span>
                        <span>P/E {stock.peRatio.toFixed(1)}x</span>
                        <span>·</span>
                        <span>Cap ${stock.marketCap.toFixed(0)}B</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* SECTION 3: SECTOR PERFORMANCE & BREADTH MATRIX */}
        {(activeNav === 'Markets' || activeNav === 'Sectors') && (
          <section aria-labelledby="sectors-heading" className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <h2
                  id="sectors-heading"
                  className="text-[24px] font-bold tracking-[-0.02em] leading-[30px] text-[#131722]"
                >
                  Sector rotation & breadth
                </h2>
                <ChevronRight className="w-5 h-5 text-[#131722] mt-0.5" />
              </div>
              <span className="text-[12px] font-medium text-[#787B86] tabular-nums">
                S&P 500 GICS Weightings · Real-Time Cap Flow
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {SECTOR_METRICS.map((sec) => {
                const isBull = sec.changePercent >= 0;
                return (
                  <div
                    key={sec.code}
                    onClick={() => {
                      setSectorFilter(
                        sec.name.includes('Semiconductors')
                          ? 'Semiconductors'
                          : sec.name.includes('Technology')
                          ? 'Technology'
                          : sec.name.includes('Financials')
                          ? 'Financials'
                          : sec.name.includes('Energy')
                          ? 'Energy'
                          : sec.name.includes('Healthcare')
                          ? 'Healthcare'
                          : sec.name.includes('Consumer')
                          ? 'Consumer Discretionary'
                          : 'All Sectors'
                      );
                      setActiveNav('Screener');
                    }}
                    className="p-5 rounded-[16px] bg-[#FFFFFF] border border-[#E0E3EB] hover:border-[#2962FF] transition-all cursor-pointer flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[14px] font-semibold text-[#131722] block">
                          {sec.name}
                        </span>
                        <span className="text-[12px] text-[#787B86] tabular-nums">
                          Index {sec.code} · Weight {sec.marketCapWeight}%
                        </span>
                      </div>
                      <span
                        className={`text-[14px] font-bold tabular-nums ${
                          isBull ? 'text-[#089981]' : 'text-[#F23645]'
                        }`}
                      >
                        {isBull ? '+' : ''}
                        {sec.changePercent.toFixed(2)}%
                      </span>
                    </div>

                    {/* Visual Horizontal Relative Bar */}
                    <div className="w-full h-1.5 bg-[#F0F3FA] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, Math.max(15, Math.abs(sec.changePercent) * 25))}%`,
                          backgroundColor: isBull ? '#089981' : '#F23645'
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[12px] text-[#787B86] pt-1 border-t border-[#F0F3FA] tabular-nums">
                      <span>
                        Lead: <strong className="text-[#089981] font-semibold">{sec.topGainer.symbol} +{sec.topGainer.changePercent}%</strong>
                      </span>
                      <span>·</span>
                      <span>
                        Lag: <strong className="text-[#F23645] font-semibold">{sec.topLoser.symbol} {sec.topLoser.changePercent}%</strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* SECTION 4: INSTITUTIONAL EQUITY SCREENER DATA TABLE */}
        {(activeNav === 'Markets' || activeNav === 'Screener' || activeNav === 'Watchlist') && (
          <section id="equity-screener-section" aria-labelledby="screener-heading" className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <h2
                  id="screener-heading"
                  className="text-[24px] font-bold tracking-[-0.02em] leading-[30px] text-[#131722]"
                >
                  {activeNav === 'Watchlist' ? 'Institutional Watchlist' : 'Institutional Equity Screener'}
                </h2>
                <ChevronRight className="w-5 h-5 text-[#131722] mt-0.5" />
              </div>

              {/* Filter & Search Bar Controls */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Search Input (height 40px, 1px #E0E3EB border, 8px radius, focus 2px #2962FF) */}
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-[#787B86] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter ticker, company, sector..."
                    className="w-full h-[40px] pl-9 pr-8 text-[13px] bg-[#FFFFFF] text-[#131722] placeholder-[#787B86] border border-[#E0E3EB] rounded-[8px] focus:outline-none focus:border-[#2962FF] focus:ring-1 focus:ring-[#2962FF] transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#787B86] hover:text-[#131722]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Sector Dropdown */}
                <div className="relative">
                  <select
                    value={sectorFilter}
                    onChange={(e) => setSectorFilter(e.target.value)}
                    aria-label="Filter by sector"
                    className="h-[40px] px-3 pr-7 text-[13px] font-medium bg-[#FFFFFF] text-[#131722] border border-[#E0E3EB] hover:border-[#131722] rounded-[8px] focus:outline-none focus:border-[#2962FF] cursor-pointer"
                  >
                    <option value="All Sectors">All Sectors</option>
                    <option value="Technology">Technology</option>
                    <option value="Semiconductors">Semiconductors</option>
                    <option value="Financials">Financials</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Consumer Discretionary">Consumer Discretionary</option>
                    <option value="Energy">Energy</option>
                  </select>
                </div>

                {/* Analyst Rating Dropdown */}
                <div className="relative">
                  <select
                    value={ratingFilter}
                    onChange={(e) => setRatingFilter(e.target.value)}
                    aria-label="Filter by analyst rating"
                    className="h-[40px] px-3 pr-7 text-[13px] font-medium bg-[#FFFFFF] text-[#131722] border border-[#E0E3EB] hover:border-[#131722] rounded-[8px] focus:outline-none focus:border-[#2962FF] cursor-pointer"
                  >
                    <option value="All Ratings">All Ratings</option>
                    <option value="Strong Buy">Strong Buy</option>
                    <option value="Buy">Buy</option>
                    <option value="Neutral">Neutral</option>
                  </select>
                </div>

                {/* Export CSV Secondary Action Button */}
                <button
                  onClick={exportScreenerCSV}
                  className="h-[40px] px-3.5 text-[13px] font-semibold text-[#131722] bg-transparent border border-[#E0E3EB] hover:border-[#131722] rounded-[8px] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* High-Density Financial Data Table */}
            <div className="rounded-[16px] bg-[#FFFFFF] border border-[#E0E3EB] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E0E3EB] bg-[#F0F3FA]/60 text-[12px] font-medium text-[#787B86] select-none">
                      <th className="py-3 pl-5 pr-3 font-medium">
                        <button
                          onClick={() => handleSort('symbol')}
                          className="inline-flex items-center gap-1 hover:text-[#131722] cursor-pointer"
                        >
                          <span>Symbol</span>
                          {sortField === 'symbol' ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#2962FF]" /> : <ArrowDown className="w-3 h-3 text-[#2962FF]" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-50" />
                          )}
                        </button>
                      </th>
                      <th className="py-3 px-3 text-right font-medium">
                        <button
                          onClick={() => handleSort('price')}
                          className="inline-flex items-center justify-end gap-1 hover:text-[#131722] cursor-pointer ml-auto"
                        >
                          <span>Price</span>
                          {sortField === 'price' && (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#2962FF]" /> : <ArrowDown className="w-3 h-3 text-[#2962FF]" />
                          )}
                        </button>
                      </th>
                      <th className="py-3 px-3 text-right font-medium">
                        <button
                          onClick={() => handleSort('changePercent')}
                          className="inline-flex items-center justify-end gap-1 hover:text-[#131722] cursor-pointer ml-auto"
                        >
                          <span>Change %</span>
                          {sortField === 'changePercent' && (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#2962FF]" /> : <ArrowDown className="w-3 h-3 text-[#2962FF]" />
                          )}
                        </button>
                      </th>
                      <th className="py-3 px-3 text-right font-medium hidden sm:table-cell">
                        <button
                          onClick={() => handleSort('volume')}
                          className="inline-flex items-center justify-end gap-1 hover:text-[#131722] cursor-pointer ml-auto"
                        >
                          <span>Volume</span>
                          {sortField === 'volume' && (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#2962FF]" /> : <ArrowDown className="w-3 h-3 text-[#2962FF]" />
                          )}
                        </button>
                      </th>
                      <th className="py-3 px-3 text-right font-medium hidden md:table-cell">
                        <button
                          onClick={() => handleSort('relVolume')}
                          className="inline-flex items-center justify-end gap-1 hover:text-[#131722] cursor-pointer ml-auto"
                        >
                          <span>Rel Vol</span>
                          {sortField === 'relVolume' && (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#2962FF]" /> : <ArrowDown className="w-3 h-3 text-[#2962FF]" />
                          )}
                        </button>
                      </th>
                      <th className="py-3 px-3 text-right font-medium">
                        <button
                          onClick={() => handleSort('marketCap')}
                          className="inline-flex items-center justify-end gap-1 hover:text-[#131722] cursor-pointer ml-auto"
                        >
                          <span>Market Cap</span>
                          {sortField === 'marketCap' && (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#2962FF]" /> : <ArrowDown className="w-3 h-3 text-[#2962FF]" />
                          )}
                        </button>
                      </th>
                      <th className="py-3 px-3 text-right font-medium hidden lg:table-cell">
                        <button
                          onClick={() => handleSort('peRatio')}
                          className="inline-flex items-center justify-end gap-1 hover:text-[#131722] cursor-pointer ml-auto"
                        >
                          <span>P/E</span>
                          {sortField === 'peRatio' && (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#2962FF]" /> : <ArrowDown className="w-3 h-3 text-[#2962FF]" />
                          )}
                        </button>
                      </th>
                      <th className="py-3 px-3 text-right font-medium hidden xl:table-cell">
                        <button
                          onClick={() => handleSort('epsDiluted')}
                          className="inline-flex items-center justify-end gap-1 hover:text-[#131722] cursor-pointer ml-auto"
                        >
                          <span>EPS (TTM)</span>
                          {sortField === 'epsDiluted' && (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#2962FF]" /> : <ArrowDown className="w-3 h-3 text-[#2962FF]" />
                          )}
                        </button>
                      </th>
                      <th className="py-3 px-3 text-left font-medium hidden lg:table-cell">
                        Sector & Rating
                      </th>
                      <th className="py-3 pl-3 pr-5 text-right font-medium">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E0E3EB] text-[13px] tabular-nums">
                    {filteredScreenerStocks.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-[#787B86]">
                          <div className="max-w-sm mx-auto space-y-3">
                            <p className="text-[14px] font-semibold text-[#131722]">
                              No matching equities found
                            </p>
                            <p className="text-[13px] text-[#787B86]">
                              Adjust your search query, sector selection, or watchlist filter to view institutional market data.
                            </p>
                            <button
                              onClick={() => {
                                setSearchQuery('');
                                setSectorFilter('All Sectors');
                                setRatingFilter('All Ratings');
                                if (activeNav === 'Watchlist') setActiveNav('Markets');
                              }}
                              className="px-4 py-2 text-[13px] font-semibold text-[#FFFFFF] bg-[#2962FF] rounded-[8px] cursor-pointer"
                            >
                              Reset All Filters
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredScreenerStocks.map((stock) => {
                        const isBull = stock.change >= 0;
                        const isWatched = watchlist.includes(stock.symbol);
                        return (
                          <tr
                            key={stock.symbol}
                            onClick={() => setInspectedStockSymbol(stock.symbol)}
                            className="hover:bg-[#F0F3FA]/65 transition-colors cursor-pointer group"
                          >
                            {/* Ticker + Company Name */}
                            <td className="py-3 pl-5 pr-3">
                              <div className="flex items-center gap-2.5">
                                <span
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-[#FFFFFF] text-[11px] font-bold tracking-[0.02em] shrink-0"
                                  style={{ backgroundColor: stock.badgeBg }}
                                >
                                  {stock.badgeText}
                                </span>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-[#131722] group-hover:text-[#2962FF] transition-colors">
                                      {stock.symbol}
                                    </span>
                                    <span className="text-[11px] text-[#787B86]">
                                      · {stock.exchange}
                                    </span>
                                  </div>
                                  <div className="text-[12px] text-[#787B86] truncate max-w-[180px]">
                                    {stock.name}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Price */}
                            <td className="py-3 px-3 text-right font-semibold text-[#131722]">
                              ${stock.price.toFixed(2)}
                            </td>

                            {/* Change % & Absolute */}
                            <td className="py-3 px-3 text-right">
                              <span
                                className={`font-semibold ${
                                  isBull ? 'text-[#089981]' : 'text-[#F23645]'
                                }`}
                              >
                                {isBull ? '+' : ''}
                                {stock.changePercent.toFixed(2)}%
                              </span>
                              <span className="block text-[11px] text-[#787B86]">
                                {isBull ? '+' : ''}
                                {stock.change.toFixed(2)}
                              </span>
                            </td>

                            {/* Volume */}
                            <td className="py-3 px-3 text-right text-[#131722] hidden sm:table-cell">
                              {stock.volume.toFixed(1)}M
                            </td>

                            {/* Relative Volume */}
                            <td className="py-3 px-3 text-right text-[#131722] hidden md:table-cell">
                              {stock.relVolume.toFixed(2)}x
                            </td>

                            {/* Market Cap */}
                            <td className="py-3 px-3 text-right font-medium text-[#131722]">
                              ${stock.marketCap.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}B
                            </td>

                            {/* P/E Ratio */}
                            <td className="py-3 px-3 text-right text-[#131722] hidden lg:table-cell">
                              {stock.peRatio.toFixed(1)}
                            </td>

                            {/* EPS Diluted */}
                            <td className="py-3 px-3 text-right text-[#131722] hidden xl:table-cell">
                              ${stock.epsDiluted.toFixed(2)}
                            </td>

                            {/* Unboxed Metadata: Sector · Analyst Rating */}
                            <td className="py-3 px-3 text-left hidden lg:table-cell">
                              <div className="text-[12px] text-[#131722] flex items-center gap-1.5 whitespace-nowrap">
                                <span>{stock.sector}</span>
                                <span className="text-[#787B86]">·</span>
                                <span
                                  className={`font-semibold ${
                                    stock.analystRating.includes('Buy')
                                      ? 'text-[#089981]'
                                      : 'text-[#787B86]'
                                  }`}
                                >
                                  {stock.analystRating}
                                </span>
                              </div>
                            </td>

                            {/* Interactive Row Actions */}
                            <td className="py-3 pl-3 pr-5 text-right whitespace-nowrap">
                              <div className="inline-flex items-center justify-end gap-1.5">
                                <button
                                  onClick={(e) => toggleWatchlist(stock.symbol, e)}
                                  className={`px-2 py-1 text-[12px] font-medium rounded-[6px] border transition-colors cursor-pointer ${
                                    isWatched
                                      ? 'border-[#2962FF] text-[#2962FF] bg-[#F0F3FA]'
                                      : 'border-[#E0E3EB] text-[#787B86] hover:text-[#131722] hover:border-[#131722]'
                                  }`}
                                >
                                  {isWatched ? 'Saved' : '+ Watch'}
                                </button>
                                <button
                                  onClick={(e) => openOrderTicketForStock(stock.symbol, 'BUY', e)}
                                  className="px-2.5 py-1 text-[12px] font-semibold text-[#FFFFFF] bg-[#2962FF] hover:bg-[#0049db] rounded-[6px] transition-colors cursor-pointer"
                                >
                                  Trade
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 5: MACROECONOMIC CALENDAR & RECENT ORDER BLOTTER */}
        {(activeNav === 'Markets' || activeNav === 'Economy') && (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Macro Releases Calendar (7 Columns) */}
            <div className="lg:col-span-7 p-5 md:p-6 rounded-[16px] bg-[#FFFFFF] border border-[#E0E3EB] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-[18px] font-semibold tracking-[-0.01em] text-[#131722]">
                    Macroeconomic release schedule
                  </h2>
                  <ChevronRight className="w-4 h-4 text-[#131722]" />
                </div>
                <span className="text-[12px] text-[#787B86]">United States · EST</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[13px] tabular-nums">
                  <thead>
                    <tr className="border-b border-[#E0E3EB] text-[12px] text-[#787B86]">
                      <th className="py-2.5 pr-3 font-medium">Time</th>
                      <th className="py-2.5 px-3 font-medium">Event</th>
                      <th className="py-2.5 px-3 text-right font-medium">Actual</th>
                      <th className="py-2.5 px-3 text-right font-medium">Forecast</th>
                      <th className="py-2.5 pl-3 text-right font-medium">Previous</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E0E3EB]">
                    {ECONOMIC_EVENTS.map((ev) => (
                      <tr key={ev.id} className="hover:bg-[#F0F3FA]/50">
                        <td className="py-3 pr-3 text-[#787B86] whitespace-nowrap">{ev.time}</td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-[#131722]">{ev.event}</div>
                          <div className="text-[11px] text-[#787B86]">
                            {ev.country} · {ev.impact} Impact
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-[#131722]">
                          {ev.actual}
                        </td>
                        <td className="py-3 px-3 text-right text-[#787B86]">{ev.forecast}</td>
                        <td className="py-3 pl-3 text-right text-[#787B86]">{ev.previous}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Execution Blotter (5 Columns) */}
            <div className="lg:col-span-5 p-5 md:p-6 rounded-[16px] bg-[#FFFFFF] border border-[#E0E3EB] space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-[18px] font-semibold tracking-[-0.01em] text-[#131722]">
                    Execution blotter
                  </h2>
                  <button
                    onClick={() => openOrderTicketForStock('NVDA', 'BUY')}
                    className="text-[12px] font-semibold text-[#2962FF] hover:underline cursor-pointer"
                  >
                    + New Ticket
                  </button>
                </div>

                <div className="divide-y divide-[#E0E3EB] text-[13px] tabular-nums">
                  {orders.map((ord) => (
                    <div key={ord.id} className="py-3 flex items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-bold ${
                              ord.side === 'BUY' ? 'text-[#089981]' : 'text-[#F23645]'
                            }`}
                          >
                            {ord.side}
                          </span>
                          <span className="font-semibold text-[#131722]">
                            {ord.qty} {ord.symbol}
                          </span>
                          <span className="text-[#787B86]">· {ord.type}</span>
                        </div>
                        <div className="text-[11px] text-[#787B86]">
                          {ord.id} · {ord.timestamp}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-[#131722]">
                          ${ord.price.toFixed(2)}
                        </div>
                        <div className="text-[11px] font-semibold text-[#089981]">
                          {ord.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#E0E3EB] flex items-center justify-between text-[12px] text-[#787B86] tabular-nums">
                <span>Session Filled Executions: {orders.length}</span>
                <span>Buying Power: $248,500.00</span>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* INSPECTED STOCK DRAWER / MODAL (Tier 3 Floating Backdrop Blur) */}
      {inspectedStock && (
        <div
          className="fixed inset-0 z-40 bg-[#131722]/30 backdrop-blur-[4px] flex items-center justify-end"
          onClick={() => setInspectedStockSymbol(null)}
        >
          <div
            className="w-full max-w-lg bg-[#FFFFFF] h-full border-l border-[#E0E3EB] p-6 overflow-y-auto flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              {/* Top Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E0E3EB]">
                <div className="flex items-center gap-3">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[#FFFFFF] text-[12px] font-bold"
                    style={{ backgroundColor: inspectedStock.badgeBg }}
                  >
                    {inspectedStock.badgeText}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[20px] font-bold text-[#131722]">
                        {inspectedStock.symbol}
                      </h3>
                      <span className="text-[12px] text-[#787B86]">
                        · {inspectedStock.exchange}
                      </span>
                    </div>
                    <p className="text-[13px] text-[#787B86]">{inspectedStock.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setInspectedStockSymbol(null)}
                  className="p-1.5 rounded-[8px] border border-[#E0E3EB] text-[#787B86] hover:text-[#131722] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Price Quote */}
              <div className="flex items-baseline justify-between tabular-nums">
                <div>
                  <span className="text-[32px] font-bold tracking-[-0.03em] text-[#131722]">
                    ${inspectedStock.price.toFixed(2)}
                  </span>
                  <span className="text-[12px] text-[#787B86] ml-1.5">USD</span>
                </div>
                <div
                  className={`text-[15px] font-semibold ${
                    inspectedStock.change >= 0 ? 'text-[#089981]' : 'text-[#F23645]'
                  }`}
                >
                  {inspectedStock.change >= 0 ? '+' : ''}
                  {inspectedStock.change.toFixed(2)} ({inspectedStock.change >= 0 ? '+' : ''}
                  {inspectedStock.changePercent.toFixed(2)}%)
                </div>
              </div>

              {/* Sparkline Preview */}
              <div className="p-4 rounded-[12px] bg-[#F0F3FA]/50 border border-[#E0E3EB]">
                <div className="text-[12px] font-medium text-[#787B86] mb-2">
                  Intraday Price Action
                </div>
                <SparklineChart
                  id={`drawer-${inspectedStock.symbol}`}
                  data={inspectedStock.sparkline}
                  isPositive={inspectedStock.change >= 0}
                  height={90}
                />
              </div>

              {/* Company Profile */}
              <div className="space-y-2">
                <h4 className="text-[14px] font-semibold text-[#131722]">
                  Business Summary
                </h4>
                <p className="text-[13px] leading-relaxed text-[#434656]">
                  {inspectedStock.description}
                </p>
              </div>

              {/* Key Valuation & Range Metrics */}
              <div className="space-y-3 pt-2 border-t border-[#E0E3EB] text-[13px] tabular-nums">
                <h4 className="text-[14px] font-semibold text-[#131722]">
                  Key Fundamentals
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-[8px] bg-[#F0F3FA]/60">
                    <span className="text-[11px] text-[#787B86] block">Market Cap</span>
                    <span className="font-semibold text-[#131722]">
                      ${inspectedStock.marketCap.toFixed(1)}B
                    </span>
                  </div>
                  <div className="p-3 rounded-[8px] bg-[#F0F3FA]/60">
                    <span className="text-[11px] text-[#787B86] block">P/E Ratio (TTM)</span>
                    <span className="font-semibold text-[#131722]">
                      {inspectedStock.peRatio.toFixed(1)}x
                    </span>
                  </div>
                  <div className="p-3 rounded-[8px] bg-[#F0F3FA]/60">
                    <span className="text-[11px] text-[#787B86] block">Diluted EPS</span>
                    <span className="font-semibold text-[#131722]">
                      ${inspectedStock.epsDiluted.toFixed(2)} ({inspectedStock.epsGrowthYoY >= 0 ? '+' : ''}
                      {inspectedStock.epsGrowthYoY}% YoY)
                    </span>
                  </div>
                  <div className="p-3 rounded-[8px] bg-[#F0F3FA]/60">
                    <span className="text-[11px] text-[#787B86] block">Day Range</span>
                    <span className="font-semibold text-[#131722]">
                      ${inspectedStock.dayLow.toFixed(2)} – ${inspectedStock.dayHigh.toFixed(2)}
                    </span>
                  </div>
                  <div className="p-3 rounded-[8px] bg-[#F0F3FA]/60">
                    <span className="text-[11px] text-[#787B86] block">52-Week Range</span>
                    <span className="font-semibold text-[#131722]">
                      ${inspectedStock.week52Low.toFixed(2)} – ${inspectedStock.week52High.toFixed(2)}
                    </span>
                  </div>
                  <div className="p-3 rounded-[8px] bg-[#F0F3FA]/60">
                    <span className="text-[11px] text-[#787B86] block">Analyst Consensus</span>
                    <span className="font-semibold text-[#089981]">
                      {inspectedStock.analystRating}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Trade CTA Bar */}
            <div className="pt-4 mt-6 border-t border-[#E0E3EB] flex items-center gap-3">
              <button
                onClick={() => {
                  const sym = inspectedStock.symbol;
                  setInspectedStockSymbol(null);
                  openOrderTicketForStock(sym, 'BUY');
                }}
                className="flex-1 py-2.5 text-[14px] font-semibold text-[#FFFFFF] bg-[#089981] hover:opacity-95 rounded-[8px] cursor-pointer"
              >
                Buy {inspectedStock.symbol}
              </button>
              <button
                onClick={() => {
                  const sym = inspectedStock.symbol;
                  setInspectedStockSymbol(null);
                  openOrderTicketForStock(sym, 'SELL');
                }}
                className="flex-1 py-2.5 text-[14px] font-semibold text-[#FFFFFF] bg-[#F23645] hover:opacity-95 rounded-[8px] cursor-pointer"
              >
                Sell {inspectedStock.symbol}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING ORDER TICKET MODAL (Tier 3 Floating Surface) */}
      {isOrderModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#131722]/35 backdrop-blur-[4px] flex items-center justify-center p-4"
          onClick={() => setIsOrderModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-[16px] bg-[#FFFFFF] border border-[#E0E3EB] p-6 space-y-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E0E3EB]">
              <h3 className="text-[18px] font-bold text-[#131722]">
                Institutional Order Ticket
              </h3>
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="p-1 text-[#787B86] hover:text-[#131722] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {orderSuccessBanner ? (
              <div className="p-4 rounded-[12px] bg-[#089981]/10 border border-[#089981] text-[#089981] text-[13px] font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{orderSuccessBanner}</span>
              </div>
            ) : (
              <form onSubmit={handlePlaceOrder} className="space-y-4">
                {/* Instrument Selector */}
                <div>
                  <label className="block text-[12px] font-medium text-[#787B86] mb-1">
                    Instrument
                  </label>
                  <select
                    value={orderTicker}
                    onChange={(e) => {
                      const sym = e.target.value;
                      setOrderTicker(sym);
                      const found = stocks.find((s) => s.symbol === sym);
                      if (found) setOrderLimitPrice(found.price.toFixed(2));
                    }}
                    className="w-full h-[40px] px-3 text-[13px] font-semibold bg-[#FFFFFF] text-[#131722] border border-[#E0E3EB] rounded-[8px] focus:outline-none focus:border-[#2962FF]"
                  >
                    {stocks.map((s) => (
                      <option key={s.symbol} value={s.symbol}>
                        {s.symbol} — {s.name} (${s.price.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Side Pill Toggle */}
                <div>
                  <label className="block text-[12px] font-medium text-[#787B86] mb-1">
                    Order Side
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-[#F0F3FA] rounded-full">
                    {(['BUY', 'SELL'] as const).map((side) => (
                      <button
                        type="button"
                        key={side}
                        onClick={() => setOrderSide(side)}
                        className={`py-1.5 text-[13px] font-bold rounded-full transition-all cursor-pointer ${
                          orderSide === side
                            ? side === 'BUY'
                              ? 'bg-[#089981] text-[#FFFFFF]'
                              : 'bg-[#F23645] text-[#FFFFFF]'
                            : 'text-[#787B86] hover:text-[#131722]'
                        }`}
                      >
                        {side}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Order Type & Quantity */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-medium text-[#787B86] mb-1">
                      Order Type
                    </label>
                    <select
                      value={orderType}
                      onChange={(e) => setOrderType(e.target.value as 'LIMIT' | 'MARKET' | 'STOP')}
                      className="w-full h-[40px] px-3 text-[13px] font-medium bg-[#FFFFFF] text-[#131722] border border-[#E0E3EB] rounded-[8px] focus:outline-none focus:border-[#2962FF]"
                    >
                      <option value="LIMIT">Limit</option>
                      <option value="MARKET">Market</option>
                      <option value="STOP">Stop</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-[#787B86] mb-1">
                      Quantity (Shares)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={orderQty}
                      onChange={(e) => setOrderQty(e.target.value)}
                      className="w-full h-[40px] px-3 text-[13px] font-semibold tabular-nums bg-[#FFFFFF] text-[#131722] border border-[#E0E3EB] rounded-[8px] focus:outline-none focus:border-[#2962FF]"
                    />
                  </div>
                </div>

                {/* Limit Price Input */}
                {orderType !== 'MARKET' && (
                  <div>
                    <label className="block text-[12px] font-medium text-[#787B86] mb-1">
                      Limit / Trigger Price (USD)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={orderLimitPrice}
                      onChange={(e) => setOrderLimitPrice(e.target.value)}
                      className="w-full h-[40px] px-3 text-[13px] font-semibold tabular-nums bg-[#FFFFFF] text-[#131722] border border-[#E0E3EB] rounded-[8px] focus:outline-none focus:border-[#2962FF]"
                    />
                  </div>
                )}

                {/* Estimated Value Summary */}
                <div className="p-3 rounded-[8px] bg-[#F0F3FA] flex items-center justify-between text-[13px] tabular-nums">
                  <span className="text-[#787B86]">Estimated Notional Value</span>
                  <span className="font-bold text-[#131722]">
                    $
                    {(
                      (parseInt(orderQty, 10) || 0) *
                      (orderType === 'MARKET'
                        ? stocks.find((s) => s.symbol === orderTicker)?.price || 0
                        : parseFloat(orderLimitPrice) || 0)
                    ).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOrderModalOpen(false)}
                    className="px-4 py-2 text-[13px] font-semibold text-[#131722] bg-transparent border border-[#E0E3EB] hover:border-[#131722] rounded-[8px] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-[13px] font-semibold text-[#FFFFFF] bg-[#2962FF] hover:bg-[#0049db] rounded-[8px] cursor-pointer"
                  >
                    Submit {orderSide} Order
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Quiet Institutional Footer */}
      <footer className="mt-12 border-t border-[#E0E3EB] bg-[#FFFFFF] py-6">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-[#787B86]">
          <div>
            Market Precision · Institutional Financial Data & Equity Analytics
          </div>
          <div className="flex items-center gap-5">
            <button onClick={() => setActiveNav('Markets')} className="hover:text-[#131722] cursor-pointer">
              Global Indices
            </button>
            <button onClick={() => setActiveNav('Screener')} className="hover:text-[#131722] cursor-pointer">
              Equity Screener
            </button>
            <button onClick={() => setActiveNav('Sectors')} className="hover:text-[#131722] cursor-pointer">
              GICS Sectors
            </button>
            <button onClick={() => setActiveNav('Economy')} className="hover:text-[#131722] cursor-pointer">
              Macro Calendar
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
