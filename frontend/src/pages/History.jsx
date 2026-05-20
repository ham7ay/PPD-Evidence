import { useEffect, useState } from 'react';
import Topbar from '../components/Topbar';
import Loading from '../components/Loading';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { fmt, fmtDate, shortId } from '../utils/helpers';
import { Search, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../components/Modal';

export default function History() {
  const { isAdmin } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    officer: '', batchCode: '', itemName: '', dateFrom: '', dateTo: '', evidenceId: '',
  });
  const [toDelete, setToDelete] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const clean = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      const { entries } = await api.evidence(clean);
      setEntries(entries);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const reset = () => {
    setFilters({ officer: '', batchCode: '', itemName: '', dateFrom: '', dateTo: '', evidenceId: '' });
    setTimeout(load, 0);
  };

  const doDelete = async () => {
    try {
      await api.deleteEvidence(toDelete.id);
      toast.success('Evidence deleted');
      load();
    } catch (e) { toast.error(e.message); }
  };

  return (
    <>
      <Topbar title="Evidence History" subtitle="SYS::HISTORY // SEARCH" />
      <div className="flex-1 overflow-auto p-8 space-y-6 bg-grid">
        <div className="panel p-6">
          <h3 className="font-display font-semibold text-gold-400 tracking-wide mb-4">
            Filters
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="label">Officer</label>
              <input className="input" value={filters.officer}
                onChange={(e) => setFilters((f) => ({ ...f, officer: e.target.value }))}/>
            </div>
            <div>
              <label className="label">Batch Code</label>
              <input className="input font-mono" value={filters.batchCode}
                onChange={(e) => setFilters((f) => ({ ...f, batchCode: e.target.value }))}/>
            </div>
            <div>
              <label className="label">Item Name</label>
              <input className="input" value={filters.itemName}
                onChange={(e) => setFilters((f) => ({ ...f, itemName: e.target.value }))}/>
            </div>
            <div>
              <label className="label">Evidence ID</label>
              <input className="input font-mono" value={filters.evidenceId}
                onChange={(e) => setFilters((f) => ({ ...f, evidenceId: e.target.value }))}/>
            </div>
            <div>
              <label className="label">Date From</label>
              <input type="date" className="input" value={filters.dateFrom}
                onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}/>
            </div>
            <div>
              <label className="label">Date To</label>
              <input type="date" className="input" value={filters.dateTo}
                onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}/>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button className="btn-ghost flex items-center gap-2" onClick={reset}>
              <X size={14}/> Reset
            </button>
            <button className="btn-gold flex items-center gap-2" onClick={load}>
              <Search size={14}/> Search
            </button>
          </div>
        </div>

        <div className="panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-gold-400 tracking-wide">
              Results
            </h3>
            <span className="font-mono text-xs text-slate-500 tracking-widest">
              {entries.length} ENTRIES
            </span>
          </div>
          {loading ? <Loading /> : (
            <div className="overflow-x-auto">
              <table className="tactical">
                <thead>
                  <tr>
                    <th>Evidence ID</th><th>Officer</th><th>Batch</th>
                    <th>Item</th><th>Qty</th><th>Black</th><th>White</th><th>Time</th>
                    {isAdmin && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {entries.length === 0 && (
                    <tr><td colSpan={9} className="text-center text-slate-500 italic py-6">No matches</td></tr>
                  )}
                  {entries.map((e) => (
                    <tr key={e.id}>
                      <td className="font-mono text-xs text-gold-400">{shortId(e.id)}</td>
                      <td className="text-slate-200">{e.officerName}</td>
                      <td className="font-mono text-xs text-slate-400">#{e.batchCode}</td>
                      <td className="text-slate-200">{e.itemName}</td>
                      <td className="font-mono text-gold-400">×{e.quantity}</td>
                      <td className="font-mono">$ {fmt(e.blackMoneyValue)}</td>
                      <td className="font-mono text-green-400">$ {fmt(e.whiteMoneyValue)}</td>
                      <td className="font-mono text-xs text-slate-500">{fmtDate(e.createdAt)}</td>
                      {isAdmin && (
                        <td>
                          <button onClick={() => setToDelete(e)} className="text-slate-500 hover:text-red-400 transition">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={doDelete}
        title="Delete Evidence"
        message={`Permanently delete evidence ${toDelete ? shortId(toDelete.id) : ''}? This cannot be undone.`}
        confirmText="Delete"
        danger
      />
    </>
  );
}
