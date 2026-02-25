export default function Navbar() {
  return (
    <nav className="h-14 border-b flex items-center px-6 justify-between">
      <span className="font-bold text-lg">ProspectMiner AI</span>
      <div className="flex gap-4 text-sm">
        <a href="/">Dashboard</a>
        <a href="/create">Create Job</a>
        <a href="/history">History</a>
      </div>
    </nav>
  )
}