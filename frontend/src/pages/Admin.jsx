import { useEffect, useState } from 'react';
import Topbar from '../components/Topbar';
import Loading from '../components/Loading';
import { Modal, ConfirmModal } from '../components/Modal';
import { api } from '../services/api';
import { fmt, fmtDate } from '../utils/helpers';
import { Plus, Edit2, Trash2, Database, RotateCcw, Shield, ShieldOff, Image as ImageIcon, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';

const EMPTY = { name: '', blackMoneyValue: '', category: '', description: '', imageUrl: '' };

export default function Admin() {
  const [tab, setTab] = useState('items');
  const [items, setItems] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [confirm, setConfirm] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [i, o, s] = await Promise.all([api.items(), api.officers(), api.summary()]);
      setItems(i.items); setOfficers(o.officers); setSummary(s);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const pending  = officers.filter((o) => o.status === 'pending');
  const approved = officers.filter((o) => o.status !== 'pending');

  const openCreate = () => { setEditing('new'); setForm(EMPTY); };
  const openEdit = (it) => {
    setEditing(it.id);
    setForm({
      name: it.name,
      blackMoneyValue: it.blackMoneyValue,
      category: it.category,
      description: it.description,
      imageUrl: it.imageUrl,
    });
  };

  const saveItem = async (e) => {
    e.preventDefault();
    try {
      if (editing === 'new') { await api.createItem(form); toast.success('Item created'); }
      else { await api.updateItem(editing, form); toast.success('Item updated'); }
      setEditing(null); load();
    } catch (e) { toast.error(e.message); }
  };

  const deleteItem = (id) => setConfirm({
    title: 'Delete Item',
    message: 'Permanently delete this item from the catalogue?',
    confirmText: 'Delete', danger: true,
    onConfirm: async () => {
      try { await api.deleteItem(id); toast.success('Deleted'); load(); }
      catch (e) { toast.error(e.message); }
    },
  });

  const seedItems = () => setConfirm({
    title: 'Seed Sample Items',
    message: 'Insert the 5 default confiscatable items? Existing items are not removed.',
    confirmText: 'Seed',
    onConfirm: async () => {
      try { await api.seedItems(); toast.success('Seed complete'); load(); }
      catch (e) { toast.error(e.message); }
    },
  });

  const resetAll = () => setConfirm({
    title: 'Wipe All Activity',
    message: 'This will permanently delete ALL evidence locker entries AND ALL treasury transactions. Items catalogue and officers are kept.',
    confirmText: 'Wipe Everything', danger: true,
    onConfirm: async () => {
      try {
        const r = await api.resetAllData();
        toast.success(`Wiped ${r.evidenceDeleted} evidence + ${r.treasuryDeleted} treasury entries`);
        load();
      } catch (e) { toast.error(e.message); }
    },
  });

  const resetTreasury = () => setConfirm({
    title: 'Reset Treasury',
    message: 'Delete ALL treasury transactions? This cannot be undone.',
    confirmText: 'Reset', danger: true,
    onConfirm: async () => {
      try { await api.resetTreasury(); toast.success('Treasury reset'); load(); }
      catch (e) { toast.error(e.message); }
    },
  });

  const approveOfficer = (o) => setConfirm({
    title: 'Approve Officer',
    message: `Grant access to ${o.name} (${o.email})? They'll be able to sign in immediately.`,
    confirmText: 'Approve',
    onConfirm: async () => {
      try { await api.approveOfficer(o.uid); toast.success(`${o.name} approved`); load(); }
      catch (e) { toast.error(e.message); }
    },
  });

  const rejectOfficer = (o) => setConfirm({
    title: 'Reject Registration',
    message: `Permanently delete pending registration for ${o.name} (${o.email})? Their login will be removed entirely.`,
    confirmText: 'Reject', danger: true,
    onConfirm: async () => {
      try { await api.deleteOfficer(o.uid); toast.success('Registration rejected'); load(); }
      catch (e) { toast.error(e.message); }
    },
  });

  const toggleRole = (o) => setConfirm({
    title: o.role === 'admin' ? 'Demote to Officer' : 'Promote to Admin',
    message: `${o.role === 'admin' ? 'Remove admin privileges from' : 'Grant admin privileges to'} ${o.name}?`,
    confirmText: o.role === 'admin' ? 'Demote' : 'Promote',
    onConfirm: async () => {
      try {
        await api.setRole(o.uid, o.role === 'admin' ? 'officer' : 'admin');
        toast.success('Role updated'); load();
      } catch (e) { toast.error(e.message); }
    },
  });

  const deleteOfficer = (o) => setConfirm({
    title: 'Delete Officer',
    message: `Permanently delete officer ${o.name}? Their login will be removed.`,
    confirmText: 'Delete', danger: true,
    onConfirm: async () => {
      try { await api.deleteOfficer(o.uid); toast.success('Officer removed'); load(); }
      catch (e) { toast.error(e.message); }
    },
  });

  if (loading) return (
    <>
      <Topbar title="Admin Panel" subtitle="SYS::ADMIN" />
      <div className="flex-1 flex items-center justify-center"><Loading /></div>
    </>
  );

  const tabs = [
    { id: 'items',     label: 'Items' },
    { id: 'pending',   label: 'Pending', badge: pending.length },
    { id: 'officers',  label: 'Officers' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'danger',    label: 'Danger Zone' },
  ];

  return (
    <>
      <Topbar title="Admin Panel" subtitle="SYS::ADMIN // ELEVATED" />
      <div className="flex-1 overflow-auto p-8 space-y-6 bg-grid">
        <div className="flex gap-1 border-b border-line">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-2.5 font-display tracking-widest text-sm transition border-b-2 -mb-px relative ${
                tab === t.id ? 'text-gold-400 border-gold-500' : 'text-slate-500 border-transparent hover:text-slate-200'
              }`}
            >
              {t.label.toUpperCase()}
              {t.badge > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-gold-500 text-navy-950 text-[10px] font-bold">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === 'items' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="panel p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-gold-400 tracking-wide">
                Evidence Items ({items.length})
              </h3>
              <div className="flex gap-2">
                <button className="btn-ghost flex items-center gap-2" onClick={seedItems}>
                  <Database size={14}/> Seed Sample Items
                </button>
                <button className="btn-gold flex items-center gap-2" onClick={openCreate}>
                  <Plus size={14}/> New Item
                </button>
              </div>
            </div>
            <table className="tactical">
              <thead>
                <tr><th></th><th>Name</th><th>Category</th><th>Black Value</th><th></th></tr>
              </thead>
              <tbody>
                {items.length === 0 && <tr><td colSpan={5} className="text-center text-slate-500 italic py-6">No items</td></tr>}
                {items.map((it) => (
                  <tr key={it.id}>
                    <td>
                      <div className="w-10 h-10 rounded-sm bg-navy-800/60 border border-gold-500/20 overflow-hidden flex items-center justify-center">
                        {it.imageUrl ? (
                          <img src={it.imageUrl} alt={it.name} className="w-full h-full object-contain p-0.5" onError={(e) => { e.target.style.display = 'none'; }}/>
                        ) : (
                          <ImageIcon size={16} className="text-slate-600"/>
                        )}
                      </div>
                    </td>
                    <td className="text-slate-200 font-display">{it.name}</td>
                    <td><span className="badge badge-blue">{it.category}</span></td>
                    <td className="font-mono text-gold-400">$ {fmt(it.blackMoneyValue)}</td>
                    <td className="text-right">
                      <button onClick={() => openEdit(it)} className="text-slate-400 hover:text-gold-400 mr-3"><Edit2 size={14}/></button>
                      <button onClick={() => deleteItem(it.id)} className="text-slate-400 hover:text-red-400"><Trash2 size={14}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        {tab === 'pending' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="panel p-6">
            <h3 className="font-display font-semibold text-gold-400 tracking-wide mb-4">
              Pending Registrations ({pending.length})
            </h3>
            {pending.length === 0 ? (
              <div className="text-center py-12 text-slate-500 italic">
                No pending requests. New registrations will appear here.
              </div>
            ) : (
              <table className="tactical">
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Batch</th><th>Requested</th><th className="text-right">Action</th></tr>
                </thead>
                <tbody>
                  {pending.map((o) => (
                    <tr key={o.uid}>
                      <td className="text-slate-200 font-display">{o.name}</td>
                      <td className="font-mono text-xs text-slate-400">{o.email}</td>
                      <td className="font-mono text-xs">#{o.batchCode || '—'}</td>
                      <td className="font-mono text-xs text-slate-500">{fmtDate(o.createdAt)}</td>
                      <td className="text-right">
                        <button onClick={() => approveOfficer(o)} className="btn-ghost !py-1 !px-2 mr-2 inline-flex items-center gap-1 !text-green-400 !border-green-500/40 hover:!border-green-500" title="Approve">
                          <Check size={12}/> Approve
                        </button>
                        <button onClick={() => rejectOfficer(o)} className="btn-danger !py-1 !px-2 inline-flex items-center gap-1" title="Reject">
                          <X size={12}/> Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </motion.div>
        )}

        {tab === 'officers' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="panel p-6">
            <h3 className="font-display font-semibold text-gold-400 tracking-wide mb-4">
              Approved Officers ({approved.length})
            </h3>
            <table className="tactical">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Batch</th><th>Role</th><th></th></tr>
              </thead>
              <tbody>
                {approved.map((o) => (
                  <tr key={o.uid}>
                    <td className="text-slate-200 font-display">{o.name}</td>
                    <td className="font-mono text-xs text-slate-400">{o.email}</td>
                    <td className="font-mono text-xs">#{o.batchCode || '—'}</td>
                    <td>
                      {o.role === 'admin'
                        ? <span className="badge badge-gold">ADMIN</span>
                        : <span className="badge badge-blue">OFFICER</span>}
                    </td>
                    <td className="text-right">
                      <button onClick={() => toggleRole(o)} className="text-slate-400 hover:text-gold-400 mr-3" title="Toggle role">
                        {o.role === 'admin' ? <ShieldOff size={14}/> : <Shield size={14}/>}
                      </button>
                      <button onClick={() => deleteOfficer(o)} className="text-slate-400 hover:text-red-400"><Trash2 size={14}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        {tab === 'analytics' && summary && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="panel p-6">
              <h3 className="font-display font-semibold text-gold-400 tracking-wide mb-4">Top Items by Quantity</h3>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={summary.byItem.slice(0, 10)} layout="vertical">
                    <CartesianGrid stroke="rgba(245,197,24,0.06)" />
                    <XAxis type="number" stroke="#475569" fontSize={11}/>
                    <YAxis type="category" dataKey="itemName" stroke="#475569" fontSize={11} width={100}/>
                    <Tooltip contentStyle={{ background: '#070d1f', border: '1px solid rgba(245,197,24,0.3)', fontSize: 12 }}/>
                    <Bar dataKey="quantity" fill="#f5c518" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="panel p-6">
              <h3 className="font-display font-semibold text-gold-400 tracking-wide mb-4">Officer Performance</h3>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={summary.byOfficer.slice(0, 8)}>
                    <CartesianGrid stroke="rgba(245,197,24,0.06)" />
                    <XAxis dataKey="officerName" stroke="#475569" fontSize={11}/>
                    <YAxis stroke="#475569" fontSize={11}/>
                    <Tooltip contentStyle={{ background: '#070d1f', border: '1px solid rgba(245,197,24,0.3)', fontSize: 12 }}/>
                    <Bar dataKey="black" fill="#f5c518" name="Black $"/>
                    <Bar dataKey="white" fill="#4ade80" name="White $"/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}

        {tab === 'danger' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="panel p-6 border-red-500/30">
            <h3 className="font-display font-semibold text-red-400 tracking-wide mb-4">Danger Zone</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 border border-red-500/20 rounded-sm">
                <div>
                  <div className="font-display font-semibold text-slate-100">Wipe All Activity</div>
                  <div className="text-sm text-slate-500">Deletes all evidence locker entries AND all treasury transactions. Items catalogue and officers are kept.</div>
                </div>
                <button className="btn-danger flex items-center gap-2" onClick={resetAll}>
                  <RotateCcw size={14}/> Wipe Activity
                </button>
              </div>
              <div className="flex items-center justify-between p-4 border border-red-500/20 rounded-sm">
                <div>
                  <div className="font-display font-semibold text-slate-100">Reset Treasury Only</div>
                  <div className="text-sm text-slate-500">Deletes treasury transactions only. Evidence locker stays.</div>
                </div>
                <button className="btn-danger flex items-center gap-2" onClick={resetTreasury}>
                  <RotateCcw size={14}/> Reset Treasury
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'New Evidence Item' : 'Edit Item'}>
        <form onSubmit={saveItem} className="space-y-3">
          <div>
            <label className="label">Item Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Black Money Value</label>
              <input type="number" className="input font-mono" value={form.blackMoneyValue} onChange={(e) => setForm({ ...form, blackMoneyValue: e.target.value })} required/>
            </div>
            <div>
              <label className="label">Category</label>
              <input className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}/>
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}/>
          </div>
          <div>
            <label className="label">Image URL</label>
            <input className="input" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..."/>
            {form.imageUrl && (
              <div className="mt-2 flex items-center gap-3 p-2 border border-line rounded-sm">
                <img src={form.imageUrl} alt="preview" className="w-16 h-16 object-cover rounded-sm" onError={(e) => { e.target.style.opacity = 0.2; }}/>
                <span className="font-mono text-[10px] text-slate-500 tracking-widest">PREVIEW</span>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
            <button type="submit" className="btn-gold">{editing === 'new' ? 'Create' : 'Save'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={confirm?.onConfirm || (() => {})}
        title={confirm?.title || ''}
        message={confirm?.message || ''}
        confirmText={confirm?.confirmText}
        danger={confirm?.danger}
      />
    </>
  );
}