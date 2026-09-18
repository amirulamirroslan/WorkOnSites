export default function StatNumber({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="font-display text-lg font-semibold">{value}</p>
      <p className="text-white/50 text-xs">{label}</p>
    </div>
  );
}
