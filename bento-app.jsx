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
      let base = { ...DEFAULT };
      const user = window.AppUser;
      let finalProfile = raw ? { ...base, ...JSON.parse(raw) } : base;
      if (user) {
        finalProfile.email = user.email;
        if (user.user_metadata) {
          const meta = user.user_metadata;
          if (meta.full_name) {
            finalProfile.name = meta.full_name;
            const parts = finalProfile.name.trim().split(/\s+/).filter(Boolean);
            if (parts.length >= 2) finalProfile.initials = (parts[0][0] + parts[1][0]).toUpperCase();
            else if (parts.length === 1) finalProfile.initials = parts[0].slice(0, 2).toUpperCase();
          }
          if (meta.avatarBg) finalProfile.avatarBg = meta.avatarBg;
          if (meta.avatarImage !== undefined) finalProfile.avatarImage = meta.avatarImage;
        }
      }
      return finalProfile;
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
  const [open, setOpen] = React.useState(null);
  const close = () => setOpen(null);

  const [notifications, setNotifications] = React.useState(() => {
    try {
      const raw = localStorage.getItem('netto:notifications');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [
      { id: Date.now(), tone: 'brand', th: 'ยินดีต้อนรับสู่ Wealth OS!', en: 'Welcome to Wealth OS!', sub: lang === 'th' ? 'เพิ่งเข้ามา' : 'Just now', unread: true },
      { id: Date.now()-1, tone: 'gain', th: 'เริ่มจัดพอร์ตการลงทุนของคุณ', en: 'Start managing your portfolio', sub: lang === 'th' ? 'วันนี้' : 'Today', unread: true }
    ];
  });
  const unreadCount = notifications.filter(n => n.unread).length;
  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, unread: false }));
    setNotifications(updated);
    localStorage.setItem('netto:notifications', JSON.stringify(updated));
  };
  const dismiss = (id) => {
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    localStorage.setItem('netto:notifications', JSON.stringify(updated));
  };
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
            {unreadCount > 0 && <span className="absolute top-2 right-2.5 w-1.5 h-1.5 rounded-full bg-loss"></span>}
          </button>
          <Dropdown open={open === 'bell'} onClose={close}>
            <NotificationsPopover lang={lang} notifications={notifications} onMarkAllRead={markAllRead} onDismiss={dismiss} onClose={close}/>
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

