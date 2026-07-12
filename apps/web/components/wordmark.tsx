/** Text wordmark matching the logo's navy + teal; safe on light and dark themes. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={`font-bold tracking-tight ${className ?? ""}`}>
      Issue<span className="text-teal-500">Fit</span>
    </span>
  );
}
