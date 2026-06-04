// Goals tracker — financial targets with progress bars + ETA.
// Each goal can be linked to one or more BROKER accounts; current
// progress = sum(valueTHB of holdings at linked brokers) + manualTHB.
//
// Persistence (localStorage):
//   netto:goals:user       → array of user-created goals
//   netto:goals:overrides  → { [builtinId]: partial fields } (edits applied
//                            on top of the built-in goal)
//   netto:goals:deleted    → array of built-in goal ids the user removed

const D_GOALS = window.DataLayer;
const { fmtTHB } = D_GOALS;

// ---- Built-in goal seeds ------------------------------------------------
// We override DataLayer's GOALS with these so each one already has a
// sensible broker link (the "current" amount becomes a live number that
// updates as the user buys/sells inside Netto).
const BUILTIN_DEFAULTS = {
  retire:    { linkedBrokers: ['finnomena','scb_am','jitta','innovestx','liberator','webull','dime','hua_seng_heng','mts_gold'], manualTHB: 0 },
  house:     { linkedBrokers: ['scb_easy','streaming','finansia','pi'], manualTHB: 0 },
  emergency: { linkedBrokers: ['make','kept'], manualTHB: 0 },
};

const RAW_BUILTIN = (D_GOALS.GOALS || []).map(g => ({
  ...g,
  ...(BUILTIN_DEFAULTS[g.id] || { linkedBrokers: [], manualTHB: 0 }),
  _builtin: true,
}));

// ---- Persistence helpers ------------------------------------------------
const KEY_USER     = 'netto:goals:user';
const KEY_OVERRIDE = 'netto:goals:overrides';
const KEY_DELETED  = 'netto:goals:deleted';

function _read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}
function _write(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  try { window.dispatchEvent(new Event('netto:goals-changed')); } catch {}
}

function readUserGoals()   { return _read(KEY_USER, []); }
function readOverrides()   { return _read(KEY_OVERRIDE, {}); }
function readDeleted()     { return _read(KEY_DELETED, []); }

// ---- Live "current" calculation ----------------------------------------
function computeCurrent(goal) {
  const ENR = window.DataLayer.ENRICHED || [];
  let sum = goal.manualTHB || 0;
  if (goal.linkedBrokers?.length) {
    sum += ENR
      .filter(a => goal.linkedBrokers.includes(a.broker))
      .reduce((s, a) => s + a.valueTHB, 0);
  }
  return sum;
}

// ---- Store API ----------------------------------------------------------
function getAllGoals() {
  const deleted   = new Set(readDeleted());
  const overrides = readOverrides();
  const builtins  = RAW_BUILTIN
    .filter(g => !deleted.has(g.id))
    .map(g => ({ ...g, ...(overrides[g.id] || {}) }));
  const users     = readUserGoals().map(g => ({ ...g, _user: true }));
  // Inject live current value
  return [...builtins, ...users].map(g => ({ ...g, currentTHB: computeCurrent(g) }));
}

function addGoal(goal) {
  const id = goal.id || ('g' + Date.now().toString(36) + Math.random().toString(36).slice(2,6));
  const stored = {
    id,
    label: goal.label,
    target: goal.target,
    etaYear: goal.etaYear,
    icon: goal.icon,
    accent: goal.accent,
    linkedBrokers: goal.linkedBrokers || [],
    manualTHB: goal.manualTHB || 0,
  };
  _write(KEY_USER, [...readUserGoals(), stored]);
  return id;
}

function updateGoal(id, patch) {
  // Built-in → write to overrides; user → mutate the user array
  const builtinIds = new Set(RAW_BUILTIN.map(g => g.id));
  if (builtinIds.has(id)) {
    const ov = readOverrides();
    ov[id] = { ...(ov[id] || {}), ...patch };
    _write(KEY_OVERRIDE, ov);
  } else {
    const arr = readUserGoals().map(g => g.id === id ? { ...g, ...patch } : g);
    _write(KEY_USER, arr);
  }
}

