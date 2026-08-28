export default function PageLoader() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-primary-50/40 flex items-center justify-center">
      <div className="relative h-28 w-28">
        <span className="absolute inset-0 rounded-[30px] border-2 border-primary-100" />
        <span
          className="absolute inset-0 rounded-[30px] border-[2.5px] border-transparent border-t-primary-600 border-r-primary-400 border-b-primary-300 animate-spin"
          style={{ animationDuration: '1s' }}
        />
        <img
          src="/screen.png"
          alt=""
          className="absolute inset-2.5 rounded-[22px] object-contain p-1.5"
        />
      </div>
    </div>
  );
}
