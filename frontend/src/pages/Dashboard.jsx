import { useEffect, useState } from 'react';
import Topbar from '../components/Topbar';
import StatTile from '../components/StatTile';
import Loading from '../components/Loading';
import { api } from '../services/api';
import { fmt, fmtDate, shortId } from '../utils/helpers';
import {
  DollarSign, Banknote, Package, Archive,
  TrendingUp, Activity,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, CartesianGrid,
} from 'recharts';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [recent, setRecent] = useState([]);
  const [treasury, setTreasury] = useState({ transactions: [], balance: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, e, t] = await Promise.all([api.summary(), api.evidence(), api.treasury()]);
        setSummary(s);
        setRecent(e.entries.slice(0, 6));
        setTreasury(t);
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return (
    <>
      <Topbar title="Command Dashboard" subtitle="SYS::HOME // REALTIME" />
      <div className="flex-1 flex items-center justify-center"><Loading /></div>
    </>
  );

  const chartData = (summary?.byDay || []).slice(-14).map((d) => ({
    date: d.date.slice(5),
    black: d.black,
    white: d.white,
  }));

  return (
    <>
      <Topbar title="Command Dashboard" subtitle="SYS::HOME // REALTIME" />
      <div className="flex-1 overflow-auto p-8 space-y-6 bg-grid">
        {/* Stat row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatTile
            label="Confiscated // Black"
            value={`$ ${fmt(summary?.totalBlack)}`}
            sub="all-time seized"
            icon={DollarSign}
            accent="gold"
            delay={0}
          />
          <StatTile
            label="Converted // White"
            value={`$ ${fmt(summary?.totalWhite)}`}
            sub="@ rate 2.5×"
            icon={Banknote}
            accent="green"
            delay={0.05}
          />
          <StatTile
            label="Evidence Items"
            value={fmt(summary?.totalItems)}
            sub={`${summary?.itemCatalogueCount || 0} item types`}
            icon={Package}
            accent="blue"
            delay={0.1}
          />
          <StatTile
            label="Treasury Balance"
            value={`$ ${fmt(treasury.balance)}`}
            sub="white money on hand"
            icon={Archive}
            accent="gold"
            delay={0.15}
          />
        </div>

        {/* Chart + recent */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="panel p-6 lg:col-span-2"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display font-semibold text-gold-400 tracking-wide">
                  Confiscation Activity
                </h3>
                <div className="font-mono text-[10px] text-slate-500 tracking-widest mt-0.5">
                  LAST 14 DAYS // BLACK + WHITE
                </div>
              </div>
              <TrendingUp size={18} className="text-gold-500/50" />
            </div>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="black" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f5c518" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f5c518" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="white" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(245,197,24,0.06)" />
                  <XAxis dataKey="date" stroke="#475569" fontSize={11} />
                  <YAxis stroke="#475569" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: '#070d1f',
                      border: '1px solid rgba(245,197,24,0.3)',
                      borderRadius: 4,
                      fontFamily: 'JetBrains Mono',
                      fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="black" stroke="#f5c518" fill="url(#black)" strokeWidth={2} />
                  <Area type="monotone" dataKey="white" stroke="#4ade80" fill="url(#white)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="panel p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-gold-400 tracking-wide">
                Recent Confiscations
              </h3>
              <Activity size={18} className="text-gold-500/50" />
            </div>
            <div className="space-y-3">
              {recent.length === 0 && (
                <div className="text-slate-500 text-sm italic">No entries yet.</div>
              )}
              {recent.map((e) => (
                <div key={e.id} className="border-l-2 border-gold-500/40 pl-3 py-1">
                  <div className="font-display font-semibold text-sm text-slate-100">
                    {e.itemName} <span className="text-gold-400">×{e.quantity}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="font-mono text-[11px] text-slate-500">
                      {e.officerName} #{e.batchCode}
                    </span>
                    <span className="font-mono text-[10px] text-slate-600">
                      {shortId(e.id)}
                    </span>
                  </div>
                  <div className="font-mono text-[10px] text-slate-600">
                    {fmtDate(e.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Treasury feed */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="panel p-6"
        >
          <h3 className="font-display font-semibold text-gold-400 tracking-wide mb-4">
            Evidence Locker Activity
          </h3>
          <div className="overflow-x-auto">
            <table className="tactical">
              <thead>
                <tr>
                  <th>Evidence ID</th>
                  <th>Officer</th>
                  <th>Batch</th>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Black</th>
                  <th>White</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {recent.length === 0 && (
                  <tr><td colSpan={8} className="text-center text-slate-500 italic py-6">No activity</td></tr>
                )}
                {recent.map((e) => (
                  <tr key={e.id}>
                    <td className="font-mono text-xs text-gold-400">{shortId(e.id)}</td>
                    <td className="text-slate-200">{e.officerName}</td>
                    <td className="font-mono text-xs text-slate-400">#{e.batchCode}</td>
                    <td className="text-slate-200">{e.itemName}</td>
                    <td className="font-mono text-gold-400">×{e.quantity}</td>
                    <td className="font-mono text-slate-300">$ {fmt(e.blackMoneyValue)}</td>
                    <td className="font-mono text-green-400">$ {fmt(e.whiteMoneyValue)}</td>
                    <td className="font-mono text-xs text-slate-500">{fmtDate(e.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </>
  );
}
