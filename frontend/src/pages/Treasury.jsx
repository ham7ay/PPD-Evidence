import { useEffect, useState } from 'react';
import Topbar from '../components/Topbar';
import Loading from '../components/Loading';
import StatTile from '../components/StatTile';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { fmt, fmtDate } from '../utils/helpers';
import { Banknote, ArrowDownCircle, ArrowUpCircle, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const ACTIONS = [
  { type: 'Added',     label: 'Add',      icon: ArrowDownCircle, accent: 'text-green-400 border-green-500/40' },
  { type: 'Withdrawn', label: 'Withdraw', icon: ArrowUpCircle,   accent: 'text-red-400 border-red-500/40' },
  { type: 'Returned',  label: 'Return',   icon: RotateCcw,       accent: 'text-gold-400 border-gold-500/40' },
];

export default function Treasury() {
  const { user } = useAuth();
  const [data, setData] = useState({ transactions: [], balance: 0 });
  const [loading, setLoading] = useState(true);

  const [officerName, setOfficerName] = useState('');
  const [batchCode, setBatchCode] = useState('');
  const [amount, setAmount] = useState('');
  const [actionType, setActionType] = useState('Added');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setData(await api.treasury()); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (user) {
      setOfficerName(user.name || '');
      setBatchCode(user.batchCode || '');
    }
  }, [user]);

  const submit = async (e) => {
    e.preventDefault();
    if (!officerName || !batchCode || !amount) return toast.error('All fields required');
    setSubmitting(true);
    try {
      await api.addTreasury({
        officerName, batchCode,
        amount: Number(amount),
        actionType,
      });
      toast.success(`${actionType}: $ ${fmt(amount)}`);
      setAmount('');
      load();
    } catch (e) {
      toast.error(e.message);
    } finally { setSubmitting(false); }
  };

  if (loading) return (
    <>
      <Topbar title="Treasury" subtitle="SYS::TREASURY" />
      <div className="flex-1 flex items-center justify-center"><Loading /></div>
    </>
  );

  const added     = data.transactions.filter((t) => t.actionType === 'Added').reduce((s, t) => s + Number(t.amount), 0);
  const withdrawn = data.transactions.filter((t) => t.actionType === 'Withdrawn').reduce((s, t) => s + Number(t.amount), 0);
  const returned  = data.transactions.filter((t) => t.actionType === 'Returned').reduce((s, t) => s + Number(t.amount), 0);

  return (
    <>
      <Topbar title="White Money Treasury" subtitle="SYS::TREASURY // VAULT" />
      <div className="flex-1 overflow-auto p-8 space-y-6 bg-grid">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatTile label="Vault Balance"  value={`$ ${fmt(data.balance)}`} icon={Banknote} accent="gold" delay={0}/>
          <StatTile label="Total Added"    value={`$ ${fmt(added)}`}       accent="green" delay={0.05} icon={ArrowDownCircle}/>
          <StatTile label="Total Withdrawn"value={`$ ${fmt(withdrawn)}`}   accent="red"   delay={0.1} icon={ArrowUpCircle}/>
          <StatTile label="Total Returned" value={`$ ${fmt(returned)}`}    accent="gold"  delay={0.15} icon={RotateCcw}/>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="panel p-6">
            <h3 className="font-display font-semibold text-gold-400 tracking-wide mb-4">
              New Transaction
            </h3>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="label">Officer Name</label>
                <input className="input" value={officerName} onChange={(e) => setOfficerName(e.target.value)} />
              </div>
              <div>
                <label className="label">Batch Code</label>
                <input className="input font-mono" value={batchCode} onChange={(e) => setBatchCode(e.target.value)} />
              </div>
              <div>
                <label className="label">Amount (White Money)</label>
                <input
                  type="number" className="input font-mono"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="label">Action Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {ACTIONS.map(({ type, label, icon: Icon, accent }) => (
                    <button
                      key={type} type="button"
                      onClick={() => setActionType(type)}
                      className={`p-2.5 rounded-sm border text-xs font-display tracking-wider transition flex flex-col items-center gap-1 ${
                        actionType === type
                          ? accent + ' bg-navy-800/60'
                          : 'text-slate-500 border-line hover:text-slate-200'
                      }`}
                    >
                      <Icon size={16} />
                      {label.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <button className="btn-gold w-full" disabled={submitting}>
                {submitting ? 'PROCESSING...' : `${actionType.toUpperCase()} $ ${fmt(amount || 0)}`}
              </button>
            </form>
          </motion.div>

          {/* Transactions */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="panel p-6 lg:col-span-2">
            <h3 className="font-display font-semibold text-gold-400 tracking-wide mb-4">
              Transaction History
            </h3>
            <div className="overflow-x-auto">
              <table className="tactical">
                <thead>
                  <tr>
                    <th>Time</th><th>Officer</th><th>Batch</th><th>Action</th><th>Source</th><th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.transactions.length === 0 && (
                    <tr><td colSpan={6} className="text-center text-slate-500 italic py-6">No transactions yet</td></tr>
                  )}
                  {data.transactions.map((t) => (
                    <tr key={t.id}>
                      <td className="font-mono text-xs text-slate-500">{fmtDate(t.createdAt)}</td>
                      <td className="text-slate-200">{t.officerName}</td>
                      <td className="font-mono text-xs text-slate-400">#{t.batchCode}</td>
                      <td>
                        {t.actionType === 'Added' && <span className="badge badge-green">{t.actionType}</span>}
                        {t.actionType === 'Withdrawn' && <span className="badge badge-red">{t.actionType}</span>}
                        {t.actionType === 'Returned' && <span className="badge badge-gold">{t.actionType}</span>}
                      </td>
                      <td>
                        {t.source === 'evidence' ? (
                          <span className="badge badge-gold !text-[9px]" title={t.note || ''}>
                            AUTO · {t.itemName || 'evidence'}
                          </span>
                        ) : (
                          <span className="font-mono text-[10px] text-slate-500 tracking-widest">MANUAL</span>
                        )}
                      </td>
                      <td className={`text-right font-mono font-semibold ${
                        t.actionType === 'Withdrawn' ? 'text-red-400' :
                        t.actionType === 'Added'     ? 'text-green-400' : 'text-gold-400'
                      }`}>
                        {t.actionType === 'Withdrawn' ? '−' : '+'} $ {fmt(t.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}