// Wealth OS · Bento — light theme overview shell
const { useT, LangProvider } = window;
const { Icon } = window;
const D = window.DataLayer;
const B = window.Bento;

const NavContext = React.createContext({});
function useNav() { return React.useContext(NavContext); }
window.useNav = useNav;

function useProfile() {
  const DEFAULT = {
    name: 'Natthapong Kittirungroj',
    email: 'natthapong@example.com',
    initials: 'NK',
    avatarBg: 'brand',
  };
  const read = () => {
    try {
      const raw = localStorage.getItem('netto:profile');
      return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
    } catch { return DEFAULT; }
  };
  const [profile, setProfile] = React.useState(read);
  React.useEffect(() => {
    const onChange = () => setProfile(read());
    window.addEventListener('netto:profile-changed', onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener('netto:profile-changed', onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);
  return profile;
}
window.useProfile = useProfile;

// Short label for the top-bar pill ("Natthapong K.") from a full name.
function shortName(name) {
  if (!name) return '—';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1].charAt(0).toUpperCase()}.`;
}

// Compute initials from a full name when the saved value doesn't override.
function initialsFromName(name) {
  if (!name) return '—';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '—';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
}

const AVATAR_GRADIENTS = {
  brand:  'from-brand to-violet',
  violet: 'from-violet to-brand',
  gain:   'from-gain to-lime',
  warn:   'from-warn to-loss',
  loss:   'from-loss to-violet',
};

// Lightweight dropdown — closes on outside click or Escape.
function Dropdown({ open, onClose, align = 'right', children }) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose}></div>
      <div className={`absolute top-full mt-2 z-50 ${align === 'right' ? 'right-0' : 'left-0'}`}>
        {children}
      </div>
    </>
  );
}

function TopNav({ page, setPage }) {
  const { t, lang, setLang } = useT();
  const nav = useNav();
  const profile = useProfile();
  const [open, setOpen] = React.useState(null); // 'search' | 'share' | 'bell' | 'user' | null
  const close = () => setOpen(null);
  const NAV = [
    { id: 'overview', label: lang === 'th' ? 'แดชบอร์ด' : 'Dashboard',  icon: <Icon.Grid size={12}/> },
    { id: 'holdings', label: lang === 'th' ? 'พอร์ต'     : 'Holdings',    icon: <Icon.Bars size={12}/> },
    { id: 'cashflow', label: lang === 'th' ? 'กระแสเงิน' : 'Cashflow',    icon: <Icon.Coins size={12}/> },
    { id: 'goals',    label: lang === 'th' ? 'เป้าหมาย'  : 'Goals',       icon: <Icon.Target size={12}/> },
    { id: 'settings', label: lang === 'th' ? 'ตั้งค่า'    : 'Settings',    icon: <Icon.Settings size={12}/> },
  ];
  const displayInitials = profile.initials && profile.initials.length <= 3 ? profile.initials : initialsFromName(profile.name);
  const displayName = shortName(profile.name);
  const avatarGrad = AVATAR_GRADIENTS[profile.avatarBg] || AVATAR_GRADIENTS.brand;
  return (
    <div className="flex items-center justify-between mb-6">
      {/* Brand */}
      <button onClick={() => setPage('overview')} className="flex items-center gap-2 cursor-pointer">
        <Logo/>
        <span className="text-ink-900 font-bold tracking-tight text-[18px]">Wealth OS</span>
      </button>

      {/* Center segmented nav */}
      <nav className="hidden md:flex items-center bg-card border border-line rounded-full p-1 shadow-card">
        {NAV.map(it => (
          <button
            key={it.id}
            onClick={() => setPage(it.id)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all cursor-pointer ${page === it.id ? 'bg-surface-inverse text-white shadow-card' : 'text-ink-700 hover:text-ink-900'}`}
          >
            {it.icon}
            {it.label}
          </button>
        ))}
      </nav>

      {/* Right cluster */}
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-card border border-line rounded-full p-1">
          {[{ id: 'en', label: 'EN' }, { id: 'th', label: 'TH' }].map(l => (
            <button
              key={l.id}
              onClick={() => setLang(l.id)}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all cursor-pointer ${lang === l.id ? 'bg-surface-inverse text-white' : 'text-ink-500 hover:text-ink-900'}`}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative hidden lg:block">
          <button
            onClick={() => setOpen(open === 'search' ? null : 'search')}
            title={lang === 'th' ? 'ค้นหา (⌘K)' : 'Search (⌘K)'}
            className={`w-9 h-9 bg-card border border-line rounded-full flex items-center justify-center text-ink-700 hover:text-ink-900 hover:bg-surface-soft cursor-pointer transition-colors shadow-card ${open === 'search' ? 'border-brand text-brand' : ''}`}
          >
            <Icon.Search size={14}/>
          </button>
          <Dropdown open={open === 'search'} onClose={close}>
            <SearchPopover lang={lang} nav={nav} onClose={close} setPage={setPage}/>
          </Dropdown>
        </div>

        {/* Share */}
        <div className="relative">
          <button
            onClick={() => setOpen(open === 'share' ? null : 'share')}
            title={lang === 'th' ? 'แชร์' : 'Share'}
            className={`w-9 h-9 bg-card border border-line rounded-full flex items-center justify-center text-ink-700 hover:text-ink-900 hover:bg-surface-soft cursor-pointer transition-colors shadow-card ${open === 'share' ? 'border-brand text-brand' : ''}`}
          >
            <Icon.Share size={14}/>
          </button>
          <Dropdown open={open === 'share'} onClose={close}>
            <SharePopover lang={lang} nav={nav} onClose={close}/>
          </Dropdown>
        </div>

        {/* Bell */}
        <div className="relative">
          <button
            onClick={() => setOpen(open === 'bell' ? null : 'bell')}
            title={lang === 'th' ? 'การแจ้งเตือน' : 'Notifications'}
            className={`relative w-9 h-9 bg-card border border-line rounded-full flex items-center justify-center text-ink-700 hover:text-ink-900 hover:bg-surface-soft cursor-pointer transition-colors shadow-card ${open === 'bell' ? 'border-brand text-brand' : ''}`}
          >
            <Icon.Bell size={14}/>
            <span className="absolute top-2 right-2.5 w-1.5 h-1.5 rounded-full bg-loss"></span>
          </button>
          <Dropdown open={open === 'bell'} onClose={close}>
            <NotificationsPopover lang={lang} onClose={close}/>
          </Dropdown>
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setOpen(open === 'user' ? null : 'user')}
            className={`bg-card border border-line rounded-full p-1 pr-3 flex items-center gap-2 shadow-card hover:bg-surface-soft cursor-pointer transition-colors ${open === 'user' ? 'border-brand' : ''}`}
          >
            <div className={`w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-[10px] font-bold text-white ${profile.avatarImage ? 'bg-ink-100' : `bg-gradient-to-br ${avatarGrad}`}`}>
              {profile.avatarImage
                ? <img src={profile.avatarImage} alt="" className="w-full h-full object-cover"/>
                : displayInitials}
            </div>
            <span className="text-[12px] font-semibold text-ink-900 max-w-[140px] truncate">{displayName}</span>
            <Icon.ChevronDown size={10} className={`text-ink-500 transition-transform ${open === 'user' ? 'rotate-180' : ''}`}/>
          </button>
          <Dropdown open={open === 'user'} onClose={close}>
            <UserMenuPopover lang={lang} profile={profile} avatarGrad={avatarGrad} displayInitials={displayInitials} setPage={setPage} onClose={close}/>
          </Dropdown>
        </div>
      </div>
    </div>
  );
}

// ─── Popovers ─────────────────────────────────────────────────────────
function PopoverCard({ children, w = 'w-72' }) {
  return (
    <div className={`${w} bg-card border border-line2 rounded-2xl shadow-pop overflow-hidden`}>
      {children}
    </div>
  );
}

function SearchPopover({ lang, nav, onClose, setPage }) {
  const [q, setQ] = React.useState('');
  const D = window.DataLayer;
  const results = React.useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    return D.ENRICHED
      .filter(a => a.ticker.toLowerCase().includes(query) || a.name.toLowerCase().includes(query))
      .slice(0, 6);
  }, [q]);
  const pages = [
    { id: 'overview', label: lang === 'th' ? 'แดชบอร์ด' : 'Dashboard' },
    { id: 'holdings', label: lang === 'th' ? 'พอร์ต' : 'Holdings' },
    { id: 'cashflow', label: lang === 'th' ? 'กระแสเงิน' : 'Cashflow' },
    { id: 'goals', label: lang === 'th' ? 'เป้าหมาย' : 'Goals' },
    { id: 'settings', label: lang === 'th' ? 'ตั้งค่า' : 'Settings' },
  ].filter(p => !q || p.label.toLowerCase().includes(q.toLowerCase()));
  return (
    <PopoverCard w="w-80">
      <div className="px-3 py-2.5 border-b border-line flex items-center gap-2">
        <Icon.Search size={13} className="text-ink-500"/>
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={lang === 'th' ? 'ค้นหา ticker หรือหน้า…' : 'Search ticker or page…'}
          className="flex-1 bg-transparent text-[13px] text-ink-900 placeholder:text-ink-500 focus:outline-none"
        />
        <kbd className="text-[10px] text-ink-500 font-mono bg-surface-soft border border-line rounded px-1.5 py-0.5">ESC</kbd>
      </div>
      <div className="max-h-72 overflow-y-auto scroll-thin py-1.5">
        {results.length > 0 && (
          <div>
            <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-ink-500 font-semibold">{lang === 'th' ? 'สินทรัพย์' : 'Holdings'}</div>
            {results.map(a => {
              const cls = D.ASSET_CLASSES[a.cls];
              return (
                <button
                  key={`${a.ticker}-${a.broker}`}
                  onClick={() => { onClose(); setPage('holdings'); }}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-surface-soft cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <StockLogo ticker={a.ticker} cls={a.cls} size={24} />
                    <div className="min-w-0 text-left">
                      <div className="text-[13px] text-ink-900 font-medium num">{a.ticker}</div>
                      <div className="text-[11px] text-ink-500 truncate">{a.name}</div>
                    </div>
                  </div>
                  <div className="num text-[12px] text-ink-700 shrink-0">฿{Math.round(a.valueTHB).toLocaleString('en-US')}</div>
                </button>
              );
            })}
          </div>
        )}
        {pages.length > 0 && (
          <div className={results.length > 0 ? 'mt-1 pt-1 border-t border-line' : ''}>
            <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-ink-500 font-semibold">{lang === 'th' ? 'ไปยังหน้า' : 'Pages'}</div>
            {pages.map(p => (
              <button
                key={p.id}
                onClick={() => { onClose(); setPage(p.id); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-surface-soft cursor-pointer transition-colors text-left"
              >
                <Icon.ChevronDown size={11} className="text-ink-500 -rotate-90"/>
                <span className="text-[13px] text-ink-900">{p.label}</span>
              </button>
            ))}
          </div>
        )}
        <div className="mt-1 pt-1 border-t border-line">
          <button
            onClick={() => { onClose(); nav.openTx(); }}
            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-surface-soft cursor-pointer transition-colors text-left"
          >
            <Icon.Plus size={11} className="text-brand"/>
            <span className="text-[13px] text-ink-900">{lang === 'th' ? 'บันทึกธุรกรรมใหม่' : 'New transaction'}</span>
            <kbd className="ml-auto text-[10px] text-ink-500 font-mono bg-surface-soft border border-line rounded px-1.5 py-0.5">N</kbd>
          </button>
        </div>
      </div>
    </PopoverCard>
  );
}

function SharePopover({ lang, nav, onClose }) {
  const items = [
    { id: 'copy',     icon: <Icon.Check size={13}/>,     th: 'คัดลอกลิงก์รายงาน',        en: 'Copy report link' },
    { id: 'pdf',      icon: <Icon.ArrowDown size={13}/>, th: 'ส่งออกเป็น PDF',           en: 'Export as PDF' },
    { id: 'csv',      icon: <Icon.ArrowDown size={13}/>, th: 'ส่งออกเป็น CSV',           en: 'Export as CSV' },
    { id: 'accountant', icon: <Icon.Plus size={13}/>,   th: 'แชร์ให้ที่ปรึกษาภาษี',     en: 'Share with accountant' },
  ];
  return (
    <PopoverCard>
      <div className="px-3 py-2 border-b border-line">
        <div className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold">{lang === 'th' ? 'แชร์ / ส่งออก' : 'Share / Export'}</div>
      </div>
      <div className="py-1">
        {items.map(it => (
          <button
            key={it.id}
            onClick={() => { onClose(); nav.toast(`${lang === 'th' ? it.th : it.en} · ${lang === 'th' ? 'จำลอง' : 'demo'}`); }}
            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-surface-soft cursor-pointer transition-colors text-left"
          >
            <span className="w-6 h-6 rounded-md bg-surface-soft flex items-center justify-center text-ink-700">{it.icon}</span>
            <span className="text-[13px] text-ink-900">{lang === 'th' ? it.th : it.en}</span>
          </button>
        ))}
      </div>
    </PopoverCard>
  );
}

function NotificationsPopover({ lang, onClose }) {
  const items = [
    { id: 1, tone: 'gain',  th: 'ปันผล AAPL ฿1,820',          en: 'AAPL dividend ฿1,820',          sub: lang === 'th' ? '2 ชั่วโมงที่แล้ว' : '2 hours ago', unread: true },
    { id: 2, tone: 'warn',  th: 'พอร์ตเบี่ยง 3.4% จากเป้า',   en: 'Allocation drift +3.4%',        sub: lang === 'th' ? 'เช้านี้' : 'This morning', unread: true },
    { id: 3, tone: 'brand', th: 'BTC ถึงราคาแจ้งเตือน',       en: 'BTC hit price alert',           sub: lang === 'th' ? 'เมื่อวาน' : 'Yesterday', unread: true },
    { id: 4, tone: 'loss',  th: 'NVDA ลด 4.2%',                en: 'NVDA down 4.2%',                sub: lang === 'th' ? '2 วันก่อน' : '2 days ago', unread: false },
    { id: 5, tone: 'gain',  th: 'รายงานรายสัปดาห์พร้อมแล้ว',   en: 'Weekly report ready',           sub: lang === 'th' ? '3 วันก่อน' : '3 days ago', unread: false },
  ];
  return (
    <PopoverCard w="w-80">
      <div className="px-3 py-2.5 border-b border-line flex items-center justify-between">
        <div className="text-[12px] font-semibold text-ink-900">{lang === 'th' ? 'การแจ้งเตือน' : 'Notifications'}</div>
        <button onClick={onClose} className="text-[11px] text-brand hover:underline cursor-pointer">{lang === 'th' ? 'อ่านทั้งหมด' : 'Mark all read'}</button>
      </div>
      <div className="max-h-80 overflow-y-auto scroll-thin">
        {items.map(it => (
          <div key={it.id} className={`flex items-start gap-3 px-3 py-2.5 border-b border-line/40 hover:bg-surface-soft cursor-pointer transition-colors ${it.unread ? '' : 'opacity-70'}`}>
            <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${it.unread ? 'bg-loss' : 'bg-transparent'}`}></span>
            <div className={`w-7 h-7 rounded-full bg-${it.tone}-soft text-${it.tone} flex items-center justify-center shrink-0`}>
              <Icon.Bell size={12}/>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] text-ink-900 font-medium">{lang === 'th' ? it.th : it.en}</div>
              <div className="text-[10.5px] text-ink-500 mt-0.5">{it.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </PopoverCard>
  );
}

