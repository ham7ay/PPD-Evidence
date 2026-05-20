import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { api } from '../services/api';
import { motion } from 'framer-motion';
import { Shield, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import PPDBadge from '../components/PPDBadge';

export default function Login() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [batchCode, setBatchCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setErr('');
    try {
      if (mode === 'register') {
        await createUserWithEmailAndPassword(auth, email, password);
        await api.register({ name, batchCode });
        toast.success('Officer registered. Welcome.');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Access granted.');
      }
    } catch (e) {
      setErr(e.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 bg-grid overflow-hidden">
      {/* Background flourishes */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-navy-500/20 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <PPDBadge size={80} glow />
          </div>
          <h1 className="font-display font-bold text-3xl tracking-widest text-slate-100">
            PPD EVIDENCE
          </h1>
          <div className="font-mono text-xs text-slate-500 tracking-[0.3em] mt-2">
            EVIDENCE MANAGEMENT SYSTEM
          </div>
          <div className="mt-3 flex items-center justify-center gap-3">
            <div className="h-px w-12 bg-gold-500/40" />
            <span className="badge badge-gold">RESTRICTED ACCESS</span>
            <div className="h-px w-12 bg-gold-500/40" />
          </div>
        </div>

        {/* Form panel */}
        <div className="panel p-8">
          {/* Tabs */}
          <div className="flex border-b border-line mb-6 -mx-8 px-8 -mt-2">
            {['login', 'register'].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setErr(''); }}
                className={`flex-1 pb-3 font-display tracking-widest text-sm transition ${
                  mode === m ? 'text-gold-400 border-b-2 border-gold-500 -mb-px' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {m === 'login' ? 'SIGN IN' : 'REGISTER'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="label">Officer Name</label>
                  <input
                    className="input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Officer Doe"
                    required
                  />
                </div>
                <div>
                  <label className="label">Batch Code</label>
                  <input
                    className="input font-mono"
                    value={batchCode}
                    onChange={(e) => setBatchCode(e.target.value)}
                    placeholder="PPD-0427"
                    required
                  />
                </div>
              </>
            )}
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@ppd.local"
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>

            {err && (
              <div className="flex items-start gap-2 text-red-400 text-xs p-3 bg-red-500/10 border border-red-500/30 rounded-sm">
                <AlertCircle size={14} className="mt-px shrink-0" />
                <span>{err}</span>
              </div>
            )}

            <button type="submit" className="btn-gold w-full mt-2" disabled={loading}>
              {loading ? 'AUTHENTICATING...' : mode === 'login' ? 'ACCESS SYSTEM' : 'CREATE ACCOUNT'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-line text-center">
            <div className="font-mono text-[10px] text-slate-600 tracking-widest">
              UNAUTHORIZED ACCESS PROHIBITED
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
