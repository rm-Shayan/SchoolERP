export default function PromotionHero() {
  return (
    <div className="rounded-2xl bg-gradient-to-r from-primary-800 via-primary-600 to-primary-500 p-6 text-white shadow-lg">
      <h1 className="text-xl font-bold tracking-tight">Bulk Promotion</h1>
      <p className="mt-1 max-w-2xl text-sm text-white/85">Promote students to the next class/section at year-end — the whole section or just selected ones. Every promotion issues a fresh ID card / QR.</p>
      <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-medium">
        <span className="rounded-full bg-white/15 px-3 py-1">✓ New ID card + QR</span><span className="rounded-full bg-white/15 px-3 py-1">✓ Capacity check</span><span className="rounded-full bg-white/15 px-3 py-1">✓ History logged</span>
      </div>
    </div>
  );
}
