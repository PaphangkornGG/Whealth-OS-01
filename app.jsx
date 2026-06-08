const { Icon, TopWidgets, AllocationCard, RebalanceCard, AssetTable, QuickTxModal, LangProvider, useT, PerformanceChart, GoalsCard, TransactionLedger, CashflowCard, WatchlistCard, HoldingsPage, CashflowPage, GoalsPage, SettingsPage } = window;

// --- Navigation context — lets any component jump pages / open modals -----
const NavContext = React.createContext({});
function useNav() { return React.useContext(NavContext); }
window.useNav = useNav;

function TopBar({ page, setPage }) {
  const { t, lang, setLang } = useT();
  const nav = useNav();
  const [bellOpen, setBellOpen] = React.useState(false);
  const NAV = [
    { id: 'overview', label: t.nav.overview },
    { id: 'holdings', label: t.nav.holdings },
    { id: 'cashflow', label: t.nav.cashflow },
    { id: 'goals',    label: lang === 'th' ? 'เป้าหมาย' : 'Goals' },
    { id: 'settings', label: t.nav.settings },
  ];
  return (
    <header className="sticky top-0 z-30 bg-ink-0 border-b border-ink-200">
      <div className="max-w-[1440px] mx-auto px-6 h-[60px] flex items-center justify-between">
        <div className="flex items-center gap-8">
          <button onClick={() => setPage('overview')} className="flex items-center gap-2.5">
            <Logo />
            <div className="text-ink-800 font-semibold tracking-tight text-[15px]">Wealth OS</div>
            <span className="text-[10px] uppercase tracking-wider text-ink-500 border border-ink-200 rounded-md px-1.5 py-0.5">{t.beta}</span>
          </button>
          <nav className="hidden md:flex items-center gap-1 text-[13px]">
            {NAV.map(it => (
              <button
                key={it.id}
                onClick={() => setPage(it.id)}
                className={`px-2.5 py-1.5 rounded-md transition-colors ${page === it.id ? 'text-ink-800 bg-ink-100' : 'text-ink-500 hover:text-ink-700 hover:bg-ink-100/60'}`}
              >
                {it.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-ink-100 border border-ink-200 rounded-lg p-0.5">
            {[{ id: 'en', label: 'EN' }, { id: 'th', label: 'TH' }].map(l => (
              <button
                key={l.id}
                onClick={() => setLang(l.id)}
                className={`text-[11px] font-medium px-2 py-1 rounded-md transition-all min-w-[28px] ${lang === l.id ? 'bg-ink-200 text-ink-800 shadow-card' : 'text-ink-500 hover:text-ink-700'}`}
              >
                {l.label}
              </button>
            ))}
          </div>

          <button onClick={nav.openLedger} className="flex items-center gap-1.5 text-[12px] text-ink-500 hover:text-ink-700 px-2 py-1.5 rounded-lg hover:bg-ink-100 transition-colors" title={t.history}>
            <Icon.Activity size={14}/>
            <span className="hidden md:inline">{t.history}</span>
          </button>

          <button onClick={nav.openSearch} className="hidden lg:flex items-center gap-2 bg-ink-100 border border-ink-200 rounded-lg px-2.5 py-1.5 text-[12px] text-ink-500 hover:border-ink-300 transition-colors">
            <Icon.Search size={13}/>
            <span>{t.search}</span>
            <kbd className="ml-2 px-1.5 py-0.5 bg-ink-0 border border-ink-200 rounded text-[10px] font-mono">⌘K</kbd>
          </button>

          {/* Bell + notifications popover */}
          <div className="relative">
            <button onClick={() => setBellOpen(o => !o)} className="relative p-2 rounded-lg text-ink-500 hover:text-ink-700 hover:bg-ink-100 transition-colors">
              <Icon.Bell size={15}/>
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-warn rounded-full"></span>
            </button>
            {bellOpen && <NotificationsPanel onClose={() => setBellOpen(false)} setPage={setPage} />}
          </div>

          <button
            onClick={nav.openTx}
            className="flex items-center gap-2 bg-ink-700 text-ink-0 hover:bg-ink-800 transition-colors rounded-lg px-3 py-1.5 text-[13px] font-medium shadow-card"
          >
            <Icon.Plus size={14}/>
            {t.quickTx}
            <kbd className="ml-1 px-1 py-0.5 bg-ink-50/30 text-ink-100 rounded text-[10px] font-mono">N</kbd>
          </button>
          <div className="w-px h-6 bg-ink-200 mx-1"></div>
          <button onClick={() => setPage('settings')} className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-violet flex items-center justify-center text-[12px] font-semibold text-ink-0">
            NK
          </button>
        </div>
      </div>
    </header>
  );
}

function NotificationsPanel({ onClose, setPage }) {
  const { t, lang } = useT();
  const D = window.DataLayer;
  // Build live notifications from drift + recent transactions
  const drift = D.ALLOCATION.map(s => ({ ...s, abs: Math.abs(s.drift * 100) })).sort((a,b) => b.abs - a.abs)[0];
  const recentTx = D.TRANSACTIONS[0];
  const notifs = [];
  if (drift && drift.abs > 1) {
    notifs.push({
      id: 'drift',
      icon: <Icon.Alert size={14}/>,
      tone: 'warn',
      title: lang === 'th' ? `${t.classes[drift.id]} เบี่ยงจากเป้า ${drift.abs.toFixed(1)}%` : `${drift.label} drifted ${drift.abs.toFixed(1)}%`,
      body: lang === 'th' ? 'พิจารณาปรับสมดุลพอร์ต' : 'Consider rebalancing your portfolio',
      action: () => setPage('overview'),
    });
  }
  if (recentTx) {
    notifs.push({
      id: 'tx',
      icon: <Icon.Activity size={14}/>,
      tone: 'brand',
      title: lang === 'th' ? `บันทึก ${recentTx.type === 'buy' ? 'ซื้อ' : recentTx.type === 'sell' ? 'ขาย' : 'ปันผล'} ${recentTx.ticker}` : `Recent ${recentTx.type} of ${recentTx.ticker}`,
      body: recentTx.date.toLocaleDateString(),
      action: () => { onClose(); window.useNav && useNav().openLedger(); },
    });
  }
  notifs.push({
    id: 'div',
    icon: <Icon.Coins size={14}/>,
    tone: 'gain',
    title: lang === 'th' ? 'ปันผลคาดว่าได้รับเดือนนี้' : 'Dividends expected this month',
    body: D.fmtTHB(D.TOTAL_DIVS_YTD_THB * 0.18, { compact: true }),
    action: () => setPage('cashflow'),
  });

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose}></div>
      <div className="absolute right-0 top-full mt-2 z-50 w-[320px] bg-ink-50 border border-ink-300 rounded-xl shadow-pop scale-in overflow-hidden">
        <div className="px-4 py-3 border-b border-ink-200 flex items-center justify-between">
          <div className="text-[13px] font-semibold text-ink-800">{lang === 'th' ? 'การแจ้งเตือน' : 'Notifications'}</div>
          <span className="text-[10px] text-ink-500 num">{notifs.length}</span>
        </div>
        <div className="max-h-[360px] overflow-y-auto scroll-thin">
          {notifs.map(n => (
            <button
              key={n.id}
              onClick={() => { n.action && n.action(); onClose(); }}
              className="w-full flex items-start gap-3 px-4 py-3 hover:bg-ink-100 transition-colors text-left border-b border-ink-200 last:border-b-0"
            >
              <div className={`shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-${n.tone} bg-${n.tone}-soft border border-${n.tone}/20`}>
                {n.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] text-ink-800 font-medium">{n.title}</div>
                <div className="text-[11px] text-ink-500 mt-0.5">{n.body}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function Logo() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="6" fill="oklch(0.22 0.009 250)" stroke="oklch(0.32 0.012 250)"/>
      <path d="M6 16 L10 8 L12 13 L14 9 L18 16" stroke="oklch(0.78 0.13 230)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="18" cy="7" r="2" fill="oklch(0.78 0.16 152)"/>
    </svg>
  );
}

function Toast({ show, children }) {
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'}`}>
      <div className="bg-ink-100 border border-ink-300 rounded-lg shadow-pop px-4 py-2.5 flex items-center gap-3 text-[13px] text-ink-800">
        <span className="w-5 h-5 rounded-full bg-gain-soft text-gain flex items-center justify-center">
          <Icon.Check size={12}/>
        </span>
        {children}
      </div>
    </div>
  );
}

// --- Simple search palette ----------------------------------------------
function SearchPalette({ open, onClose, setPage }) {
  const { t, lang } = useT();
  const D = window.DataLayer;
  const [q, setQ] = React.useState('');
  const nav = useNav();

  React.useEffect(() => {
    if (open) setQ('');
  }, [open]);

  if (!open) return null;

  const query = q.toLowerCase().trim();
  const PAGES = [
    { id: 'overview', label: lang === 'th' ? 'ภาพรวม' : 'Overview',  icon: 'PieChart' },
    { id: 'holdings', label: lang === 'th' ? 'พอร์ตหลัก' : 'Holdings', icon: 'Wallet' },
    { id: 'cashflow', label: lang === 'th' ? 'กระแสเงิน' : 'Cashflow', icon: 'Coins' },
    { id: 'goals',    label: lang === 'th' ? 'เป้าหมาย' : 'Goals',    icon: 'Target' },
    { id: 'settings', label: lang === 'th' ? 'ตั้งค่า' : 'Settings',    icon: 'Settings' },
  ];
  const ACTIONS = [
    { id: 'new-tx',  label: lang === 'th' ? 'บันทึกธุรกรรมใหม่' : 'New transaction', icon: 'Plus', action: () => nav.openTx() },
    { id: 'history', label: lang === 'th' ? 'ดูประวัติ' : 'Open history',           icon: 'Activity', action: () => nav.openLedger() },
  ];
  const assets = D.ENRICHED.filter(a => !query || a.ticker.toLowerCase().includes(query) || a.name.toLowerCase().includes(query));
  const pagesFiltered = PAGES.filter(p => !query || p.label.toLowerCase().includes(query));
  const actionsFiltered = ACTIONS.filter(a => !query || a.label.toLowerCase().includes(query));

  function go(item) {
    if (item.id === 'new-tx' || item.id === 'history') item.action();
    else if (item.ticker) { setPage('holdings'); }
    else setPage(item.id);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 fade-in">
      <div className="absolute inset-0 bg-ink-900/50 transition-opacity" onClick={onClose}></div>
      <div className="relative max-w-[520px] mx-auto mt-[12vh] bg-ink-50 border border-ink-300 rounded-2xl shadow-pop scale-in overflow-hidden">
        <div className="px-4 py-3 border-b border-ink-200 flex items-center gap-2">
          <Icon.Search size={14} className="text-ink-500"/>
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={lang === 'th' ? 'ค้นหาหน้า สินทรัพย์ หรือคำสั่ง...' : 'Search pages, assets, or actions...'}
            onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
            className="flex-1 bg-transparent text-[14px] text-ink-800 placeholder:text-ink-400 focus:outline-none"
          />
          <kbd className="text-[10px] font-mono text-ink-500 px-1.5 py-0.5 bg-ink-100 border border-ink-200 rounded">ESC</kbd>
        </div>
        <div className="max-h-[420px] overflow-y-auto scroll-thin py-2">
          {pagesFiltered.length > 0 && <SearchGroup title={lang === 'th' ? 'หน้า' : 'Pages'} items={pagesFiltered} onPick={go}/>}
          {actionsFiltered.length > 0 && <SearchGroup title={lang === 'th' ? 'คำสั่ง' : 'Actions'} items={actionsFiltered} onPick={go}/>}
          {assets.length > 0 && (
            <SearchGroup
              title={lang === 'th' ? 'สินทรัพย์' : 'Assets'}
              items={assets.slice(0, 8).map(a => ({ id: a.ticker, label: a.ticker, sub: a.name, ticker: a.ticker }))}
              onPick={go}
            />
          )}
          {pagesFiltered.length === 0 && actionsFiltered.length === 0 && assets.length === 0 && (
            <div className="px-4 py-6 text-center text-[12px] text-ink-500">{lang === 'th' ? 'ไม่พบผลลัพธ์' : 'No results'}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function SearchGroup({ title, items, onPick }) {
  return (
    <div className="px-2 mb-2">
      <div className="text-[10px] uppercase tracking-wider text-ink-500 px-2 py-1">{title}</div>
      {items.map(it => {
        const Ic = Icon[it.icon];
        return (
          <button
            key={it.id}
            onClick={() => onPick(it)}
            className="w-full flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-ink-100 transition-colors text-left"
          >
            {Ic && (
              <span className="w-6 h-6 rounded-md bg-ink-100 border border-ink-200 flex items-center justify-center text-ink-500">
                <Ic size={12}/>
              </span>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-ink-800 truncate">{it.label}</div>
              {it.sub && <div className="text-[11px] text-ink-500 truncate">{it.sub}</div>}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// --- Overview page -----------------------------------------------------
function OverviewPage({ range, setRange }) {
  const { t } = useT();
  const nav = useNav();
  return (
    <>
      <div className="flex items-center justify-between fade-up">
        <div>
          <div className="text-ink-500 text-[12px] uppercase tracking-wider">{t.overview}</div>
          <h1 className="text-ink-800 text-[22px] font-semibold tracking-tight mt-0.5">{t.greet}</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-ink-100 border border-ink-200 rounded-lg p-0.5 text-[12px]">
            {['1D','1W','1M','3M','1Y','ALL'].map(p => (
              <button
                key={p}
                onClick={() => setRange(p)}
                className={`px-2.5 py-1 rounded-md transition-colors ${range === p ? 'bg-ink-200 text-ink-800' : 'text-ink-500 hover:text-ink-700'}`}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-ink-500 px-2.5 py-1.5 bg-ink-50 border border-ink-200 rounded-lg">
            <Icon.Calendar size={12}/>
            {t.todayDate}
          </div>
        </div>
      </div>

      <div className="fade-up" style={{ animationDelay: '30ms' }}>
        <TopWidgets />
      </div>

      <div className="fade-up" style={{ animationDelay: '60ms' }}>
        <PerformanceChart range={range} setRange={setRange} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4 fade-up" style={{ animationDelay: '90ms' }}>
        <AllocationCard />
        <RebalanceCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4 fade-up" style={{ animationDelay: '110ms' }}>
        <CashflowCard />
        <WatchlistCard />
      </div>

      <div className="fade-up" style={{ animationDelay: '130ms' }}>
        <GoalsCard />
      </div>

      <div className="fade-up" style={{ animationDelay: '150ms' }}>
        <AssetTable />
      </div>
    </>
  );
}

function Dashboard() {
  const { t } = useT();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalPrefill, setModalPrefill] = React.useState(null);
  const [ledgerOpen, setLedgerOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  const [range, setRange] = React.useState('1M');
  const [page, setPage] = React.useState(() => {
    try { return localStorage.getItem('wealthos_page') || 'overview'; } catch { return 'overview'; }
  });

  React.useEffect(() => {
    try { localStorage.setItem('wealthos_page', page); } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  React.useEffect(() => {
    const onKey = (e) => {
      const tgt = e.target;
      const inField = tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA' || tgt.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }
      if (inField) return;
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setModalPrefill(null);
        setModalOpen(true);
      }
      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        setLedgerOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function handleSave(tx) {
    setModalOpen(false);
    setModalPrefill(null);
    const action = tx.type === 'buy' ? t.bought : tx.type === 'sell' ? t.sold : t.loggedDiv;
    const onApp = tx.broker ? t.onApp(tx.broker) : '';
    const withFee = tx.fee ? t.feePart(tx.fee.toFixed(2)) : '';
    const body = tx.type === 'dividend'
      ? `${tx.ticker} · ${tx.amount.toLocaleString()}`
      : `${tx.amount} ${tx.ticker} @ ${tx.price.toLocaleString()}`;
    setToast(`${action} ${body}${onApp}${withFee}`);
    setTimeout(() => setToast(null), 3500);
  }

  const navValue = React.useMemo(() => ({
    goTo: (p) => setPage(p),
    openTx: (prefill) => { setModalPrefill(prefill || null); setModalOpen(true); },
    openLedger: () => setLedgerOpen(true),
    openSearch: () => setSearchOpen(true),
    toast: (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); },
  }), []);

  return (
    <NavContext.Provider value={navValue}>
      <div className="min-h-screen grid-bg">
        <TopBar page={page} setPage={setPage} />

        <main key={page} className="max-w-[1440px] mx-auto px-6 py-6 space-y-4 fade-in">
          {page === 'overview' && <OverviewPage range={range} setRange={setRange} />}
          {page === 'holdings' && <HoldingsPage />}
          {page === 'cashflow' && <CashflowPage />}
          {page === 'goals'    && <GoalsPage />}
          {page === 'settings' && <SettingsPage />}

          <footer className="pt-4 pb-2 flex items-center justify-between text-[11px] text-ink-500">
            <div className="flex items-center gap-4">
              <span>Wealth OS · v0.5.0</span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-gain"></span>
                {t.liveSync}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span>{t.pricesDelayed}</span>
              <span>{t.fxLabel(window.DataLayer.FX.USD_THB.toFixed(2))}</span>
            </div>
          </footer>
        </main>

        <QuickTxModal open={modalOpen} onClose={() => { setModalOpen(false); setModalPrefill(null); }} onSave={handleSave} prefill={modalPrefill} />
        <TransactionLedger open={ledgerOpen} onClose={() => setLedgerOpen(false)} />
        <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} setPage={setPage} />
        <Toast show={!!toast}>{toast}</Toast>
      </div>
    </NavContext.Provider>
  );
}

function App() {
  return (
    <LangProvider>
      <Dashboard />
    </LangProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
