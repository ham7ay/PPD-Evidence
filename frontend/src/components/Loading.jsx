export default function Loading({ label = 'LOADING' }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] gap-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 border-2 border-gold-500/20 rounded-full" />
        <div className="absolute inset-0 border-2 border-transparent border-t-gold-500 rounded-full animate-spin" />
      </div>
      <div className="font-mono text-xs text-slate-500 tracking-widest">{label}</div>
    </div>
  );
}
