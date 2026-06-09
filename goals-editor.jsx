// Goal editor — handles both "create new" and "edit existing".
// Passed { open, mode: 'create' | 'edit', goal?, onClose, onSave } from
// the GoalsPage. Lets the user link the goal to one or more broker
// accounts; the goal's "current" amount then becomes a live sum of those
// brokers' THB value, refreshing whenever a transaction posts.

const GOAL_ICONS   = ['sparkles', 'building', 'wallet', 'target', 'coins', 'globe'];
const GOAL_ACCENTS = ['brand', 'gain', 'warn', 'violet', 'loss'];

function GoalEditorModal({ open, mode = 'create', goal = null, onClose, onSave, onDelete, lang }) {
  const I  = window.Icon;
  const D  = window.DataLayer;
  const GI = window.GoalIcon;
  const firstInputRef = React.useRef(null);

  const empty = () => ({
    labelEn: '',
    labelTh: '',
    target: '',
    manualTHB: '0',
    etaYear: (new Date().getFullYear() + 5).toString(),
    icon: 'target',
    accent: 'brand',
    linkedBrokers: [],
  });

  const fromGoal = (g) => ({
    labelEn: g.label?.en || '',
    labelTh: g.label?.th || '',
    target: String(g.target || ''),
    manualTHB: String(g.manualTHB || 0),
    etaYear: String(g.etaYear || (new Date().getFullYear() + 5)),
    icon: g.icon || 'target',
    accent: g.accent || 'brand',
    linkedBrokers: g.linkedBrokers || [],
  });

  const [form, setForm] = React.useState(empty);
  const update = (patch) => setForm(f => ({ ...f, ...patch }));
  const toggleBroker = (id) => setForm(f => ({
    ...f,
    linkedBrokers: f.linkedBrokers.includes(id)
      ? f.linkedBrokers.filter(b => b !== id)
      : [...f.linkedBrokers, id],
  }));

  React.useEffect(() => {
    if (!open) return;
    setForm(mode === 'edit' && goal ? fromGoal(goal) : empty());
    setTimeout(() => firstInputRef.current?.focus(), 50);
  }, [open, mode, goal?.id]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  // Derived values
  const targetN  = parseFloat(form.target.replace(/,/g, ''))  || 0;
  const manualN  = parseFloat(form.manualTHB.replace(/,/g, '')) || 0;
  const etaN     = parseInt(form.etaYear, 10) || 0;
  const linkedSum = (D.ENRICHED || [])
    .filter(a => form.linkedBrokers.includes(a.broker))
    .reduce((s, a) => s + a.valueTHB, 0);
  const currentN  = manualN + linkedSum;
  const primaryLabel = (lang === 'th' ? form.labelTh : form.labelEn).trim();
  const valid = primaryLabel.length > 0 && targetN > 0 && etaN >= new Date().getFullYear();

  function save() {
    if (!valid) return;
    const en = form.labelEn.trim() || form.labelTh.trim();
    const th = form.labelTh.trim() || form.labelEn.trim();
    onSave({
      label: { en, th },
      target: targetN,
      etaYear: etaN,
      icon: form.icon,
      accent: form.accent,
      linkedBrokers: form.linkedBrokers,
      manualTHB: manualN,
    });
    // Note: onClose is called by parent after the async onSave resolves
  }

  // Brokers grouped for the picker
  const brokersUsed = new Set((D.ENRICHED || []).map(a => a.broker));
  const allBrokers = Object.values(D.BROKERS || {});
  const groups = {};
  for (const b of allBrokers) {
    const k = b.kind || 'Other';
    if (!groups[k]) groups[k] = [];
    groups[k].push(b);
  }
  const groupOrder = ['Cash','Thai stocks','US stocks','TH + US','Mutual funds','Gold','All-in-one','Auto-invest','Crypto','Coop savings','Other'];
  const sortedGroups = Object.keys(groups).sort((a,b) => {
    const ai = groupOrder.indexOf(a); const bi = groupOrder.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-ink-900/50 transition-opacity"></div>
      <div
        className="relative w-full max-w-[560px] max-h-[92vh] flex flex-col bg-card border border-line rounded-2xl shadow-pop scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-lg bg-${form.accent}-soft border border-${form.accent}/20 flex items-center justify-center text-${form.accent}`}>
              <GI name={form.icon} size={16}/>
            </div>
            <div>
              <div className="text-ink-900 font-semibold text-[14px]">
                {mode === 'edit'
                  ? (lang === 'th' ? 'แก้ไขเป้าหมาย' : 'Edit goal')
                  : (lang === 'th' ? 'เป้าหมายใหม่' : 'New goal')}
              </div>
              <div className="text-ink-500 text-[11px]">
                {lang === 'th'
                  ? 'ผูกกับ App / Broker เพื่อให้ยอดอัปเดตอัตโนมัติ'
                  : 'Link to your apps so progress updates automatically'}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-ink-100 flex items-center justify-center text-ink-500 transition-colors">
            <I.X size={14}/>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4 overflow-y-auto scroll-thin">
          {/* Names */}
          <div className="grid grid-cols-2 gap-2.5">
            <GeField label={lang === 'th' ? 'ชื่อ (ไทย)' : 'Name (Thai)'}>
              <input
                ref={lang === 'th' ? firstInputRef : null}
                value={form.labelTh}
                onChange={(e) => update({ labelTh: e.target.value })}
                placeholder="ดาวน์รถ"
                className="w-full bg-surface-soft border border-line rounded-md px-2.5 py-1.5 text-[13px] text-ink-900 focus:outline-none focus:border-brand"
              />
            </GeField>
            <GeField label={lang === 'th' ? 'ชื่อ (อังกฤษ)' : 'Name (English)'}>
              <input
                ref={lang === 'th' ? null : firstInputRef}
                value={form.labelEn}
                onChange={(e) => update({ labelEn: e.target.value })}
                placeholder="Car down payment"
                className="w-full bg-surface-soft border border-line rounded-md px-2.5 py-1.5 text-[13px] text-ink-900 focus:outline-none focus:border-brand"
              />
            </GeField>
          </div>

          {/* Numbers */}
          <div className="grid grid-cols-3 gap-2.5">
            <GeField label={lang === 'th' ? 'เป้าหมาย (฿)' : 'Target (฿)'}>
              <input
                value={form.target}
                onChange={(e) => update({ target: e.target.value.replace(/[^\d.]/g, '') })}
                placeholder="500000"
                inputMode="numeric"
                className="w-full bg-surface-soft border border-line rounded-md px-2.5 py-1.5 text-[13px] text-ink-900 num focus:outline-none focus:border-brand"
              />
            </GeField>
            <GeField label={lang === 'th' ? 'นอกแอป (฿)' : 'Manual (฿)'} hint={lang === 'th' ? 'เงินสด/ทอง/ฯลฯ' : 'cash, gold, etc'}>
              <input
                value={form.manualTHB}
                onChange={(e) => update({ manualTHB: e.target.value.replace(/[^\d.]/g, '') })}
                placeholder="0"
                inputMode="numeric"
                className="w-full bg-surface-soft border border-line rounded-md px-2.5 py-1.5 text-[13px] text-ink-900 num focus:outline-none focus:border-brand"
              />
            </GeField>
            <GeField label={lang === 'th' ? 'ถึงปี' : 'Target year'}>
              <input
                value={form.etaYear}
                onChange={(e) => update({ etaYear: e.target.value.replace(/[^\d]/g, '') })}
                placeholder="2030"
                inputMode="numeric"
                className="w-full bg-surface-soft border border-line rounded-md px-2.5 py-1.5 text-[13px] text-ink-900 num focus:outline-none focus:border-brand"
              />
            </GeField>
          </div>

          {/* Linked Apps */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-[10px] uppercase tracking-wider text-ink-500">
                {lang === 'th' ? 'ผูกกับแอป / Broker' : 'Linked apps / brokers'}
              </div>
              <div className="text-[10px] text-ink-500 num">
                {form.linkedBrokers.length > 0
                  ? `${form.linkedBrokers.length} ${lang === 'th' ? 'แอป · ' : 'apps · '}${window.DataLayer.fmtTHB(linkedSum, { compact: true })}`
                  : (lang === 'th' ? 'ยังไม่ได้ผูก' : 'none linked')}
              </div>
            </div>
            <div className="border border-line rounded-lg bg-surface-soft max-h-[200px] overflow-y-auto scroll-thin p-2 space-y-2">
              {sortedGroups.map(groupName => (
                <div key={groupName}>
                  <div className="text-[9px] uppercase tracking-wider text-ink-400 px-1 mb-1">{groupName}</div>
                  <div className="grid grid-cols-2 gap-1">
                    {groups[groupName].map(b => {
                      const checked = form.linkedBrokers.includes(b.id);
                      const used    = brokersUsed.has(b.id);
                      return (
                        <button
                          key={b.id}
                          onClick={() => toggleBroker(b.id)}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded-md border text-left transition-colors ${checked ? `bg-${form.accent}-soft border-${form.accent}/40` : 'bg-card border-line hover:border-ink-300'}`}
                        >
                          <window.BrokerBadge broker={b} size={20}/>
                          <div className="flex-1 min-w-0">
                            <div className={`text-[11px] truncate ${checked ? `text-${form.accent}` : 'text-ink-800'} font-medium`}>{b.label}</div>
                            {used && <div className="text-[9px] text-ink-500 truncate">{lang === 'th' ? 'มียอดอยู่' : 'has holdings'}</div>}
                          </div>
                          {checked && <window.Icon.Check size={11} className={`text-${form.accent} shrink-0`}/>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Icon picker */}
          <GeField label={lang === 'th' ? 'ไอคอน' : 'Icon'}>
            <div className="flex items-center gap-1.5 flex-wrap">
              {GOAL_ICONS.map(name => (
                <button
                  key={name}
                  onClick={() => update({ icon: name })}
                  className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors ${form.icon === name ? `bg-${form.accent}-soft border-${form.accent} text-${form.accent}` : 'bg-surface-soft border-line text-ink-500 hover:text-ink-900'}`}
                >
                  <GI name={name} size={14}/>
                </button>
              ))}
            </div>
          </GeField>

          {/* Accent picker */}
          <GeField label={lang === 'th' ? 'สี' : 'Color'}>
            <div className="flex items-center gap-2">
              {GOAL_ACCENTS.map(c => (
                <button
                  key={c}
                  onClick={() => update({ accent: c })}
                  className={`w-7 h-7 rounded-full bg-${c} transition-transform ${form.accent === c ? 'ring-2 ring-offset-2 ring-offset-card ring-ink-700 scale-110' : 'hover:scale-105'}`}
                  title={c}
                />
              ))}
            </div>
          </GeField>

          {/* Preview */}
          {targetN > 0 && (
            <div className="bg-surface-soft border border-line rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] uppercase tracking-wider text-ink-500">{lang === 'th' ? 'ตัวอย่าง' : 'Preview'}</div>
                <div className={`num text-[12px] font-semibold text-${form.accent}`}>{Math.min(100, (currentN / targetN) * 100).toFixed(0)}%</div>
              </div>
              <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
                <div className={`h-full bg-${form.accent}`} style={{ width: `${Math.min(100, (currentN / targetN) * 100)}%` }}></div>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[10px] num text-ink-500">
                <span>{window.DataLayer.fmtTHB(currentN, { compact: true })}</span>
                <span>{window.DataLayer.fmtTHB(targetN, { compact: true })}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-5 py-3.5 border-t border-line shrink-0">
          <div>
            {mode === 'edit' && onDelete && (
              <button
                onClick={() => { if (window.confirm(lang === 'th' ? 'ลบเป้าหมายนี้?' : 'Delete this goal?')) { onDelete(); onClose(); } }}
                className="text-[13px] px-3 py-1.5 rounded-md text-loss hover:bg-loss/10 transition-colors"
              >
                {lang === 'th' ? 'ลบ' : 'Delete'}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="text-[13px] px-3 py-1.5 rounded-md text-ink-700 hover:bg-ink-100 transition-colors">
              {lang === 'th' ? 'ยกเลิก' : 'Cancel'}
            </button>
            <button
              onClick={save}
              disabled={!valid}
              className={`text-[13px] font-medium px-3.5 py-1.5 rounded-md transition-colors ${valid ? 'bg-ink-800 text-ink-0 hover:bg-ink-900' : 'bg-ink-100 text-ink-400 cursor-not-allowed'}`}
            >
              {mode === 'edit'
                ? (lang === 'th' ? 'บันทึก' : 'Save')
                : (lang === 'th' ? 'สร้าง' : 'Create')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GeField({ label, hint, children }) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between mb-1">
        <div className="text-[10px] uppercase tracking-wider text-ink-500">{label}</div>
        {hint && <div className="text-[9px] text-ink-400">{hint}</div>}
      </div>
      {children}
    </label>
  );
}

window.GoalEditorModal = GoalEditorModal;
