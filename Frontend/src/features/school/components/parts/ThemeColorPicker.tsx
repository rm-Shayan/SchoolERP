interface ThemeColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

const PRESETS = [
  '#163576', '#1d4ed8', '#4f46e5', '#7c3aed',
  '#0d9488', '#059669', '#dc2626', '#ea580c',
];

export function ThemeColorPicker({ value, onChange }: ThemeColorPickerProps) {
  const normalized = value.toLowerCase();
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2.5">
        {PRESETS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            aria-label={`Set theme color ${color}`}
            className={`w-9 h-9 rounded-full transition-transform hover:scale-110 ${
              normalized === color
                ? 'ring-2 ring-offset-2 ring-primary-500 scale-110'
                : 'ring-1 ring-black/10'
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
        <label className="relative w-9 h-9 rounded-full border border-dashed border-gray-300 flex items-center justify-center cursor-pointer text-gray-400 hover:text-gray-600 overflow-hidden">
          <input
            type="color"
            value={normalized.startsWith('#') ? normalized : '#2563eb'}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </label>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded border border-gray-200" style={{ backgroundColor: value }} />
        <p className="text-xs text-gray-500">
          Brand color — <span className="font-mono uppercase">{value}</span> (sidebar, header &amp; accents)
        </p>
      </div>
    </div>
  );
}
