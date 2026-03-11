export default function NewInvoicePage() {
  return (
    <div className="p-6">
      <div className="border-b border-[#1e1d24] pb-4 mb-6">
        <h1 className="text-2xl font-bold text-white">New Invoice</h1>
        <p className="text-[#8a8695] text-sm mt-0.5">Create a new billing invoice</p>
      </div>
      <div className="bg-[#1a1920] border border-[#2a2836] rounded-2xl p-12 flex flex-col items-center justify-center text-center">
        <div className="text-5xl mb-4">📄</div>
        <div className="text-lg font-semibold text-white mb-2">Invoice Builder</div>
        <div className="text-sm text-[#8a8695]">Coming soon — or use the POS for quick sales.</div>
        <a href="/pos" className="mt-4 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-6 py-2 rounded-xl text-sm transition-colors">
          Open POS Instead →
        </a>
      </div>
    </div>
  );
}
