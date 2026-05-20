import { useEffect, useState } from 'react';
import { Radio } from 'lucide-react';

export default function Topbar({ title, subtitle }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="h-16 border-b border-line bg-navy-950/40 backdrop-blur-sm flex items-center justify-between px-8 z-10 relative">
      <div>
        <h1 className="font-display font-semibold text-xl text-slate-100 tracking-wide">
          {title}
        </h1>
        {subtitle && (
          <div className="font-mono text-[11px] text-slate-500 tracking-widest mt-0.5">
            {subtitle}
          </div>
        )}
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-xs">
          <Radio size={14} className="text-green-400 animate-pulse" />
          <span className="font-mono text-slate-400">SYSTEM ONLINE</span>
        </div>
        <div className="text-right font-mono">
          <div className="text-gold-400 text-sm">
            {now.toLocaleTimeString('en-US', { hour12: false })}
          </div>
          <div className="text-slate-500 text-[10px] tracking-widest">
            {now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