function UserMenuPopover({ lang, profile, avatarGrad, displayInitials, setPage, onClose }) {
  const items = [
    { id: 'profile',  icon: <Icon.Settings size={13}/>, th: 'โปรไฟล์ & การตั้งค่า', en: 'Profile & Settings', go: () => setPage('settings') },
    { id: 'goals',    icon: <Icon.Target size={13}/>,   th: 'เป้าหมายการลงทุน',     en: 'Investment goals',   go: () => setPage('goals') },
    { id: 'premium',  icon: <Icon.Sparkles size={13}/>, th: 'อัปเกรด Premium',      en: 'Upgrade to Premium', go: () => setPage('settings') },
    { id: 'help',     icon: <Icon.Alert size={13}/>,    th: 'ศูนย์ช่วยเหลือ',         en: 'Help center',        go: null },
    { id: 'signout',  icon: <Icon.ArrowUp size={13}/>,  th: 'ออกจากระบบ',            en: 'Sign out',           go: null, danger: true },
  ];
  return (
    <PopoverCard>
      {/* Header */}
      <div className="px-3 py-3 border-b border-line flex items-center gap-2.5">
        <div className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-[13px] font-bold text-white shrink-0 ${profile.avatarImage ? 'bg-ink-100' : `bg-gradient-to-br ${avatarGrad}`}`}>
          {profile.avatarImage
            ? <img src={profile.avatarImage} alt="" className="w-full h-full object-cover"/>
            : displayInitials}
        </div>
        <div className="min-w-0">
          <div className="text-[13px] text-ink-900 font-semibold truncate">{profile.name || '—'}</div>
          <div className="text-[11px] text-ink-500 truncate">{profile.email || '—'}</div>
          <div className="mt-1 inline-flex items-center gap-1 text-[9px] font-semibold text-warn bg-warn-soft border border-warn/20 rounded-full px-1.5 py-0.5">
            <Icon.Sparkles size={9}/>
            PREMIUM
          </div>
        </div>
      </div>
      <div className="py-1">
        {items.map(it => (
          <button
            key={it.id}
            onClick={() => { onClose(); it.go?.(); }}
            className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-surface-soft cursor-pointer transition-colors text-left ${it.danger ? 'text-loss' : 'text-ink-900'}`}
          >
            <span className={`w-6 h-6 rounded-md flex items-center justify-center ${it.danger ? 'bg-loss-soft text-loss' : 'bg-surface-soft text-ink-700'}`}>{it.icon}</span>
            <span className="text-[13px]">{lang === 'th' ? it.th : it.en}</span>
          </button>
        ))}
      </div>
    </PopoverCard>
  );
}

