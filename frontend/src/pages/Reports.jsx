import { useEffect, useState } from 'react';
import Topbar from '../components/Topbar';
import Loading from '../components/Loading';
import StatTile from '../components/StatTile';
import { api } from '../services/api';
import { fmt } from '../utils/helpers';
import {
  FileDown, FileText, DollarSign, Banknote, Package, Archive,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

const COLORS = ['#f5c518', '#4ade80', '#3a5cb8', '#f87171', '#a78bfa', '#fb923c', '#22d3ee'];

export default function Reports() {
  const [s, setS] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setS(await api.summary()); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return (
    <>
      <Topbar title="Reports" subtitle="SYS::REPORTS" />
      <div className="flex-1 flex items-center justify-center"><Loading /></div>
    </>
  );

  const exportCSV = () => {
    const rows = [
      ['PPD EVIDENCE — FULL REPORT', ''],
      ['Generated', new Date().toISOString()],
      [],
      ['Totals', ''],
      ['Total Black Money', s.totalBlack],
      ['Total White Money', s.totalWhite],
      ['Total Items Confiscated', s.totalItems],
      ['Treasury Balance', s.treasuryBalance],
      [],
      ['Officer-Wise', ''],
      ['Officer', 'Batch', 'Items', 'Black', 'White'],
      ...s.byOfficer.map((o) => [o.officerName, o.batchCode, o.items, o.black, o.white]),
      [],
      ['Top Items', ''],
      ['Item', 'Quantity', 'Black'],
      ...s.byItem.map((i) => [i.itemName, i.quantity, i.black]),
      [],
      ['Daily', ''],
      ['Date', 'Items', 'Black', 'White'],
      ...s.byDay.map((d) => [d.date, d.items, d.black, d.white]),
    ];
    const csv = rows.map((r) =>
      r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `ppd-evidence-report-${Date.now()}.csv`;
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
    doc.text('PPD EVIDENCE — FULL REPORT', 14, 18);
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 25);

    doc.setTextColor(0);
    let y = 40;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTALS', 14, y); y += 6;
    autoTable(doc, {
      startY: y,
      head: [['Metric', 'Value']],
      body: [
        ['Total Black Money', `$ ${fmt(s.totalBlack)}`],
        ['Total White Money', `$ ${fmt(s.totalWhite)}`],
        ['Total Items Confiscated', fmt(s.totalItems)],
        ['Treasury Balance', `$ ${fmt(s.treasuryBalance)}`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [20, 32, 73], textColor: [245, 197, 24] },
    });

    doc.text('OFFICER-WISE', 14, doc.lastAutoTable.finalY + 8);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 11,
      head: [['Officer', 'Batch', 'Items', 'Black', 'White']],
      body: s.byOfficer.map((o) => [o.officerName, o.batchCode, o.items, `$ ${fmt(o.black)}`, `$ ${fmt(o.white)}`]),
      theme: 'striped',
      headStyles: { fillColor: [20, 32, 73], textColor: [245, 197, 24] },
    });

    doc.text('TOP ITEMS', 14, doc.lastAutoTable.finalY + 8);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 11,
      head: [['Item', 'Quantity', 'Black']],
      body: s.byItem.map((i) => [i.itemName, i.quantity, `$ ${fmt(i.black)}`]),
      theme: 'striped',
      headStyles: { fillColor: [20, 32, 73], textColor: [245, 197, 24] },
    });

    doc.text('DAILY', 14, doc.lastAutoTable.finalY + 8);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 11,
      head: [['Date', 'Items', 'Black', 'White']],
      body: s.byDay.map((d) => [d.date, d.items, `$ ${fmt(d.black)}`, `$ ${fmt(d.white)}`]),
      theme: 'striped',
      headStyles: { fillColor: [20, 32, 73], textColor: [245, 197, 24] },
    });

    doc.save(`ppd-evidence-report-${Date.now()}.pdf`);
    toast.success('PDF exported');
  };

  return (
    <>
      <Topbar title="Reports & Analytics" subtitle="SYS::REPORTS // EXPORT" />
      <div className="flex-1 overflow-auto p-8 space-y-6 bg-grid">
        {/* Actions */}
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
          <StatTile label="Total Black" value={`$ ${fmt(s.totalBlack)}`} icon={DollarSign} accent="gold" delay={0}/>
          <StatTile label="Total White" value={`$ ${fmt(s.totalWhite)}`} icon={Banknote}   accent="green" delay={0.05}/>
          <StatTile label="Items Logged" value={fmt(s.totalItems)}       icon={Package}    accent="blue" delay={0.1}/>
          <StatTile label="Vault" value={`$ ${fmt(s.treasuryBalance)}`}  icon={Archive}    accent="gold" delay={0.15}/>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="panel p-6">
            <h3 className="font-display font-semibold text-gold-400 tracking-wide mb-4">
              Daily Confiscations
            </h3>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={s.byDay.map((d) => ({ date: d.date.slice(5), items: d.items, black: d.black }))}>
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
                    data={s.byItem.slice(0, 7)}
                    dataKey="quantity" nameKey="itemName"
                    cx="50%" cy="50%" outerRadius={90}
                    label={({ itemName, percent }) => `${itemName} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {s.byItem.slice(0, 7).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#070d1f', border: '1px solid rgba(245,197,24,0.3)', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Tables */}
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
                {s.byOfficer.length === 0 && (
                  <tr><td colSpan={5} className="text-center text-slate-500 italic py-6">No data</td></tr>
                )}
                {s.byOfficer.map((o) => (
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
