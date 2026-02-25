export default function Navbar() {
  return (
    <nav className="h-14 border-b border-gray-700 bg-[#162447] flex items-center px-6 justify-between">
      <span className="font-bold text-lg text-white">ProspectMiner AI</span>
      <div className="flex gap-6 text-sm">
        <a
          href="/"
          className="text-gray-300 hover:text-[#45f3ff] transition-colors"
        >
          Dashboard
        </a>
        <a
          href="/create"
          className="text-gray-300 hover:text-[#45f3ff] transition-colors"
        >
          Create Job
        </a>
        <a
          href="/history"
          className="text-gray-300 hover:text-[#45f3ff] transition-colors"
        >
          History
        </a>
      </div>
    </nav>
  );
}
