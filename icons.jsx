// Minimal lucide-style icon set as inline SVG components.
// Stroke-based, currentColor — matches lucide-react visual language.
const _I = ({ children, size=16, className='', strokeWidth=1.75 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
       className={className} aria-hidden="true">
    {children}
  </svg>
);

const Icon = {
  Plus:    (p) => <_I {...p}><path d="M12 5v14M5 12h14"/></_I>,
  X:       (p) => <_I {...p}><path d="M18 6 6 18M6 6l12 12"/></_I>,
  ArrowUp: (p) => <_I {...p}><path d="M12 19V5M5 12l7-7 7 7"/></_I>,
  ArrowDown: (p) => <_I {...p}><path d="M12 5v14M19 12l-7 7-7-7"/></_I>,
  TrendUp: (p) => <_I {...p}><path d="M22 7 13.5 15.5l-5-5L2 17"/><path d="M16 7h6v6"/></_I>,
  TrendDown: (p) => <_I {...p}><path d="M22 17 13.5 8.5l-5 5L2 7"/><path d="M16 17h6v-6"/></_I>,
  Wallet:  (p) => <_I {...p}><path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2"/><path d="M21 9h-7a3 3 0 1 0 0 6h7Z"/></_I>,
  Coins:   (p) => <_I {...p}><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/></_I>,
  Bell:    (p) => <_I {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></_I>,
  Search:  (p) => <_I {...p}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></_I>,
  Settings:(p) => <_I {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></_I>,
  Sparkles:(p) => <_I {...p}><path d="m12 3 1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9Z"/><path d="M19 14v4M17 16h4"/></_I>,
  Alert:   (p) => <_I {...p}><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><path d="M12 9v4M12 17h.01"/></_I>,
  Check:   (p) => <_I {...p}><path d="m20 6-11 11-5-5"/></_I>,
  ChevronDown: (p) => <_I {...p}><path d="m6 9 6 6 6-6"/></_I>,
  ChevronUp:   (p) => <_I {...p}><path d="m18 15-6-6-6 6"/></_I>,
  ArrowUpDown: (p) => <_I {...p}><path d="m7 15 5 5 5-5M7 9l5-5 5 5"/></_I>,
  Filter:  (p) => <_I {...p}><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3Z"/></_I>,
  Download:(p) => <_I {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></_I>,
  More:    (p) => <_I {...p}><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></_I>,
  Refresh: (p) => <_I {...p}><path d="M21 12a9 9 0 0 0-15-6.7L3 8M3 3v5h5M3 12a9 9 0 0 0 15 6.7l3-2.7M21 21v-5h-5"/></_I>,
  Scale:   (p) => <_I {...p}><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10M12 3v18M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></_I>,
  Target:  (p) => <_I {...p}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></_I>,
  Building:(p) => <_I {...p}><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/></_I>,
  Bitcoin: (p) => <_I {...p}><circle cx="12" cy="12" r="10"/><path d="M9 8h4.5a2.5 2.5 0 0 1 0 5H9zM9 13h5a2.5 2.5 0 0 1 0 5H9zM10 6v2M14 6v2M10 16v2M14 16v2"/></_I>,
  Banknote:(p) => <_I {...p}><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></_I>,
  PieChart:(p) => <_I {...p}><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></_I>,
  Eye:     (p) => <_I {...p}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></_I>,
  EyeOff:  (p) => <_I {...p}><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></_I>,
  Share:   (p) => <_I {...p}><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></_I>,
  Sliders: (p) => <_I {...p}><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></_I>,
  Grid:    (p) => <_I {...p}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></_I>,
  Bars:    (p) => <_I {...p}><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></_I>,
  File:    (p) => <_I {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></_I>,
  ArrowUpRight: (p) => <_I {...p}><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></_I>,
  Activity:(p) => <_I {...p}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></_I>,
  Calendar:(p) => <_I {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></_I>,
  Info:    (p) => <_I {...p}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></_I>,
  Globe:   (p) => <_I {...p}><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></_I>,
};

window.Icon = Icon;