function removeGoal(id) {
  const builtinIds = new Set(RAW_BUILTIN.map(g => g.id));
  if (builtinIds.has(id)) {
    _write(KEY_DELETED, [...new Set([...readDeleted(), id])]);
  } else {
    _write(KEY_USER, readUserGoals().filter(g => g.id !== id));
  }
}

function restoreBuiltin(id) {
  _write(KEY_DELETED, readDeleted().filter(x => x !== id));
}

window.GoalsStore = { getAllGoals, addGoal, updateGoal, removeGoal, restoreBuiltin };

function useGoals() {
  const [goals, setGoals] = React.useState(getAllGoals);
  const [loading, setLoading] = React.useState(false);

  const fetchGoals = async () => {
    const supabase = window.supabaseClient;
    if (!supabase) {
      setGoals(getAllGoals());
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (user) {
      setLoading(true);
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .order('created_at', { ascending: true });
      if (!error && data) {
        const formatted = data.map(g => ({
          id: g.id,
          label: { en: g.name, th: g.name },
          target: parseFloat(g.target_amount),
          currentTHB: 0,
          etaYear: g.eta_year,
          icon: g.icon,
          accent: g.accent,
          linkedBrokers: g.linked_brokers || [],
          manualTHB: parseFloat(g.manual_thb || 0),
        })).map(g => ({ ...g, currentTHB: computeCurrent(g) }));
        setGoals(formatted);
      }
      setLoading(false);
    } else {
      setGoals(getAllGoals());
    }
  };

  React.useEffect(() => {
    fetchGoals();
    const onChange = () => fetchGoals();
    window.addEventListener('netto:goals-changed', onChange);
    window.addEventListener('storage', onChange);
    window.addEventListener('netto:user-changed', onChange);

    const { data: { subscription } } = window.supabaseClient?.auth.onAuthStateChange(() => {
      fetchGoals();
    }) || { data: { subscription: { unsubscribe: () => {} } } };

    return () => {
      window.removeEventListener('netto:goals-changed', onChange);
      window.removeEventListener('storage', onChange);
      window.removeEventListener('netto:user-changed', onChange);
      subscription.unsubscribe();
    };
  }, []);

  const addGoalAsync = async (goal) => {
    const supabase = window.supabaseClient;
    if (!supabase) {
      addGoal(goal);
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (user) {
      const { error } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          name: typeof goal.label === 'object' ? (goal.label.th || goal.label.en) : goal.label,
          target_amount: goal.target,
          eta_year: goal.etaYear,
          icon: goal.icon,
          accent: goal.accent,
          linked_brokers: goal.linkedBrokers || [],
          manual_thb: goal.manualTHB || 0,
        });
      if (!error) {
        window.dispatchEvent(new Event('netto:goals-changed'));
      }
    } else {
      addGoal(goal);
    }
  };

  const updateGoalAsync = async (id, patch) => {
    const supabase = window.supabaseClient;
    if (!supabase) {
      updateGoal(id, patch);
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (user && isUUID) {
      const updatePayload = {};
      if (patch.label !== undefined) updatePayload.name = typeof patch.label === 'object' ? (patch.label.th || patch.label.en) : patch.label;
      if (patch.target !== undefined) updatePayload.target_amount = patch.target;
      if (patch.etaYear !== undefined) updatePayload.eta_year = patch.etaYear;
      if (patch.icon !== undefined) updatePayload.icon = patch.icon;
      if (patch.accent !== undefined) updatePayload.accent = patch.accent;
      if (patch.linkedBrokers !== undefined) updatePayload.linked_brokers = patch.linkedBrokers;
      if (patch.manualTHB !== undefined) updatePayload.manual_thb = patch.manualTHB;

      const { error } = await supabase
        .from('goals')
        .update(updatePayload)
        .eq('id', id);
      if (!error) {
        window.dispatchEvent(new Event('netto:goals-changed'));
      }
    } else {
      updateGoal(id, patch);
    }
  };

  const removeGoalAsync = async (id) => {
    const supabase = window.supabaseClient;
    if (!supabase) {
      removeGoal(id);
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (user && isUUID) {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id);
      if (!error) {
        window.dispatchEvent(new Event('netto:goals-changed'));
      }
    } else {
      removeGoal(id);
    }
  };

  return { goals, addGoal: addGoalAsync, updateGoal: updateGoalAsync, removeGoal: removeGoalAsync, restoreBuiltin, loading };
}
window.useGoals = useGoals;

// ---- Goal icon ----------------------------------------------------------
function GoalIcon({ name, size = 14 }) {
  const I = window.Icon;
  if (name === 'sparkles') return <I.Sparkles size={size}/>;
  if (name === 'building') return <I.Building size={size}/>;
  if (name === 'wallet')   return <I.Wallet size={size}/>;
  if (name === 'target')   return <I.Target size={size}/>;
  if (name === 'coins')    return <I.Coins size={size}/>;
  if (name === 'globe')    return <I.Globe size={size}/>;
  return <I.Target size={size}/>;
}
window.GoalIcon = GoalIcon;

// ---- Overview card ------------------------------------------------------
function GoalsCard() {
  const { t, lang } = window.useT();
  const nav = window.useNav();
  const { goals } = useGoals();
  return (
    <div className="bg-ink-50 border border-ink-200 rounded-2xl p-5 shadow-card">
      <div className="flex items-center justify-between">
        <button onClick={() => nav.goTo('goals')} className="text-left group">
          <div className="flex items-center gap-2">
            <h3 className="text-ink-700 text-sm font-semibold group-hover:text-ink-800 transition-colors">{t.goals}</h3>
            <span className="text-[10px] uppercase tracking-wider text-ink-500 px-1.5 py-0.5 rounded border border-ink-200">{goals.length}</span>
            <window.Icon.ChevronDown size={12} className="text-ink-500 opacity-0 group-hover:opacity-100 -rotate-90 transition-opacity"/>
          </div>
          <p className="text-ink-500 text-[12px] mt-0.5">{t.goalsSub}</p>
        </button>
        <button onClick={() => nav.goTo('goals')} className="text-[12px] text-ink-500 hover:text-ink-700 transition-colors flex items-center gap-1">
          <window.Icon.Plus size={12}/>
          {t.addGoal}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {goals.slice(0, 3).map(g => {
          const pct = Math.min(100, (g.currentTHB / g.target) * 100);
          const remaining = Math.max(0, g.target - g.currentTHB);
          const accent = g.accent;
          return (
            <button
              key={g.id}
              onClick={() => nav.goTo('goals')}
              className="bg-ink-100 border border-ink-200 rounded-xl p-4 hover:border-ink-300 transition-colors text-left"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-md bg-${accent}-soft border border-${accent}/20 flex items-center justify-center text-${accent} shrink-0`}>
                    <GoalIcon name={g.icon}/>
                  </div>
                  <div className="min-w-0">
                    <div className="text-ink-800 text-[13px] font-medium truncate">{g.label[lang] || g.label.en}</div>
                    <div className="text-ink-500 text-[11px]">{t.eta} {g.etaYear}</div>
                  </div>
                </div>
                <div className={`num text-[15px] font-medium text-${accent}`}>{pct.toFixed(0)}%</div>
              </div>
              <div className="mt-3 h-1.5 bg-ink-0 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full bg-${accent}`}
                  style={{ width: `${pct}%`, transition: 'width .4s cubic-bezier(.2,.7,.2,1)' }}
                ></div>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] num">
                <span className="text-ink-700">{fmtTHB(g.currentTHB, { compact: true })}</span>
                <span className="text-ink-500">/ {fmtTHB(g.target, { compact: true })}</span>
              </div>
              {remaining > 0 && (
                <div className="mt-1 text-[10px] text-ink-500 num">
                  {t.remaining} {fmtTHB(remaining, { compact: true })}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
window.GoalsCard = GoalsCard;
