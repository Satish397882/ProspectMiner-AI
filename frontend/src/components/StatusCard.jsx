export default function StatusCard({ title, value, icon }) {
  return (
    <div className="bg-[#1f2b47] rounded-2xl shadow p-6 border border-[#45f3ff33]">
      <div className="flex items-center justify-between mb-3">
        <p className="text-gray-400 text-sm">{title}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
}
