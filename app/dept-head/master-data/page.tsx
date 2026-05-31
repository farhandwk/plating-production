// src/app/dept-head/master-data/page.tsx
import { createClient } from '@/lib/supabase/server'
import MasterDataClient from '@/components/features/MasterDataClient'

export default async function MasterDataPage() {
  const supabase = await createClient()

  // Ambil data master_parts dan urutkan berdasarkan nama kategori, lalu spesifikasinya
  const { data: parts, error } = await supabase
    .from('master_parts')
    .select('id, part_name, part_type, part_number')
    .order('part_name', { ascending: true })
    .order('part_type', { ascending: true })

  if (error) {
    console.error('Error fetching master parts:', error.message)
  }

  return (
    <div className="space-y-6">
      
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manajemen Master Data</h1>
        <p className="text-slate-500 text-sm mt-1">Kelola direktori material yang digunakan dalam proses produksi.</p>
      </div>

      {/* Oper data dari server ke komponen klien */}
      <MasterDataClient initialParts={parts || []} />
      
    </div>
  )
}