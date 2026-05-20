import { useAuth } from '../context/AuthContext';
import { Hourglass, RefreshCw, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import PPDBadge from '../components/PPDBadge';
import { useState } from 'react';

export default function PendingApproval() {
  const { user, refresh, logout } = useAuth();
  const [checking, setChecking] = useState(false);

  const check = async () => {
    setChecking(true);
    try { await refresh(); }
    finally { setTimeout(() => setChecking(false), 600); }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 bg-grid overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-navy-500/20 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-6">
          <div className="inline-block mb-3">
            <PPDBadge size={72} glow />
          </div>
          <div className="font-mono text-[10px] text-slate-500 tracking-[0.3em]">
            PPD EVIDENCE SYSTEM
          </div>
        </div>

        <div className="panel p-8 text-center">
          <div className="inline-flex w-16 h-16 rounded-full bg-gold-500/10 border border-gold-500/30 items-center justify-center mb-4">
            <Hourglass size={26} className="text-gold-400 animate-pulse" />
          </div>

          <h2 className="font-display font-bold text-2xl text-gold-400 tracking-wide mb-2">
            Awaiting Approval
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Your registration has been received. An administrator must approve your account before you can access the system.
          </p>

          <div className="border-t border-line pt-4 mb-5 text-left space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-mono text-slate-500 tracking-widest">OFFICER</span>
              <span className="font-display text-slate-200">{user?.name || '—'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="font-mono text-slate-500 tracking-widest">BATCH</span>
              <span className="font-mono text-slate-300">#{user?.batchCode || '—'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="font-mono text-slate-500 tracking-widest">STATUS</span>
              <span className="badge badge-gold">PENDING</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={check} disabled={checking} className="btn-gold flex-1 flex items-center justify-center gap-2">
              <RefreshCw size={14} className={checking ? 'animate-spin' : ''} />
              {checking ? 'CHECKING...' : 'CHECK STATUS'}
            </button>
            <button onClick={logout} className="btn-ghost flex items-center gap-2">
              <LogOut size={14}/> Sign Out
            </button>
          </div>
        </div>

        <div className="text-center mt-6">
          <div className="font-mono text-[10px] text-slate-600 tracking-widest">
            CONTACT ADMIN IF THIS TAKES TOO LONG
          </div>
        </div>
      </motion.div>
    </div>
  );
}