interface Props {
  emoji: string;
  title: string;
  desc: string;
}

export default function DayOffBanner({ emoji, title, desc }: Props) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center">
      <p className="mb-3 text-4xl">{emoji}</p>
      <p className="text-lg font-bold text-gray-700">{title}</p>
      <p className="mt-1 text-sm text-gray-400">{desc}</p>
    </div>
  );
}