function Logo() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <path d="M6 22 L10 8 L14 18 L18 12 L22 22" stroke="oklch(0.55 0.22 264)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="24" cy="10" r="3.5" fill="oklch(0.85 0.18 130)"/>
    </svg>
  );
}

function OverviewPage() {
  return (
    <div className="space-y-4 fade-up">
      {/* Row 1: Balance + Income + Expense */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr_1fr] gap-4">
        <B.BalanceCard />
        <B.PLCard />
        <B.DividendYTDCard />
      </div>

      {/* Row 2: Goals + Cashflow chart + right rail */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr_1fr] gap-4">
        <B.GoalsBento />
        <B.CashflowBento />
        <div className="space-y-4">
          <B.TodayReceivedCard />
          <B.DividendYieldCard />
          <B.DividendCalendarCard />
        </div>
      </div>

      {/* Row 3: Performance chart wide + Watchlist on side */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4">
        <window.PerformanceChart range="1M" setRange={() => {}} />
        <window.WatchlistCard />
      </div>

      {/* Row 4: Allocation + Rebalancer */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
        <window.AllocationCard />
        <window.RebalanceCard />
      </div>

      {/* Row 5: Transactions ledger preview */}
      <B.TransactionsBento />

      {/* Row 6: Full holdings table */}
      <window.AssetTable />
    </div>
  );
}

function Toast({ show, children }) {
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'}`}>
      <div className="bg-surface-inverse text-white border border-line2 rounded-full shadow-pop px-4 py-2.5 flex items-center gap-3 text-[13px]">
        <span className="w-5 h-5 rounded-full bg-gain flex items-center justify-center"><Icon.Check size={12}/></span>
        {children}
      </div>
    </div>
  );
}

function App() {
  const [page, setPage] = React.useState(() => {
    try { return localStorage.getItem('wealthos_bento_page') || 'overview'; } catch { return 'overview'; }
  });
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalPrefill, setModalPrefill] = React.useState(null);
  const [ledgerOpen, setLedgerOpen] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  const [refreshKey, setRefreshKey] = React.useState(0);

  // Hydrate user-entered transactions from localStorage on first mount.
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('netto:userTxs');
      if (!raw) return;
      const userTxs = JSON.parse(raw);
      if (!Array.isArray(userTxs) || userTxs.length === 0) return;
      const D = window.DataLayer;
      // Avoid duplicate hydration if user reopens during the same session
      const existingIds = new Set(D.TRANSACTIONS.map(t => t.id));
      const fresh = userTxs.filter(t => !existingIds.has(t.id)).map(t => ({ ...t, date: new Date(t.date) }));
      if (fresh.length === 0) return;
      // Re-apply each tx to the in-memory data layer so totals reflect it on reload
      fresh.forEach(tx => {
        D.TRANSACTIONS.unshift(tx);
        const held = D.ENRICHED.find(a => a.ticker === tx.ticker);
        if (!held) return;
        if (tx.type === 'buy' && tx.units && tx.price) {
          const newUnits = held.units + tx.units;
          const newCost = held.cost + tx.units * tx.price;
          held.units = newUnits;
          held.cost = newCost;
          held.avgCost = newCost / newUnits;
          held.price = tx.price;
          held.value = newUnits * tx.price;
          held.valueTHB = held.ccy === 'USD' ? held.value * D.FX.USD_THB : held.value;
          held.unrealized = held.value - held.cost;
          held.unrealizedPct = (held.unrealized / held.cost) * 100;
        } else if (tx.type === 'sell' && tx.units && tx.price) {
          const newUnits = Math.max(0, held.units - tx.units);
          const sellRatio = held.units > 0 ? newUnits / held.units : 0;
          held.cost = held.cost * sellRatio;
          held.units = newUnits;
          held.value = newUnits * tx.price;
          held.valueTHB = held.ccy === 'USD' ? held.value * D.FX.USD_THB : held.value;
          held.unrealized = held.value - held.cost;
          held.unrealizedPct = held.cost > 0 ? (held.unrealized / held.cost) * 100 : 0;
          held.price = tx.price;
        } else if (tx.type === 'dividend') {
          held.dividendsYTD = (held.dividendsYTD || 0) + tx.total;
          held.dividendsLifetime = (held.dividendsLifetime || 0) + tx.total;
        }
      });
      D.TOTAL_THB = D.ENRICHED.reduce((s, a) => s + a.valueTHB, 0);
      D.TOTAL_COST_THB = D.ENRICHED.reduce((s, a) => s + (a.ccy === 'USD' ? a.cost * D.FX.USD_THB : a.cost), 0);
      D.TOTAL_DIVS_YTD_THB = D.ENRICHED.reduce((s, a) => s + (a.ccy === 'USD' ? (a.dividendsYTD || 0) * D.FX.USD_THB : (a.dividendsYTD || 0)), 0);
      setRefreshKey(k => k + 1);
    } catch {}
  }, []);

  React.useEffect(() => {
    try { localStorage.setItem('wealthos_bento_page', page); } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  React.useEffect(() => {
    const onKey = (e) => {
      const tgt = e.target;
      const inField = tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA' || tgt.isContentEditable);
      if (inField) return;
      if (e.key === 'n' || e.key === 'N') { e.preventDefault(); setModalPrefill(null); setModalOpen(true); }
      if (e.key === 'h' || e.key === 'H') { e.preventDefault(); setLedgerOpen(true); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const navValue = React.useMemo(() => ({
    goTo: setPage,
    openTx: (prefill) => { setModalPrefill(prefill || null); setModalOpen(true); },
    openLedger: () => setLedgerOpen(true),
    openSearch: () => showToast('Search palette coming to bento'),
    toast: showToast,
  }), []);

  function handleSave(tx) {
    setModalOpen(false);
    setModalPrefill(null);

    // 1) Persist the transaction into the live data layer so the ledger,
    //    cashflow chart, and recent-list pick it up immediately.
    const D = window.DataLayer;
    const tickerUpper = (tx.ticker || '').toUpperCase();
    // Resolve broker id from the label the modal sent back.
    let brokerId = null;
    if (tx.broker) {
      const match = Object.values(D.BROKERS).find(b => b.label === tx.broker);
      brokerId = match ? match.id : tx.broker.toLowerCase().replace(/[^a-z0-9]/g, '_');
    }
    // Find the EXACT (ticker, broker) lot. For sells/dividends without a
    // broker pick, fall back to the first holding of that ticker.
    let held = brokerId
      ? D.ENRICHED.find(a => a.ticker === tickerUpper && a.broker === brokerId)
      : null;
    if (!held && tx.type !== 'buy') {
      held = D.ENRICHED.find(a => a.ticker === tickerUpper);
      if (held && !brokerId) brokerId = held.broker;
    }
    // Reference any holding (any broker) of this ticker for metadata fallback.
    const sibling = D.ENRICHED.find(a => a.ticker === tickerUpper);
    // Infer currency + class for NEW positions (when not already held).
    const CRYPTO_TICKERS = ['BTC','ETH','SOL','BNB','XRP','ADA','DOGE'];
    const THAI_TICKERS = ['PTT','AOT','KBANK','SCB','BBL','ADVANC','CPALL','TISCO'];
    const ccy = held?.ccy || sibling?.ccy
      || (CRYPTO_TICKERS.includes(tickerUpper) ? 'USD'
          : THAI_TICKERS.includes(tickerUpper) ? 'THB'
          : tickerUpper.includes('-') || tickerUpper.includes('&') ? 'THB' // Thai mutual fund convention
          : /^[A-Z]{1,5}$/.test(tickerUpper) ? 'USD'  // short ALL-CAPS => US stock
          : 'THB');
    const cls = held?.cls || sibling?.cls
      || (CRYPTO_TICKERS.includes(tickerUpper) ? 'crypto'
          : THAI_TICKERS.includes(tickerUpper) ? 'th'
          : tickerUpper.includes('-') || tickerUpper.includes('&') ? 'fund'
          : ccy === 'USD' ? 'us'
          : 'th');
    const newTx = {
      id: `user-${Date.now()}`,
      // tx.date is a YYYY-MM-DD string from the modal's <input type="date">.
      // Anchor it to local noon so the date doesn't shift across timezones.
      date: tx.date ? new Date(`${tx.date}T12:00:00`) : new Date(),
      type: tx.type,
      ticker: tickerUpper,
      name: held?.name || tickerUpper,
      cls,
      broker: brokerId,
      units: tx.type === 'dividend' ? null : tx.amount,
      price: tx.type === 'dividend' ? null : tx.price,
      fee: tx.fee || 0,
      ccy,
      total: tx.type === 'dividend' ? tx.amount : tx.amount * tx.price,
    };
    D.TRANSACTIONS.unshift(newTx);

    // 2) Mutate the matching ENRICHED position so portfolio totals update.
    //    On a BUY into a new (ticker, broker) lot, create a fresh position.
    if (!held && tx.type === 'buy' && brokerId) {
      held = {
        ticker: tickerUpper,
        name: sibling?.name || tickerUpper,
        cls,
        ccy,
        broker: brokerId,
        units: 0,
        avgCost: tx.price,
        cost: 0,
        price: tx.price,
        value: 0,
        valueTHB: 0,
        unrealized: 0,
        unrealizedPct: 0,
        totalReturn: 0,
        totalReturnPct: 0,
        dividendsLifetime: 0,
        dividendsYTD: 0,
        feesLifetime: 0,
        dayChangePct: 0,
        spark: sibling?.spark || Array.from({ length: 30 }, (_, i) => 100 + i * 0.1),
      };
      D.ENRICHED.push(held);
    }
    if (held) {
      if (tx.type === 'buy') {
        const newUnits = held.units + tx.amount;
        const newCost = held.cost + tx.amount * tx.price;
        held.units = newUnits;
        held.cost = newCost;
        held.avgCost = newCost / newUnits;
        held.price = tx.price; // latest mark
        held.value = newUnits * tx.price;
        held.valueTHB = ccy === 'USD' ? held.value * D.FX.USD_THB : held.value;
        held.unrealized = held.value - held.cost;
        held.unrealizedPct = (held.unrealized / held.cost) * 100;
        held.feesLifetime = (held.feesLifetime || 0) + (tx.fee || 0);
      } else if (tx.type === 'sell') {
        const newUnits = Math.max(0, held.units - tx.amount);
        // Reduce cost proportionally
        const sellRatio = newUnits / held.units;
        const newCost = held.cost * sellRatio;
        held.units = newUnits;
        held.cost = newCost;
        held.value = newUnits * tx.price;
        held.valueTHB = ccy === 'USD' ? held.value * D.FX.USD_THB : held.value;
        held.unrealized = held.value - held.cost;
        held.unrealizedPct = held.cost > 0 ? (held.unrealized / held.cost) * 100 : 0;
        held.price = tx.price;
      } else if (tx.type === 'dividend') {
        held.dividendsYTD = (held.dividendsYTD || 0) + tx.amount;
        held.dividendsLifetime = (held.dividendsLifetime || 0) + tx.amount;
      }
    }

    // 3) Recompute portfolio aggregates.
    D.TOTAL_THB = D.ENRICHED.reduce((s, a) => s + a.valueTHB, 0);
    D.TOTAL_COST_THB = D.ENRICHED.reduce((s, a) => s + (a.ccy === 'USD' ? a.cost * D.FX.USD_THB : a.cost), 0);
    D.TOTAL_DIVS_YTD_THB = D.ENRICHED.reduce((s, a) => s + (a.ccy === 'USD' ? (a.dividendsYTD || 0) * D.FX.USD_THB : (a.dividendsYTD || 0)), 0);

    // 4) Persist user-entered txs across reloads.
    try {
      const userTxs = JSON.parse(localStorage.getItem('netto:userTxs') || '[]');
      userTxs.unshift({ ...newTx, date: newTx.date.toISOString() });
      localStorage.setItem('netto:userTxs', JSON.stringify(userTxs.slice(0, 200)));
    } catch {}

    // 5) Force re-render of the whole app so derived cards reflect new totals.
    setRefreshKey(k => k + 1);

    // 6) Friendly toast — show ticker + impact
    const verb = tx.type === 'buy' ? (window.useT ? '' : '') : '';
    const lang = (document.documentElement.lang || 'en').toLowerCase();
    const verbTh = { buy: 'ซื้อ', sell: 'ขาย', dividend: 'รับปันผล' }[tx.type] || tx.type;
    const verbEn = { buy: 'Bought', sell: 'Sold', dividend: 'Dividend' }[tx.type] || tx.type;
    const isTh = (window.localStorage.getItem('wealthos_lang') || 'en') === 'th';
    const amountStr = tx.type === 'dividend'
      ? `฿${Math.round(tx.amount).toLocaleString('en-US')}`
      : `${tx.amount.toLocaleString('en-US', { maximumFractionDigits: 4 })} @ ${ccy === 'USD' ? '$' : '฿'}${tx.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
    showToast(`${isTh ? verbTh : verbEn} ${tickerUpper} · ${amountStr}`);
  }

  return (
    <LangProvider>
      <NavContext.Provider value={navValue}>
        <div className="max-w-[1440px] mx-auto">
          <TopNav page={page} setPage={setPage}/>

          <div key={`${page}-${refreshKey}`} className="fade-in space-y-4">
            {page === 'overview' && <OverviewPage/>}
            {page === 'holdings' && <window.HoldingsPage/>}
            {page === 'cashflow' && <window.CashflowPage/>}
            {page === 'goals'    && <window.GoalsPage/>}
            {page === 'settings' && <window.SettingsPage/>}
          </div>

          <div className="mt-6 flex items-center justify-between text-[11px] text-ink-500 px-2">
            <div className="flex items-center gap-3">
              <span>Wealth OS · v0.6</span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-gain"></span>
                Live · last sync 12s ago
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span>Prices: 15-min delayed</span>
              <span>FX: ฿{window.DataLayer.FX.USD_THB.toFixed(2)} / USD</span>
            </div>
          </div>
        </div>

        <window.QuickTxModal open={modalOpen} onClose={() => { setModalOpen(false); setModalPrefill(null); }} onSave={handleSave} prefill={modalPrefill}/>
        <window.TransactionLedger open={ledgerOpen} onClose={() => setLedgerOpen(false)}/>
        <Toast show={!!toast}>{toast}</Toast>
      </NavContext.Provider>
    </LangProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
