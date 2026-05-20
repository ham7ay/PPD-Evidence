import { motion } from 'framer-motion';

export default function StatTile({ label, value, sub, icon: Icon, accent = 'gold', delay = 0 }) {
  const accentMap = {
    gold:  'text-gold-400',
    green: 'text-green-400',
    red:   'text-red-400',
    blue:  'text-blue-400',
  };
  return (
    <motion.div
      className="stat-tile"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="font-mono text-[10px] text-slate-500 tracking-widest uppercase">
          {label}
        </span>
        {Icon && <Icon size={16} className={accentMap[accent]} />}
      </div>
      <div className={`font-display font-bold text-2xl ${accentMap[accent]} tracking-wide`}>
        {value}
      </div>
      {sub && (
        <div className="font-mono text-[11px] text-slate-500 mt-1.5">
          {sub}
        </div>
      )}
    </motion.div>
  );
}
