// src/app/leader/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import StockInputForm from '@/components/features/StockInputForm'
import StockHistoryTable from '@/components/features/StockHistoryTable'

// Import Shadcn Alert
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShieldAlert } from 'lucide-react' // Pastikan lucide-react terinstall, bawaan shadcn

export default async function LeaderDashboard() {
  const supabase = await createClient()

  const { data: masterParts, error } = await supabase
    .from('master_parts')
    .select('id, part_name, part_type, part_number')
    .order('part_name', { ascending: true })

  if (error) {
    console.error('Gagal memuat master parts:', error.message)
  }

  return (
    <div className="space-y-6 pb-12">
      
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Unified Production Panel</h1>
          <p className="text-sm text-slate-500">Sistem Digitalisasi Produksi dan Monitoring Stok</p>
        </div>
      </div>

      {/* NOTIFIKASI POKA-YOKE (RLS) */}
      <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-800">
        <ShieldAlert className="h-4 w-4 stroke-amber-600" />
        <AlertTitle className="text-amber-800 font-bold">Aturan Integritas Data Aktif</AlertTitle>
        <AlertDescription className="text-amber-700/90 text-xs sm:text-sm mt-1">
          Data yang telah direkam tidak dapat dihapus atau diubah secara mandiri. Apabila terjadi kesalahan *input*, segera laporkan ke **Dept Head** untuk proses koreksi.
        </AlertDescription>
      </Alert>
      
      {/* FORM INPUT UTAMA */}
      <StockInputForm masterParts={masterParts || []} />

      {/* TABEL RIWAYAT HARI INI */}
      <div className="pt-4">
        <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">
          Riwayat Input Anda (Hari Ini)
        </h2>
        <StockHistoryTable />
      </div>

    </div>
  )
}