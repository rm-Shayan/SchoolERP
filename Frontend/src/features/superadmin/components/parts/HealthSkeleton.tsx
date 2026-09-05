export default function HealthSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-gray-100 rounded-lg animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[0, 1].map((i) => (
          <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
