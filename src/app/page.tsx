import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <header className="w-full bg-blue-600 text-white p-4 shadow-md flex justify-between items-center">
        <h1 className="text-xl font-bold">Next.js ERP Dashboard</h1>
        <div className="text-sm">Store ID: 01 (Shimla)</div>
      </header>

      <main className="flex-1 w-full max-w-6xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Mock Sales Register */}
        <section className="col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">New Sale Transaction</h2>
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded border flex justify-between">
              <span>Paracetamol 500mg (Batch A1)</span>
              <span>₹45.00</span>
            </div>
            <div className="p-3 bg-gray-50 rounded border flex justify-between">
              <span>22K Gold Chain (10g)</span>
              <span>₹75,000.00</span>
            </div>
          </div>
          <div className="mt-8 pt-4 border-t flex justify-between items-end">
            <div className="text-gray-500 text-sm">CGST: ₹1125 | SGST: ₹1125</div>
            <div className="text-2xl font-bold text-green-600">Total: ₹75,045</div>
          </div>
          <button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md font-semibold transition-colors">
            Complete Sale
          </button>
        </section>

        {/* Mock Controls */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">System Status</h2>
          <div className="space-y-4 text-sm text-gray-700">
            <p>✅ Database: Ready (Pending Railway Auth)</p>
            <p>✅ Offline Provider: Initialized</p>
            <p>✅ GST Engine: Active (State: 02)</p>
          </div>
        </section>
      </main>
    </div>
  );
}
