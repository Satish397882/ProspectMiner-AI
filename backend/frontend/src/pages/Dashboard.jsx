import StatusCard from "../components/StatusCard"

export default function Dashboard() {
  return (
    <div className="p-6">
      {/* Page title */}
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* ✅ RESPONSIVE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatusCard title="Total Jobs" value="12" />
        <StatusCard title="Running Jobs" value="2" />
        <StatusCard title="Leads Collected" value="1,240" />
      </div>
    </div>
  )
}