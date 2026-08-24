export function SkeletonCard({ className = "" }) {
  return (
    <div
      className={`rounded-2xl p-6 overflow-hidden ${className}`}
      style={{
        background: "rgba(15,28,50,0.7)",
        border: "1px solid rgba(99,148,210,0.08)",
      }}
    >
      <div className="shimmer h-3 rounded-lg w-2/3 mb-4" />
      <div className="shimmer h-9 rounded-lg w-1/2 mb-3" />
      <div className="shimmer h-2.5 rounded-lg w-full" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "rgba(15,28,50,0.7)",
        border: "1px solid rgba(99,148,210,0.08)",
      }}
    >
      <div
        className="h-11 shimmer"
        style={{ borderBottom: "1px solid rgba(99,148,210,0.06)" }}
      />
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 px-4 py-3.5"
          style={{ borderBottom: "1px solid rgba(99,148,210,0.04)" }}
        >
          <div className="shimmer h-4 rounded-lg w-1/4" />
          <div className="shimmer h-4 rounded-lg w-1/5" />
          <div className="shimmer h-4 rounded-lg w-1/6" />
          <div className="shimmer h-4 rounded-lg w-1/6" />
          <div className="shimmer h-4 rounded-lg w-14 ml-auto" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonText({ lines = 3 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="shimmer h-4 rounded-lg"
          style={{ width: `${100 - i * 15}%` }}
        />
      ))}
    </div>
  );
}

