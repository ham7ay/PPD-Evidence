import { useEffect, useMemo, useState } from 'react';
import Topbar from '../components/Topbar';
import Loading from '../components/Loading';
import StatTile from '../components/StatTile';
import { api } from '../services/api';
import { fmt } from '../utils/helpers';
import {
  FileDown, FileText, DollarSign, Banknote, Package, Archive, Calendar, X,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, PieChart, Pie, Cell,
} from 'recharts';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

const COLORS = ['#f5c518', '#4ade80', '#3a5cb8', '#f87171', '#a78bfa', '#fb923c', '#22d3ee'];

export default function Reports() {
  const [allEntries, setAllEntries] = useState([]);   // raw evidence
  const [summaryAll, setSummaryAll] = useState(null); // full summary (for global stats fallback)
  const [loading, setLoading] = useState(true);

  // Date filter UI state
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [s, e] = await Promise.all([api.summary(), api.evidence()]);
        setSummaryAll(s);
        setAllEntries(e.entries || []);
      } finally { setLoading(false); }
    })();
  }, []);

  // Derive the active dataset from the date range
  const view = useMemo(() => {
    if (!summaryAll) return null;

    const hasFilter = dateFrom || dateTo;
    if (!hasFilter) {
      // No filter → return server-side summary as-is
      return {
        ...summaryAll,
        filtered: false,
      };
    }

    const fromTs = dateFrom ? new Date(dateFrom).getTime() : -Infinity;
    const toTs   = dateTo   ? new Date(dateTo).getTime() + 86400000 - 1 : Infinity;

    const norm = (s) => String(s || '').trim().toLowerCase();
    const inRange = allEntries.filter((e) => e.createdAt >= fromTs && e.createdAt <= toTs);

    let totalBlack = 0, totalWhite = 0, totalItems = 0;
    const byOfficer = {};
    const byItem = {};
    const byDay = {};

    inRange.forEach((e) => {
      totalBlack += e.blackMoneyValue || 0;
      totalWhite += e.whiteMoneyValue || 0;
      totalItems += e.quantity || 0;

      const keyName  = e.officerKey || norm(e.officerName);
      const keyBatch = e.batchKey   || norm(e.batchCode);
      const k = `${keyName}|${keyBatch}`;
      if (!byOfficer[k]) byOfficer[k] = { officerName: e.officerName, batchCode: e.batchCode, items: 0, black: 0, white: 0 };
      byOfficer[k].items += e.quantity || 0;
      byOfficer[k].black += e.blackMoneyValue || 0;
      byOfficer[k].white += e.whiteMoneyValue || 0;

      byItem[e.itemName] = byItem[e.itemName] || { itemName: e.itemName, quantity: 0, black: 0 };
      byItem[e.itemName].quantity += e.quantity || 0;
      byItem[e.itemName].black += e.blackMoneyValue || 0;

      const day = new Date(e.createdAt).toISOString().split('T')[0];
      byDay[day] = byDay[day] || { date: day, items: 0, black: 0, white: 0 };
      byDay[day].items += e.quantity || 0;
      byDay[day].black += e.blackMoneyValue || 0;
      byDay[day].white += e.whiteMoneyValue || 0;
    });

    return {
      filtered: true,
      totalBlack, totalWhite, totalItems,
      treasuryBalance: summaryAll.treasuryBalance, // vault balance is global, not date-filtered
      itemCatalogueCount: summaryAll.itemCatalogueCount,
      byOfficer: Object.values(byOfficer).sort((a, b) => b.black - a.black),
      byItem:    Object.values(byItem).sort((a, b) => b.quantity - a.quantity),
      byDay:     Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date)),
    };
  }, [summaryAll, allEntries, dateFrom, dateTo]);

  const clearDates = () => { setDateFrom(''); setDateTo(''); };

  const presetRange = (days) => {
    const today = new Date();
    const from  = new Date(today);
    from.setDate(today.getDate() - (days - 1));
    setDateFrom(from.toISOString().split('T')[0]);
    setDateTo(today.toISOString().split('T')[0]);
  };

  if (loading || !view) return (
    <>
      <Topbar title="Reports" subtitle="SYS::REPORTS" />
      <div className="flex-1 flex items-center justify-center"><Loading /></div>
    </>
  );

  const rangeLabel = (() => {
    if (!view.filtered) return 'ALL TIME';
    const f = dateFrom || '∞';
    const t = dateTo   || '∞';
    return `${f} → ${t}`;
  })();

  const exportCSV = () => {
    const rows = [
      ['PPD EVIDENCE — REPORT', ''],
      ['Generated', new Date().toISOString()],
      ['Range', rangeLabel],
      [],
      ['Totals', ''],
      ['Total Black Money', view.totalBlack],
      ['Total White Money', view.totalWhite],
      ['Total Items Confiscated', view.totalItems],
      ['Treasury Balance (current)', view.treasuryBalance],
      [],
      ['Officer-Wise', ''],
      ['Officer', 'Batch', 'Items', 'Black', 'White'],
      ...view.byOfficer.map((o) => [o.officerName, o.batchCode, o.items, o.black, o.white]),
      [],
      ['Top Items', ''],
      ['Item', 'Quantity', 'Black'],
      ...view.byItem.map((i) => [i.itemName, i.quantity, i.black]),
      [],
      ['Daily', ''],
      ['Date', 'Items', 'Black', 'White'],
      ...view.byDay.map((d) => [d.date, d.items, d.black, d.white]),
    ];
    const csv = rows.map((r) =>
      r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const rangeSlug = view.filtered ? `${dateFrom || 'start'}_to_${dateTo || 'end'}` : 'all-time';
    a.href = url; a.download = `ppd-evidence-${rangeSlug}-${Date.now()}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(4, 8, 20);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(245, 197, 24);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('PPD EVIDENCE — REPORT', 14, 18);
    doc.setFontSize(9);
    doc.setTextColor(200);
    doc.text(`Range: ${rangeLabel}`, 14, 25);
    doc.setTextColor(150);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 130, 25);

    doc.setTextColor(0);
    let y = 40;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTALS', 14, y); y += 6;
    autoTable(doc, {
      startY: y,
      head: [['Metric', 'Value']],
      body: [
        ['Total Black Money', `$ ${fmt(view.totalBlack)}`],
        ['Total White Money', `$ ${fmt(view.totalWhite)}`],
        ['Total Items Confiscated', fmt(view.totalItems)],
        ['Treasury Balance (current)', `$ ${fmt(view.treasuryBalance)}`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [20, 32, 73], textColor: [245, 197, 24] },
    });

    doc.text('OFFICER-WISE', 14, doc.lastAutoTable.finalY + 8);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 11,
      head: [['Officer', 'Batch', 'Items', 'Black', 'White']],
      body: view.byOfficer.map((o) => [o.officerName, o.batchCode, o.items, `$ ${fmt(o.black)}`, `$ ${fmt(o.white)}`]),
      theme: 'striped',
      headStyles: { fillColor: [20, 32, 73], textColor: [245, 197, 24] },
    });

    doc.text('TOP ITEMS', 14, doc.lastAutoTable.finalY + 8);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 11,
      head: [['Item', 'Quantity', 'Black']],
      body: view.byItem.map((i) => [i.itemName, i.quantity, `$ ${fmt(i.black)}`]),
      theme: 'striped',
      headStyles: { fillColor: [20, 32, 73], textColor: [245, 197, 24] },
    });

    doc.text('DAILY', 14, doc.lastAutoTable.finalY + 8);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 11,
      head: [['Date', 'Items', 'Black', 'White']],
      body: view.byDay.map((d) => [d.date, d.items, `$ ${fmt(d.black)}`, `$ ${fmt(d.white)}`]),
      theme: 'striped',
      headStyles: { fillColor: [20, 32, 73], textColor: [245, 197, 24] },
    });

    const rangeSlug = view.filtered ? `${dateFrom || 'start'}_to_${dateTo || 'end'}` : 'all-time';
    doc.save(`ppd-evidence-${rangeSlug}-${Date.now()}.pdf`);
    toast.success('PDF exported');
  };

  return (
    <>
      <Topbar title="Reports & Analytics" subtitle="SYS::REPORTS // EXPORT" />
      <div className="flex-1 overflow-auto p-8 space-y-6 bg-grid">

        {/* Date range filter */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="panel p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={16} className="text-gold-500" />
            <h3 className="font-display font-semibold text-gold-400 tracking-wide">
              Date Range
            </h3>
            <span className="ml-auto font-mono text-[10px] text-slate-500 tracking-widest">
              ACTIVE: {rangeLabel}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-3">
              <label className="label">From</label>
              <input type="date" className="input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="md:col-span-3">
              <label className="label">To</label>
              <input type="date" className="input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <div className="md:col-span-6 flex flex-wrap gap-2 justify-end">
              <button className="btn-ghost" onClick={() => presetRange(7)}>Last 7d</button>
              <button className="btn-ghost" onClick={() => presetRange(30)}>Last 30d</button>
              <button className="btn-ghost" onClick={() => presetRange(90)}>Last 90d</button>
              {(dateFrom || dateTo) && (
                <button className="btn-ghost flex items-center gap-1" onClick={clearDates}>
                  <X size={12}/> Clear
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Export buttons */}
        <div className="flex justify-end gap-3">
          <button className="btn-ghost flex items-center gap-2" onClick={exportCSV}>
            <FileDown size={14} /> CSV
          </button>
          <button className="btn-gold flex items-center gap-2" onClick={exportPDF}>
            <FileText size={14} /> PDF
          </button>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatTile label="Total Black" value={`$ ${fmt(view.totalBlack)}`} icon={DollarSign} accent="gold" delay={0}/>
          <StatTile label="Total White" value={`$ ${fmt(view.totalWhite)}`} icon={Banknote}   accent="green" delay={0.05}/>
          <StatTile label="Items Logged" value={fmt(view.totalItems)}       icon={Package}    accent="blue" delay={0.1}/>
          <StatTile label="Vault (now)" value={`$ ${fmt(view.treasuryBalance)}`}  icon={Archive}    accent="gold" delay={0.15}/>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="panel p-6">
            <h3 className="font-display font-semibold text-gold-400 tracking-wide mb-4">
              Daily Confiscations
            </h3>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={view.byDay.map((d) => ({ date: d.date.slice(5), items: d.items, black: d.black }))}>
                  <CartesianGrid stroke="rgba(245,197,24,0.06)" />
                  <XAxis dataKey="date" stroke="#475569" fontSize={11} />
                  <YAxis stroke="#475569" fontSize={11} />
                  <Tooltip contentStyle={{ background: '#070d1f', border: '1px solid rgba(245,197,24,0.3)', fontSize: 12 }} />
                  <Bar dataKey="items" fill="#f5c518" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="panel p-6">
            <h3 className="font-display font-semibold text-gold-400 tracking-wide mb-4">
              Top Confiscated Items
            </h3>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={view.byItem.slice(0, 7)}
                    dataKey="quantity" nameKey="itemName"
                    cx="50%" cy="50%" outerRadius={90}
                    label={({ itemName, percent }) => `${itemName} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {view.byItem.slice(0, 7).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#070d1f', border: '1px solid rgba(245,197,24,0.3)', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Officer table */}
        <div className="panel p-6">
          <h3 className="font-display font-semibold text-gold-400 tracking-wide mb-4">
            Officer-Wise Breakdown
          </h3>
          <div className="overflow-x-auto">
            <table className="tactical">
              <thead>
                <tr>
                  <th>Officer</th><th>Batch</th><th>Items</th><th>Black</th><th>White</th>
                </tr>
              </thead>
              <tbody>
                {view.byOfficer.length === 0 && (
                  <tr><td colSpan={5} className="text-center text-slate-500 italic py-6">No data in selected range</td></tr>
                )}
                {view.byOfficer.map((o) => (
                  <tr key={`${o.officerName}|${o.batchCode}`}>
                    <td className="text-slate-200">{o.officerName}</td>
                    <td className="font-mono text-xs text-slate-400">#{o.batchCode}</td>
                    <td className="font-mono text-gold-400">{fmt(o.items)}</td>
                    <td className="font-mono">$ {fmt(o.black)}</td>
                    <td className="font-mono text-green-400">$ {fmt(o.white)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}