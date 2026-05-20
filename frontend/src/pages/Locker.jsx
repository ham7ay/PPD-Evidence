import { useEffect, useState } from 'react';
import Topbar from '../components/Topbar';
import Loading from '../components/Loading';
import { Modal } from '../components/Modal';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { fmt, toWhite, shortId, fmtDate } from '../utils/helpers';
import { Package, Plus, Minus, Lock, Receipt, Volume2, VolumeX } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

function playBeep(enabled) {
  if (!enabled) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = 'square'; o.frequency.value = 880;
    g.gain.setValueAtTime(0.08, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    o.start(); o.stop(ctx.currentTime + 0.18);
  } catch {}
}

export default function Locker() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [officerName, setOfficerName] = useState('');
  const [batchCode, setBatchCode] = useState('');
  const [cart, setCart] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [soundOn, setSoundOn] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { items } = await api.items();
        setItems(items);
      } finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    if (user) {
      setOfficerName(user.name || '');
      setBatchCode(user.batchCode || '');
    }
  }, [user]);

  const setQty = (id, n) => setCart((c) => {
    const next = { ...c };
    const v = Math.max(0, Math.floor(Number(n) || 0));
    if (v <= 0) delete next[id]; else next[id] = v;
    return next;
  });

  const inc = (id) => setQty(id, (cart[id] || 0) + 1);
  const dec = (id) => setQty(id, (cart[id] || 0) - 1);

  const cartItems = Object.entries(cart).map(([id, qty]) => {
    const item = items.find((i) => i.id === id);
    return item ? { ...item, qty, black: item.blackMoneyValue * qty } : null;
  }).filter(Boolean);

  const totalBlack = cartItems.reduce((s, c) => s + c.black, 0);
  const totalWhite = toWhite(totalBlack);

  const submit = async () => {
    if (!officerName || !batchCode) return toast.error('Enter officer name and batch code');
    if (cartItems.length === 0) return toast.error('No items selected');
    setSubmitting(true);
    try {
      const created = [];
      for (const c of cartItems) {
        const r = await api.addEvidence({
          officerName, batchCode, itemId: c.id, quantity: c.qty,
        });
        created.push(r);
      }
      playBeep(soundOn);
      toast.success(`${created.length} evidence record(s) locked.`);
      setReceipt({
        officer: officerName, batch: batchCode,
        items: created, totalBlack, totalWhite,
        at: Date.now(),
      });
      setCart({});
    } catch (e) {
      toast.error(e.message);
    } finally { setSubmitting(false); }
  };

  if (loading) return (
    <>
      <Topbar title="Evidence Locker" subtitle="SYS::LOCKER" />
      <div className="flex-1 flex items-center justify-center"><Loading /></div>
    </>
  );

  return (
    <>
      <Topbar title="Evidence Locker" subtitle="SYS::LOCKER // INTAKE" />
      <div className="flex-1 overflow-auto p-8 grid grid-cols-1 xl:grid-cols-3 gap-6 bg-grid">
        <div className="xl:col-span-2 space-y-4">
          <div className="panel p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display font-semibold text-gold-400 tracking-wide">
                  Confiscatable Inventory
                </h3>
                <div className="font-mono text-[10px] text-slate-500 tracking-widest mt-0.5">
                  {items.length} ITEM TYPES // SELECT QUANTITIES BELOW
                </div>
              </div>
              <button
                onClick={() => setSoundOn((s) => !s)}
                className="text-slate-500 hover:text-gold-400 transition"
                title={soundOn ? 'Mute' : 'Unmute'}
              >
                {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-12 text-slate-500 italic">
                No items in catalogue. Admin → Seed Sample Items.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {items.map((it) => {
                  const qty = cart[it.id] || 0;
                  return (
                    <motion.div
                      key={it.id}
                      whileHover={{ y: -2 }}
                      className={`p-4 rounded-sm border transition ${
                        qty > 0
                          ? 'border-gold-500/60 bg-gold-500/5'
                          : 'border-line bg-navy-950/30'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-14 h-14 rounded-sm bg-navy-800/60 border border-gold-500/20 overflow-hidden flex items-center justify-center shrink-0">
                          {it.imageUrl ? (
                            <img
                              src={it.imageUrl}
                              alt={it.name}
                              className="w-full h-full object-contain p-1"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5c518" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>';
                              }}
                            />
                          ) : (
                            <Package size={18} className="text-gold-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-display font-semibold text-slate-100 truncate">
                            {it.name}
                          </div>
                          <div className="font-mono text-[10px] text-slate-500 tracking-widest uppercase">
                            {it.category}
                          </div>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="font-mono text-xs text-gold-400">
                              $ {fmt(it.blackMoneyValue)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-line gap-2">
                        <span className="font-mono text-xs text-slate-400 shrink-0">QTY</span>
                        <div className="flex items-center gap-1.5 flex-1 justify-end">
                          <button
                            onClick={() => dec(it.id)}
                            disabled={qty === 0}
                            className="w-7 h-7 rounded-sm border border-line text-slate-400 hover:text-gold-400 hover:border-gold-500/50 transition disabled:opacity-30 flex items-center justify-center shrink-0"
                          >
                            <Minus size={12} />
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={qty}
                            onChange={(e) => setQty(it.id, e.target.value)}
                            onFocus={(e) => e.target.select()}
                            className="w-20 h-7 bg-navy-950/60 border border-line rounded-sm text-center font-mono text-sm text-gold-400 font-semibold focus:border-gold-500/60 focus:outline-none"
                          />
                          <button
                            onClick={() => inc(it.id)}
                            className="w-7 h-7 rounded-sm border border-line text-slate-400 hover:text-gold-400 hover:border-gold-500/50 transition flex items-center justify-center shrink-0"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                      {qty > 0 && (
                        <div className="mt-2 pt-2 border-t border-line flex justify-between text-[11px] font-mono">
                          <span className="text-slate-500">Subtotal</span>
                          <span className="text-gold-400">$ {fmt(it.blackMoneyValue * qty)}</span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="panel p-6 sticky top-4">
            <div className="flex items-center gap-2 mb-4">
              <Lock size={16} className="text-gold-500" />
              <h3 className="font-display font-semibold text-gold-400 tracking-wide">
                Lock In Evidence
              </h3>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="label">Officer Name</label>
                <input className="input" value={officerName} onChange={(e) => setOfficerName(e.target.value)} />
              </div>
              <div>
                <label className="label">Batch Code</label>
                <input className="input font-mono" value={batchCode} onChange={(e) => setBatchCode(e.target.value)} />
              </div>
            </div>

            <div className="border-t border-line pt-4 mb-4">
              <div className="font-mono text-[10px] text-slate-500 tracking-widest mb-2">
                CART // {cartItems.length} ITEM TYPES
              </div>
              <div className="space-y-1.5 max-h-40 overflow-auto">
                {cartItems.length === 0 && (
                  <div className="text-slate-600 text-sm italic">No items selected.</div>
                )}
                {cartItems.map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-300 truncate">
                      {c.name} <span className="text-gold-400">×{fmt(c.qty)}</span>
                    </span>
                    <span className="font-mono text-xs text-slate-400">
                      $ {fmt(c.black)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 border-t border-line pt-4 mb-4">
              <div className="flex justify-between">
                <span className="font-mono text-xs text-slate-500 tracking-widest">BLACK</span>
                <span className="font-display font-semibold text-gold-400">$ {fmt(totalBlack)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-xs text-slate-500 tracking-widest">WHITE @ 2.5×</span>
                <span className="font-display font-semibold text-green-400">$ {fmt(totalWhite)}</span>
              </div>
            </div>

            <button
              onClick={submit}
              disabled={submitting || cartItems.length === 0}
              className="btn-gold w-full"
            >
              {submitting ? 'LOCKING...' : 'ADD TO EVIDENCE LOCKER'}
            </button>
          </div>
        </div>
      </div>

      <Modal open={!!receipt} onClose={() => setReceipt(null)} title="Evidence Receipt" size="md">
        {receipt && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Receipt size={20} className="text-gold-400" />
              <div>
                <div className="font-display font-semibold text-slate-100">
                  Officer {receipt.officer}
                </div>
                <div className="font-mono text-xs text-slate-500">
                  Batch #{receipt.batch} // {fmtDate(receipt.at)}
                </div>
              </div>
            </div>
            <table className="tactical">
              <thead>
                <tr><th>ID</th><th>Item</th><th>Qty</th><th>Black</th><th>White</th></tr>
              </thead>
              <tbody>
                {receipt.items.map((e) => (
                  <tr key={e.id}>
                    <td className="font-mono text-xs text-gold-400">{shortId(e.id)}</td>
                    <td className="text-slate-200">{e.itemName}</td>
                    <td className="font-mono text-gold-400">×{fmt(e.quantity)}</td>
                    <td className="font-mono">$ {fmt(e.blackMoneyValue)}</td>
                    <td className="font-mono text-green-400">$ {fmt(e.whiteMoneyValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 pt-4 border-t border-line flex justify-between font-display font-semibold">
              <span className="text-gold-400">Total Black: $ {fmt(receipt.totalBlack)}</span>
              <span className="text-green-400">Total White: $ {fmt(receipt.totalWhite)}</span>
            </div>
            <div className="mt-5 flex justify-end">
              <button className="btn-gold" onClick={() => setReceipt(null)}>Acknowledge</button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}