function NotificationsPopover({ lang, notifications, onMarkAllRead, onDismiss, onClose }) {
  return (
    <PopoverCard w="w-80">
      <div className="px-3 py-2.5 border-b border-line flex items-center justify-between">
        <div className="text-[12px] font-semibold text-ink-900">{lang === 'th' ? 'การแจ้งเตือน' : 'Notifications'}</div>
        {notifications.some(n => n.unread) && (
          <button onClick={onMarkAllRead} className="text-[11px] text-brand hover:underline cursor-pointer">{lang === 'th' ? 'อ่านทั้งหมด' : 'Mark all read'}</button>
        )}
      </div>
      <div className="max-h-80 overflow-y-auto scroll-thin">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-ink-500 text-[12px]">{lang === 'th' ? 'ไม่มีการแจ้งเตือนใหม่' : 'No new notifications'}</div>
        ) : notifications.map(it => (
          <div key={it.id} onClick={() => onDismiss(it.id)} className={`flex items-start gap-3 px-3 py-2.5 border-b border-line/40 hover:bg-surface-soft cursor-pointer transition-colors ${it.unread ? '' : 'opacity-70'}`}>
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
    { id: 'help',     icon: <Icon.Alert size={13}/>,    th: 'ศูนย์ช่วยเหลือ',         en: 'Help center',        go: null },
    { id: 'signout',  icon: <Icon.ArrowUp size={13}/>,  th: 'ออกจากระบบ',            en: 'Sign out',           go: async () => {
      try {
        const supabase = window.supabaseClient;
        if (supabase) {
          await supabase.auth.signOut();
        }
      } catch (err) {
        console.error("TopNav signout error", err);
      } finally {
        try {
          localStorage.setItem('netto:isGuest', 'false');
        } catch (e) {}
        window.location.reload();
      }
    }, danger: true },
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

function Logo({ className = "w-8 h-8" }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="wealth-logo-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="oklch(0.45 0.2 260)" />
          <stop offset="1" stopColor="oklch(0.3 0.15 280)" />
        </linearGradient>
        <linearGradient id="wealth-logo-accent" x1="8" y1="12" x2="24" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="oklch(0.9 0.1 200)" />
          <stop offset="1" stopColor="oklch(0.75 0.15 250)" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#wealth-logo-grad)" />
      <path d="M8 14 L12 22 L16 16 L20 22 L24 10" stroke="url(#wealth-logo-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24" cy="10" r="2.5" fill="oklch(0.85 0.18 130)" />
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

function LoginPortal({ onGuest, lang }) {
  const [authMode, setAuthMode] = React.useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [dob, setDob] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState(null);
  const [successMsg, setSuccessMsg] = React.useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    const supabase = window.supabaseClient;
    if (!supabase) {
      setErrorMsg(lang === 'th' ? 'ไม่สามารถเชื่อมต่อระบบฐานข้อมูลได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต' : 'Cannot connect to database. Please check your internet connection.');
      return;
    }

    if (!email.trim() || !password.trim() || (authMode === 'signup' && !fullName.trim())) {
      setErrorMsg(lang === 'th' ? 'กรุณาตรวจสอบข้อมูลให้ครบถ้วน' : 'Please fill out all required fields');
      return;
    }

    setLoading(true);
    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            data: { full_name: fullName.trim(), phone: phone.trim(), dob: dob.trim() }
          }
        });
        if (error) throw error;
        if (data.user && data.session === null) {
          setSuccessMsg(lang === 'th' ? 'สมัครสมาชิกสำเร็จ! โปรดตรวจสอบอีเมลเพื่อยืนยันตน' : 'Signed up successfully! Check your email to verify.');
        } else {
          setSuccessMsg(lang === 'th' ? 'สมัครสมาชิกสำเร็จและเข้าสู่ระบบเรียบร้อย!' : 'Registered and signed in successfully!');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });
        if (error) throw error;
        setSuccessMsg(lang === 'th' ? 'เข้าสู่ระบบสำเร็จ!' : 'Signed in successfully!');
      }
      setEmail('');
      setPassword('');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] bg-card border border-line rounded-2xl p-6 shadow-pop">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 flex items-center justify-center mb-3">
            <Logo className="w-12 h-12" />
          </div>
          <h1 className="text-ink-800 text-[20px] font-bold tracking-tight">Wealth OS</h1>
          <p className="text-ink-500 text-[12px] mt-1">
            {lang === 'th' ? 'ระบบจัดการและวิเคราะห์พอร์ตการลงทุนอัจฉริยะ' : 'Smart Wealth Management & Portfolio Analytics'}
          </p>
        </div>

        <div className="flex items-center gap-1 bg-ink-100 border border-ink-200 rounded-lg p-0.5 text-[12px] mb-4">
          <button
            type="button"
            onClick={() => { setAuthMode('signin'); setErrorMsg(null); }}
            className={`flex-1 py-2 rounded-md transition-colors text-center font-medium ${authMode === 'signin' ? 'bg-card text-ink-800 shadow-card' : 'text-ink-500 hover:text-ink-700'}`}
          >
            {lang === 'th' ? 'เข้าสู่ระบบ' : 'Sign In'}
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('signup'); setErrorMsg(null); }}
            className={`flex-1 py-2 rounded-md transition-colors text-center font-medium ${authMode === 'signup' ? 'bg-card text-ink-800 shadow-card' : 'text-ink-500 hover:text-ink-700'}`}
          >
            {lang === 'th' ? 'สมัครสมาชิก' : 'Create Account'}
          </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {authMode === 'signup' && (<>
            <label className="block bg-ink-100 border border-ink-200 rounded-lg px-3 py-2.5 focus-within:border-brand focus-within:bg-card transition-colors">
              <div className="text-ink-500 text-[10px] uppercase tracking-wider font-semibold">{lang === 'th' ? 'ชื่อ-นามสกุล' : 'Full Name'}</div>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-transparent text-ink-800 text-[13px] mt-0.5 focus:outline-none placeholder:text-ink-400"
              />
            </label>
            <label className="block bg-ink-100 border border-ink-200 rounded-lg px-3 py-2.5 focus-within:border-brand focus-within:bg-card transition-colors">
              <div className="text-ink-500 text-[10px] uppercase tracking-wider font-semibold">{lang === 'th' ? 'เบอร์โทรศัพท์' : 'Phone'}</div>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+66 81 234 5678" className="w-full bg-transparent text-ink-800 text-[13px] mt-0.5 focus:outline-none placeholder:text-ink-400" />
            </label>
            <label className="block bg-ink-100 border border-ink-200 rounded-lg px-3 py-2.5 focus-within:border-brand focus-within:bg-card transition-colors">
              <div className="text-ink-500 text-[10px] uppercase tracking-wider font-semibold">{lang === 'th' ? 'วันเกิด' : 'Date of Birth'}</div>
              <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="w-full bg-transparent text-ink-800 text-[13px] mt-0.5 focus:outline-none placeholder:text-ink-400" />
            </label>
          </>)}
          <label className="block bg-ink-100 border border-ink-200 rounded-lg px-3 py-2.5 focus-within:border-brand focus-within:bg-card transition-colors">
            <div className="text-ink-500 text-[10px] uppercase tracking-wider font-semibold">{lang === 'th' ? 'อีเมล' : 'Email Address'}</div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-transparent text-ink-800 text-[13px] mt-0.5 focus:outline-none placeholder:text-ink-400"
            />
          </label>
          <label className="block bg-ink-100 border border-ink-200 rounded-lg px-3 py-2.5 focus-within:border-brand focus-within:bg-card transition-colors">
            <div className="text-ink-500 text-[10px] uppercase tracking-wider font-semibold">{lang === 'th' ? 'รหัสผ่าน' : 'Password'}</div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-transparent text-ink-800 text-[13px] mt-0.5 focus:outline-none placeholder:text-ink-400"
            />
          </label>

          {errorMsg && (
            <div className="text-loss text-[12px] bg-loss-soft/20 border border-loss/20 rounded-lg p-2.5 flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <span className="break-all">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="text-gain text-[12px] bg-gain-soft/20 border border-gain/20 rounded-lg p-2.5 flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-brand text-white hover:opacity-90 text-[13px] font-semibold rounded-lg transition-opacity flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"/>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            )}
            <span>
              {authMode === 'signin'
                ? (lang === 'th' ? 'เข้าสู่ระบบ' : 'Sign In')
                : (lang === 'th' ? 'สมัครสมาชิก' : 'Create Account')}
            </span>
          </button>
        </form>

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
  const [editTx, setEditTx] = React.useState(null);
  const [ledgerOpen, setLedgerOpen] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  const [refreshKey, setRefreshKey] = React.useState(0);

  // Real-time price syncing states
  const [syncing, setSyncing] = React.useState(false);
  const [lastSync, setLastSync] = React.useState('Never');
  const [user, setUser] = React.useState(null);

  const syncPrices = async () => {
    if (syncing) return;
    setSyncing(true);
    showToast('Syncing real-time prices from Yahoo Finance...');
    
    const D = window.DataLayer;
    const CRYPTO_MAP = { BTC: 'BTC-USD', ETH: 'ETH-USD', SOL: 'SOL-USD' };
    
    let updatedCount = 0;
    
    // 1) Sync holdings in portfolio (D.ENRICHED)
    for (const held of D.ENRICHED) {
      if (held.cls === 'cash') continue;
      
      let queryTicker = held.ticker;
      if (held.cls === 'crypto') queryTicker = CRYPTO_MAP[held.ticker] || `${held.ticker}-USD`;
      else if (held.cls === 'th') queryTicker = `${held.ticker}.BK`;
      else if (held.ticker === 'GOLDSPOT') queryTicker = 'GC=F';
      if (held.cls === 'fund' && window.SecApi && window.SecApi.isConfigured()) {
        try {
          const navData = await window.SecApi.getLatestNAV(held.ticker);
          if (navData && navData.price) {
            held.price = navData.price;
            updatedCount++;
            continue;
          }
        } catch(e) {
          console.warn("SEC API skip:", e);
        }
      }
      if (held.cls === 'fund' || held.ticker === 'GOLD96.5' || held.ticker === 'K-GOLD') {
        // Skip mutual funds / local gold that might not have standard Yahoo Finance charts
        continue;
      }
      
      try {
        const fetchPriceWithFallback = async (tck) => {
          try {
            const res = await fetch(`/api/price?ticker=${encodeURIComponent(tck)}`);
            if (res.ok) return await res.json();
          } catch(e) {}
          try {
            const yfUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(tck)}?interval=1d`;
            const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(yfUrl)}`);
            if (res.ok) {
              const data = await res.json();
              const result = data.chart?.result?.[0];
              if (result && result.meta) {
                return {
                  price: result.meta.regularMarketPrice,
                  prevClose: result.meta.chartPreviousClose || result.meta.previousClose,
                  name: result.meta.shortName || result.meta.longName || tck,
                  currency: result.meta.currency
                };
              }
            }
          } catch(e) {}
          return null;
        };

        const data = await fetchPriceWithFallback(queryTicker);
        if (data && data.price) {
          held.price = data.price;
          if (data.prevClose) {
            held.dayChangePct = ((data.price - data.prevClose) / data.prevClose) * 100;
          }
          // Update sparkline with the new price as the latest point
          if (held.spark && held.spark.length > 0) {
            held.spark[held.spark.length - 1] = data.price;
          }
          updatedCount++;
        }
      } catch (err) {
        console.error('Failed to sync', queryTicker, err);
      }
    }
    
    // 2) Sync Watchlist items
    try {
      const rawWatch = localStorage.getItem('netto:watchlist');
      if (rawWatch) {
        const watchlist = JSON.parse(rawWatch);
        let watchUpdated = false;
        for (const w of watchlist) {
          let queryTicker = w.ticker;
          if (w.cls === 'crypto') queryTicker = CRYPTO_MAP[w.ticker] || `${w.ticker}-USD`;
          else if (w.cls === 'th') queryTicker = `${w.ticker}.BK`;
          else if (w.ticker === 'GOLDSPOT') queryTicker = 'GC=F';
          if (w.cls === 'fund' && window.SecApi && window.SecApi.isConfigured()) {
            try {
              const navData = await window.SecApi.getLatestNAV(w.ticker);
              if (navData && navData.price) {
                w.price = navData.price;
                watchUpdated = true;
                continue;
              }
            } catch(e) {}
          }
          if (w.cls === 'fund') continue;
          
          try {
            const fetchPriceWithFallback = async (tck) => {
              try {
                const res = await fetch(`/api/price?ticker=${encodeURIComponent(tck)}`);
                if (res.ok) return await res.json();
              } catch(e) {}
              try {
                const yfUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(tck)}?interval=1d`;
                const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(yfUrl)}`);
                if (res.ok) {
                  const data = await res.json();
                  const result = data.chart?.result?.[0];
                  if (result && result.meta) {
                    return {
                      price: result.meta.regularMarketPrice,
                      prevClose: result.meta.chartPreviousClose || result.meta.previousClose
                    };
                  }
                }
              } catch(e) {}
              return null;
            };

            const data = await fetchPriceWithFallback(queryTicker);
            if (data && data.price) {
              w.price = data.price;
              if (data.prevClose) {
                w.prev = data.prevClose; // Update previous close for change calculations
              }
              watchUpdated = true;
            }
          } catch (err) {
            console.error('Failed to sync watchlist', queryTicker, err);
          }
        }
        if (watchUpdated) {
          localStorage.setItem('netto:watchlist', JSON.stringify(watchlist));
        }
      }
    } catch (err) {
      console.error(err);
    }
    
    // 3) Re-calculate aggregates
    if (updatedCount > 0) {
      // Update each Enrich properties
      D.ENRICHED.forEach(a => {
        const val = a.units * a.price;
        a.value = val;
        a.valueTHB = a.ccy === 'USD' ? val * D.FX.USD_THB : val;
        a.unrealized = val - a.cost;
        a.unrealizedPct = a.cost > 0 ? (a.unrealized / a.cost) * 100 : 0;
        a.totalReturn = a.unrealized + (a.dividendsLifetime || 0);
        a.totalReturnPct = a.cost > 0 ? (a.totalReturn / a.cost) * 100 : 0;
      });

      D.TOTAL_THB = D.ENRICHED.reduce((s, a) => s + a.valueTHB, 0);
      D.TOTAL_COST_THB = D.ENRICHED.reduce((s, a) => s + (a.ccy === 'USD' ? a.cost * D.FX.USD_THB : a.cost), 0);
      D.TOTAL_DIVS_YTD_THB = D.ENRICHED.reduce((s, a) => s + (a.ccy === 'USD' ? (a.dividendsYTD || 0) * D.FX.USD_THB : (a.dividendsYTD || 0)), 0);
      
      // Update allocations
      D.ALLOCATION.forEach(c => {
        const sum = D.ENRICHED.filter(a => a.cls === c.id).reduce((s, a) => s + a.valueTHB, 0);
        c.valueTHB = sum;
        c.pct = sum / D.TOTAL_THB;
        c.drift = c.pct - c.targetPct;
      });
      
      D.ALLOCATION_BROKER.forEach(b => {
        const positions = D.ENRICHED.filter(a => a.broker === b.id);
        const sum = positions.reduce((s, a) => s + a.valueTHB, 0);
        b.valueTHB = sum;
        b.pct = sum / D.TOTAL_THB;
      });
      
      D.DAILY_CHANGE_PCT = D.ENRICHED.reduce((s, a) => s + ((a.dayChangePct || 0) * a.valueTHB), 0) / D.TOTAL_THB;
      D.DAILY_CHANGE_THB = D.TOTAL_THB * (D.DAILY_CHANGE_PCT / 100);
      
      const now = new Date();
      setLastSync(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      showToast(`Successfully synced ${updatedCount} assets from Yahoo Finance!`);
    } else {
      showToast('No prices updated.');
    }
    
    setSyncing(false);
    setRefreshKey(k => k + 1);
  };

  // Sync prices once on mount after Babels finishes rendering
  React.useEffect(() => {
    const timer = setTimeout(() => {
      syncPrices();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Hydrate user-entered transactions from Supabase or localStorage on first mount.
  React.useEffect(() => {
    const syncWithDbOrLocal = async () => {
      const supabase = window.supabaseClient;
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      const sessionUser = session?.user || null;
      window.AppUser = sessionUser;
      setUser(sessionUser);

      if (sessionUser) {
        // Hydrate preferences from Supabase to localStorage
        const meta = sessionUser.user_metadata;
        if (meta) {
          const syncedMock = meta.useMockData === true; // Treat undefined as false
          const currentMockStr = localStorage.getItem('netto:useMockData');
          const newMockStr = syncedMock ? 'true' : 'false';
          if (currentMockStr !== newMockStr) {
            localStorage.setItem('netto:useMockData', newMockStr);
            // Reload so that data.jsx and history.jsx can re-initialize properly 
            // with or without the mock data seed.
            window.location.reload();
            return;
          }
          if (meta.hiddenApps) {
            localStorage.setItem('netto:hiddenApps', JSON.stringify(meta.hiddenApps));
            window.dispatchEvent(new Event('netto:apps-changed'));
          }
          if (meta.lang) {
            localStorage.setItem('wealthos_lang', meta.lang);
            window.dispatchEvent(new Event('netto:lang-changed'));
          }
          // Set SEC Api keys if available
          if (window.SecApi && (meta.secDailyKey || meta.secFactKey)) {
            window.SecApi.setKeys(meta.secDailyKey || '', meta.secFactKey || '');
          }
          // We don't overwrite netto:profile here because pages.jsx handles its own hydration, 
          // but we can put classTargets and assetTargets into a known spot if needed.
          if (meta.watchlist) {
            localStorage.setItem('netto:watchlist', JSON.stringify(meta.watchlist));
            window.dispatchEvent(new Event('netto:watchlist-changed'));
          }
          if (meta.classTargets) {
            localStorage.setItem('netto:classTargets', JSON.stringify(meta.classTargets));
            window.DataLayer.TARGET = meta.classTargets;
          }
          if (meta.assetTargets) localStorage.setItem('netto:assetTargets', JSON.stringify(meta.assetTargets));
          if (meta.policyMode) localStorage.setItem('netto:policyMode', meta.policyMode);
        }
        // Logged in! Fetch transactions from Supabase
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .order('date', { ascending: false });
        
        if (!error && data) {
          const D = window.DataLayer;
          // Clear arrays in-place to preserve references
          D.ENRICHED.length = 0;
          D.TRANSACTIONS.length = 0;
          const mappedTxs = data.map(t => ({
            id: t.id,
            date: new Date(t.date),
            type: t.type,
            ticker: t.ticker || 'UNKNOWN',
            name: t.name || t.ticker || 'UNKNOWN',
            cls: t.cls,
            broker: t.broker,
            amount: (t.units != null && !isNaN(parseFloat(t.units))) ? parseFloat(t.units) : (t.total != null && !isNaN(parseFloat(t.total)) ? parseFloat(t.total) : 0),
            units: t.units != null ? parseFloat(t.units) : null,
            price: t.price != null ? parseFloat(t.price) : 0,
            fee: t.fee != null ? parseFloat(t.fee) : 0,
            ccy: t.ccy,
            total: t.total != null ? parseFloat(t.total) : 0,
          }));
          D.TRANSACTIONS.push(...mappedTxs);

          // Re-apply each transaction to D.ENRICHED to reconstruct the lots in chronological order
          const chrono = [...D.TRANSACTIONS].reverse();
          chrono.forEach(tx => {
            let held = D.ENRICHED.find(a => a.ticker === tx.ticker && a.broker === tx.broker);
            if (!held && tx.type === 'buy') {
              const sibling = D.ENRICHED.find(a => a.ticker === tx.ticker);
              held = {
                ticker: tx.ticker,
                name: tx.name || sibling?.name || tx.ticker,
                cls: tx.cls || sibling?.cls || 'th',
                ccy: tx.ccy || sibling?.ccy || 'THB',
                broker: tx.broker,
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
              };
              if (sibling?.spark) {
                held.spark = [...sibling.spark];
              } else {
                const base = tx.price || 100;
                const rawSpark = window.DataLayer.sparkSeries((tx.ticker || 'A').charCodeAt(0), 30, 0);
                const ratio = base / rawSpark[29];
                held.spark = rawSpark.map(v => v * ratio);
              }
              D.ENRICHED.push(held);
            }
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
              held.unrealizedPct = held.cost > 0 ? (held.unrealized / held.cost) * 100 : 0;
              held.feesLifetime = (held.feesLifetime || 0) + (tx.fee || 0);
            } else if (tx.type === 'sell' && tx.units && tx.price) {
              if (held) {
                const newUnits = Math.max(0, held.units - tx.units);
                const sellRatio = held.units > 0 ? newUnits / held.units : 0;
                held.cost = held.cost * sellRatio;
                held.units = newUnits;
                held.value = newUnits * tx.price;
                held.valueTHB = held.ccy === 'USD' ? held.value * D.FX.USD_THB : held.value;
                held.unrealized = held.value - held.cost;
                held.unrealizedPct = held.cost > 0 ? (held.unrealized / held.cost) * 100 : 0;
                held.price = tx.price;
              }
            } else if (tx.type === 'dividend') {
              if (held) {
                held.dividendsYTD = (held.dividendsYTD || 0) + tx.total;
                held.dividendsLifetime = (held.dividendsLifetime || 0) + tx.total;
              }
            }
          });

          if (D.recomputeDerived) D.recomputeDerived();
          setRefreshKey(k => k + 1);
          setTimeout(() => syncPrices(), 500); // Add a small delay so UI renders first
        }
      } else {
        // Not logged in: standard local storage hydration
        try {
          const raw = localStorage.getItem('netto:userTxs');
          if (!raw) return;
          const userTxs = JSON.parse(raw);
          if (!Array.isArray(userTxs) || userTxs.length === 0) return;
          const D = window.DataLayer;
          const existingIds = new Set(D.TRANSACTIONS.map(t => t.id));
          const fresh = userTxs.filter(t => !existingIds.has(t.id)).map(t => ({ ...t, amount: t.amount != null ? t.amount : (t.units != null ? t.units : (t.total != null ? t.total : 0)), date: new Date(t.date), ticker: t.ticker || 'UNKNOWN', name: t.name || t.ticker || 'UNKNOWN' }));
          if (fresh.length === 0) return;
          fresh.forEach(tx => {
            D.TRANSACTIONS.unshift(tx);
            let held = D.ENRICHED.find(a => a.ticker === tx.ticker && a.broker === tx.broker);
            if (!held && tx.type === 'buy') {
              const sibling = D.ENRICHED.find(a => a.ticker === tx.ticker);
              held = {
                ticker: tx.ticker,
                name: tx.name || sibling?.name || tx.ticker,
                cls: tx.cls || sibling?.cls || 'th',
                ccy: tx.ccy || sibling?.ccy || 'THB',
                broker: tx.broker,
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
              };
              if (sibling?.spark) {
                held.spark = [...sibling.spark];
              } else {
                const base = tx.price || 100;
                const rawSpark = window.DataLayer.sparkSeries((tx.ticker || 'A').charCodeAt(0), 30, 0);
                const ratio = base / rawSpark[29];
                held.spark = rawSpark.map(v => v * ratio);
              }
              D.ENRICHED.push(held);
            }
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
              held.unrealizedPct = held.cost > 0 ? (held.unrealized / held.cost) * 100 : 0;
              held.feesLifetime = (held.feesLifetime || 0) + (tx.fee || 0);
            } else if (tx.type === 'sell' && tx.units && tx.price) {
              if (held) {
                const newUnits = Math.max(0, held.units - tx.units);
                const sellRatio = held.units > 0 ? newUnits / held.units : 0;
                held.cost = held.cost * sellRatio;
                held.units = newUnits;
                held.value = newUnits * tx.price;
                held.valueTHB = held.ccy === 'USD' ? held.value * D.FX.USD_THB : held.value;
                held.unrealized = held.value - held.cost;
                held.unrealizedPct = held.cost > 0 ? (held.unrealized / held.cost) * 100 : 0;
                held.price = tx.price;
              }
            } else if (tx.type === 'dividend') {
              if (held) {
                held.dividendsYTD = (held.dividendsYTD || 0) + tx.total;
                held.dividendsLifetime = (held.dividendsLifetime || 0) + tx.total;
              }
            }
          });
          if (D.recomputeDerived) D.recomputeDerived();
          setRefreshKey(k => k + 1);
          syncPrices();
        } catch {}
      }
    };

    syncWithDbOrLocal();

    const { data: { subscription } } = window.supabaseClient?.auth.onAuthStateChange((event, session) => {
      const activeUser = session?.user || null;
      window.AppUser = activeUser;
      setUser(activeUser);
      if (activeUser) {
      } else if (event === 'SIGNED_OUT') {
      }
      syncWithDbOrLocal();
      window.dispatchEvent(new Event('netto:user-changed'));
    }) || { data: { subscription: { unsubscribe: () => {} } } };

    return () => subscription.unsubscribe();
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
    syncPrices,
  }), [syncing, lastSync]);

  const handleDeleteTx = async (id) => {
    if (user && window.supabaseClient) {
      if (typeof id === 'string' && id.startsWith('tx-')) {
        showToast(lang === 'th' ? 'กรุณารีเฟรชหน้าจอ 1 ครั้งก่อนลบรายการที่เพิ่งเพิ่มใหม่' : 'Please refresh the page before deleting this newly added transaction.');
        return;
      }
      const { data, error } = await window.supabaseClient.from('transactions').delete().eq('id', id).select();
      if (error) {
        showToast(`Error deleting: ${error.message}`);
        return;
      }
      if (!data || data.length === 0) {
        showToast(lang === 'th' ? 'ลบไม่สำเร็จ (อาจไม่มีสิทธิ์หรือหารายการไม่เจอ)' : 'Delete failed (no permission or not found)');
        return;
      }
      window.location.reload();
    } else {
      const userTxs = JSON.parse(localStorage.getItem('netto:userTxs') || '[]');
      localStorage.setItem('netto:userTxs', JSON.stringify(userTxs.filter(t => t.id !== id)));
      window.location.reload();
    }
  };

  async function handleSave(tx) {
    setModalOpen(false);
    setModalPrefill(null);
    setEditTx(null);

    const D = window.DataLayer;
    const tickerUpper = (tx.ticker || '').toUpperCase();
    let brokerId = null;
    if (tx.broker) {
      const match = Object.values(D.BROKERS).find(b => b.label === tx.broker);
      brokerId = match ? match.id : tx.broker.toLowerCase().replace(/[^a-z0-9]/g, '_');
    }

    if (tx.id) {
      if (user && window.supabaseClient) {
        if (typeof tx.id === 'string' && tx.id.startsWith('tx-')) {
          showToast(lang === 'th' ? 'กรุณารีเฟรชหน้าจอ 1 ครั้งก่อนแก้ไขรายการที่เพิ่งเพิ่มใหม่' : 'Please refresh the page before editing this newly added transaction.');
          return;
        }
        const { data, error } = await window.supabaseClient.from('transactions').update({
          date: tx.date ? new Date(`${tx.date}T12:00:00`).toISOString() : new Date().toISOString(),
          type: tx.type,
          ticker: tickerUpper,
          name: tx.name,
          cls: tx.cls,
          broker: brokerId,
          units: tx.type === 'dividend' ? null : tx.amount,
          price: tx.type === 'dividend' ? null : tx.price,
          fee: tx.fee || 0,
          ccy: tx.ccy,
          total: tx.type === 'dividend' ? tx.amount : tx.amount * tx.price,
        }).eq('id', tx.id).select();
        
        if (error) {
          showToast(`Error updating: ${error.message}`);
        } else if (!data || data.length === 0) {
          showToast(lang === 'th' ? 'แก้ไขไม่สำเร็จ (อาจไม่มีสิทธิ์หรือหารายการไม่เจอ)' : 'Update failed (no permission or not found)');
        } else {
          window.location.reload();
        }
      } else {
        const userTxs = JSON.parse(localStorage.getItem('netto:userTxs') || '[]');
        const idx = userTxs.findIndex(t => t.id === tx.id);
        if (idx > -1) {
          userTxs[idx] = { ...userTxs[idx], ...tx, ticker: tickerUpper, broker: brokerId, units: tx.type === 'dividend' ? null : tx.amount, price: tx.type === 'dividend' ? null : tx.price, total: tx.type === 'dividend' ? tx.amount : tx.amount * tx.price };
          localStorage.setItem('netto:userTxs', JSON.stringify(userTxs));
          window.location.reload();
        }
      }
      return;
    }

    // 1) Persist the transaction into the live data layer so the ledger,
    //    cashflow chart, and recent-list pick it up immediately.
    const D_ = window.DataLayer;
    // Resolve broker id from the label the modal sent back.
    // Find the EXACT (ticker, broker) lot. For sells/dividends without a
    // broker pick, fall back to the first holding of that ticker.
    let held = brokerId
      ? D_.ENRICHED.find(a => a.ticker === tickerUpper && a.broker === brokerId)
      : null;
    if (!held && tx.type !== 'buy') {
      held = D_.ENRICHED.find(a => a.ticker === tickerUpper);
      if (held && !brokerId) brokerId = held.broker;
    }
    // Reference any holding (any broker) of this ticker for metadata fallback.
    const sibling = D_.ENRICHED.find(a => a.ticker === tickerUpper);
    // Infer currency + class for NEW positions (when not already held).
    const CRYPTO_TICKERS = ['BTC','ETH','SOL','BNB','XRP','ADA','DOGE'];
    const THAI_TICKERS = ['PTT','AOT','KBANK','SCB','BBL','ADVANC','CPALL','TISCO'];
    const ccy = tx.ccy || held?.ccy || sibling?.ccy
      || (CRYPTO_TICKERS.includes(tickerUpper) ? 'USD'
          : THAI_TICKERS.includes(tickerUpper) ? 'THB'
          : tickerUpper.includes('-') || tickerUpper.includes('&') ? 'THB' // Thai mutual fund convention
          : /^[A-Z]{1,5}$/.test(tickerUpper) ? 'USD'  // short ALL-CAPS => US stock
          : 'THB');
    const cls = tx.cls || held?.cls || sibling?.cls
      || (CRYPTO_TICKERS.includes(tickerUpper) ? 'crypto'
          : THAI_TICKERS.includes(tickerUpper) ? 'th'
          : tickerUpper.includes('-') || tickerUpper.includes('&') ? 'fund'
          : ccy === 'USD' ? 'us'
          : 'th');
    const newTx = {
      // Temporary ID for UI rendering. Sync re-populates proper UUID.
      id: `temp-${Date.now()}`,
      // tx.date is a YYYY-MM-DD string from the modal's <input type="date">.
      // Anchor it to local noon so the date doesn't shift across timezones.
      date: tx.date ? new Date(`${tx.date}T12:00:00`) : new Date(),
      type: tx.type,
      ticker: tickerUpper,
      name: held?.name || tickerUpper,
      cls,
      broker: brokerId,
      amount: tx.type === 'dividend' ? null : tx.amount,
      units: tx.type === 'dividend' ? null : tx.amount,
      price: tx.type === 'dividend' ? null : tx.price,
      fee: tx.fee || 0,
      ccy,
      total: tx.type === 'dividend' ? tx.amount : tx.amount * tx.price,
    };
    D_.TRANSACTIONS.unshift(newTx);

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
      };
      if (sibling?.spark) {
        held.spark = [...sibling.spark];
      } else {
        // Generate a synthetic mock sparkline ending near current avgCost or 100
        const base = tx.price || 100;
        const rawSpark = window.DataLayer.sparkSeries((tx.ticker || 'A').charCodeAt(0), 30, 0);
        const ratio = base / rawSpark[29];
        held.spark = rawSpark.map(v => v * ratio);
      }
      D_.ENRICHED.push(held);
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
        held.valueTHB = ccy === 'USD' ? held.value * D_.FX.USD_THB : held.value;
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
        held.valueTHB = ccy === 'USD' ? held.value * D_.FX.USD_THB : held.value;
        held.unrealized = held.value - held.cost;
        held.unrealizedPct = held.cost > 0 ? (held.unrealized / held.cost) * 100 : 0;
        held.price = tx.price;
      } else if (tx.type === 'dividend') {
        held.dividendsYTD = (held.dividendsYTD || 0) + tx.amount;
        held.dividendsLifetime = (held.dividendsLifetime || 0) + tx.amount;
      }
    }

    // 3) Recompute portfolio aggregates.
    if (D_.recomputeDerived) D_.recomputeDerived();

    // 4) Persist user-entered txs across reloads.
    const persistAndSync = async () => {
      const supabase = window.supabaseClient;
      if (user && supabase) {
        const { error } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            date: newTx.date.toISOString(),
            type: newTx.type,
            ticker: newTx.ticker,
            name: newTx.name,
            cls: newTx.cls,
            broker: newTx.broker,
            units: newTx.units,
            price: newTx.price,
            fee: newTx.fee,
            ccy: newTx.ccy,
            total: newTx.total,
          });
        if (error) {
          showToast(`Cloud Sync Error: ${error.message}`);
        } else {
          // Notify components that data has updated
          window.dispatchEvent(new Event('netto:user-changed'));
        }
      } else {
        try {
          const userTxs = JSON.parse(localStorage.getItem('netto:userTxs') || '[]');
          userTxs.unshift({ ...newTx, id: `user-${Date.now()}`, date: newTx.date.toISOString() });
          localStorage.setItem('netto:userTxs', JSON.stringify(userTxs.slice(0, 200)));
        } catch {}
      }
    };
    persistAndSync();

    // 5) Force re-render of the whole app so derived cards reflect new totals.
    setRefreshKey(k => k + 1);

    // 6) Friendly toast — show ticker + impact
    const isTh = (window.localStorage.getItem('wealthos_lang') || 'en') === 'th';
    const verbTh = { buy: 'ซื้อ', sell: 'ขาย', dividend: 'รับปันผล' }[tx.type] || tx.type;
    const verbEn = { buy: 'Bought', sell: 'Sold', dividend: 'Dividend' }[tx.type] || tx.type;
    const amountStr = tx.type === 'dividend'
      ? `฿${Math.round(tx.amount).toLocaleString('en-US')}`
      : `${tx.amount.toLocaleString('en-US', { maximumFractionDigits: 4 })} @ ${ccy === 'USD' ? '$' : '฿'}${tx.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
    showToast(`${isTh ? verbTh : verbEn} ${tickerUpper} · ${amountStr}`);
  }

  const langName = (window.localStorage.getItem('wealthos_lang') || 'en').toLowerCase();

  if (!user) {
    return (
      <LangProvider>
        <LoginPortal lang={langName} />
      </LangProvider>
    );
  }

  return (
    <LangProvider>
      <NavContext.Provider value={navValue}>
        <div className="wealthos-app" translate="no">
          <div className="max-w-[1440px] mx-auto">
            <TopNav page={page} setPage={setPage}/>

            <div key={page} className="fade-in space-y-4">
              {page === 'overview' && <OverviewPage/>}
              {page === 'holdings' && <window.HoldingsPage/>}
              {page === 'cashflow' && <window.CashflowPage/>}
              {page === 'goals'    && <window.GoalsPage/>}
              {page === 'settings' && <window.SettingsPage/>}
            </div>

            <div className="mt-6 flex items-center justify-between text-[11px] text-ink-500 px-2">
              <div className="flex items-center gap-3">
                <span>Wealth OS · v0.6</span>
                <button 
                  onClick={syncPrices} 
                  disabled={syncing}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded border border-line bg-card hover:bg-surface-soft active:scale-[0.98] transition-all text-ink-700 font-semibold cursor-pointer ${syncing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${syncing ? 'bg-warn animate-pulse' : 'bg-gain'}`}></span>
                  {syncing ? 'Syncing...' : `Synced: ${lastSync}`}
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span>Prices: Live (Yahoo Finance)</span>
                <span>FX: ฿{window.DataLayer.FX.USD_THB.toFixed(2)} / USD</span>
              </div>
            </div>
          </div>

          <div className="modals-container">
            {modalOpen && (
              <window.QuickTxModal 
                open={true} 
                onClose={() => { setModalOpen(false); setModalPrefill(null); setEditTx(null); }} 
                onSave={handleSave} 
                prefill={modalPrefill} 
                initialData={editTx}
              />
            )}
            {ledgerOpen && (
              <window.TransactionLedger 
                open={true} 
                onClose={() => setLedgerOpen(false)} 
                onEditTx={(tx) => { setEditTx(tx); setModalOpen(true); setLedgerOpen(false); }} 
                onDeleteTx={handleDeleteTx}
              />
            )}
          </div>
          <Toast show={!!toast}>{toast}</Toast>
        </div>
      </NavContext.Provider>
    </LangProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
