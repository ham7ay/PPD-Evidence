// PPD logo with continuous 3D coin-flip animation
export default function PPDBadge({ size = 44, glow = false, spin = true }) {
  return (
    <div
      className="relative inline-block shrink-0"
      style={{ width: size, height: size, perspective: '400px' }}
    >
      {glow && (
        <div className="absolute inset-0 blur-xl bg-gold-500/40 rounded-full" />
      )}
      <img
        src="/logo.png"
        alt="PPD Evidence"
        width={size}
        height={size}
        className={`relative object-contain ${spin ? 'animate-ppd-flip' : ''}`}
        style={{ width: size, height: size }}
      />
    </div>
  );
}