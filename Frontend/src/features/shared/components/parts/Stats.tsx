const stats = [
  { value: '60%', label: 'Faster admin workflows', icon: 'M13 10V3L4 14h7v7l9-11h-7z', tint: 'sa-tint-1' },
  { value: '2.5x', label: 'More parent engagement', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', tint: 'sa-tint-2' },
  { value: '24/7', label: 'School visibility online', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', tint: 'sa-tint-3' },
  { value: '99.9%', label: 'Operational reliability', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', tint: 'sa-tint-4' },
];

export default function Stats() {
  return (
    <section className="relative border-y border-gray-100 bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px sm:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className="group px-4 py-10 text-center transition-colors hover:bg-primary-50/50 sm:px-6">
            <div className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${item.tint}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d={item.icon} />
              </svg>
            </div>
            <p className="text-3xl font-black tracking-tight text-gray-900">{item.value}</p>
            <p className="mt-2 text-sm font-medium text-gray-400">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
