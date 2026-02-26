import StatusCard from "../components/StatusCard";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#0f1221] p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Welcome Back!</h1>
        <p className="text-gray-400 mt-1">ProspectMiner overview</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatusCard title="Total Jobs" value="12" />
        <StatusCard title="Running Jobs" value="2" />
        <StatusCard title="Leads Collected" value="1,240" />
      </div>
      <div className="bg-[#1f2b47] rounded-2xl p-6">
        <h2 className="text-white font-bold text-xl mb-4">Quick Actions</h2>
        <div className="flex gap-4">
          <a
            href="/create"
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium"
          >
            Create New Job
          </a>
          <a
            href="/history"
            className="bg-gray-700 text-gray-300 px-6 py-3 rounded-xl font-medium"
          >
            View History
          </a>
        </div>
      </div>
    </div>
  );
}
