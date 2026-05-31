// src/components/features/StockHistoryTable.tsx
import { createClient } from '@/lib/supabase/server'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default async function StockHistoryTable() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Ambil tanggal hari ini (Format YYYY-MM-DD)
  const today = new Date().toISOString().split('T')[0]

  // Tarik data log hari ini milik leader yang sedang login
  const { data: logs, error } = await supabase
    .from('production_logs')
    .select(`
      id,
      shift,
      qty_in,
      qty_out_ok,
      qty_out_ng,
      created_at,
      master_parts (
        part_name,
        part_type
      )
    `)
    .eq('leader_id', user.id)
    .eq('date', today)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching history:', error.message)
    return <div className="text-red-500 text-sm">Gagal memuat riwayat produksi.</div>
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center p-8 bg-white border border-slate-200 rounded-lg text-slate-500 text-sm">
        Belum ada material yang direkam pada hari ini.
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[80px] whitespace-nowrap">Shift</TableHead>
              <TableHead className="min-w-[150px]">Material</TableHead>
              <TableHead className="text-center whitespace-nowrap">IN</TableHead>
              <TableHead className="text-center whitespace-nowrap">OUT (OK)</TableHead>
              <TableHead className="text-center whitespace-nowrap">OUT (NG)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => {
              // Supabase join array handling (bisa berupa objek tunggal atau array)
              const part = Array.isArray(log.master_parts) ? log.master_parts[0] : log.master_parts;
              
              return (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">
                    <Badge variant="outline" className="bg-slate-100 text-slate-700">
                      S{log.shift}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-slate-800 text-sm">
                      {part?.part_name || 'Unknown'}
                    </div>
                    <div className="text-xs text-slate-500">
                      {part?.part_type || '-'}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-bold text-blue-600">{log.qty_in > 0 ? log.qty_in : '-'}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-bold text-emerald-600">{log.qty_out_ok > 0 ? log.qty_out_ok : '-'}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-bold text-red-600">{log.qty_out_ng > 0 ? log.qty_out_ng : '-'}</span>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}