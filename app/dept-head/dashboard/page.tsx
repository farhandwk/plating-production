// src/app/dept-head/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Activity, Package, CheckCircle2, AlertTriangle, TrendingDown } from 'lucide-react'

export default async function DeptHeadDashboard() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: logs, error } = await supabase
    .from('production_logs')
    .select(`
      id,
      shift,
      stock_awal,
      qty_in,
      qty_out_ok,
      qty_out_ng,
      master_parts ( part_name, part_type, part_number ),
      users!production_logs_leader_id_fkey ( full_name )
    `)
    .eq('date', today)
    .order('shift', { ascending: true })

  if (error) {
    console.error('Error fetching dashboard data:', error.message)
  }

  const safeLogs = logs || []

  // KALKULASI KPI (Key Performance Indicators) HARI INI
  const totalIn = safeLogs.reduce((sum, log) => sum + log.qty_in, 0)
  const totalOutOk = safeLogs.reduce((sum, log) => sum + log.qty_out_ok, 0)
  const totalOutNg = safeLogs.reduce((sum, log) => sum + log.qty_out_ng, 0)
  
  const totalProduction = totalOutOk + totalOutNg
  // Menghindari pembagian dengan nol (NaN)
  const defectRate = totalProduction > 0 ? ((totalOutNg / totalProduction) * 100).toFixed(1) : "0.0"

  return (
    <div className="space-y-6">
      
      {/* HEADER DASBOR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Monitoring Produksi Harian</h1>
          <p className="text-slate-500 text-sm mt-1">Pemantauan stok dan pergerakan material aktual.</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-full">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Live System</span>
        </div>
      </div>

      {/* KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500">Total Material Masuk</p>
                <p className="text-2xl font-bold text-slate-900">{totalIn}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-md">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500">Total Produksi OK</p>
                <p className="text-2xl font-bold text-emerald-600">{totalOutOk}</p>
              </div>
              <div className="p-2 bg-emerald-50 rounded-md">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500">Total Barang Cacat</p>
                <p className="text-2xl font-bold text-red-600">{totalOutNg}</p>
              </div>
              <div className="p-2 bg-red-50 rounded-md">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500">Defect Rate (NG)</p>
                <p className="text-2xl font-bold text-amber-600">{defectRate}%</p>
              </div>
              <div className="p-2 bg-amber-50 rounded-md">
                <TrendingDown className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABEL MATRIKS */}
      <Card className="shadow-sm border-slate-200 overflow-hidden">
        <CardHeader className="bg-white border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">Matriks Stok & Kualitas</CardTitle>
          </div>
          <CardDescription>Data terakumulasi per shift untuk tanggal: <strong className="text-slate-700">{today}</strong></CardDescription>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead className="w-[80px] text-center">Shift</TableHead>
                  <TableHead className="min-w-[200px]">Identitas Part</TableHead>
                  <TableHead className="text-center font-semibold text-slate-600">Stok Awal</TableHead>
                  <TableHead className="text-center font-bold text-blue-600 bg-blue-50/50">IN</TableHead>
                  <TableHead className="text-center font-bold text-emerald-600 bg-emerald-50/50">OUT (OK)</TableHead>
                  <TableHead className="text-center font-bold text-red-600 bg-red-50/50">OUT (NG)</TableHead>
                  <TableHead className="text-center font-bold text-slate-900 bg-slate-100">SISA STOK</TableHead>
                  <TableHead className="min-w-[150px]">Operator</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-slate-500">
                      Belum ada pergerakan material yang dicatat pada hari ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  safeLogs.map((log) => {
                    const part = Array.isArray(log.master_parts) ? log.master_parts[0] : log.master_parts;
                    const user = Array.isArray(log.users) ? log.users[0] : log.users;
                    const sisaStok = log.stock_awal + log.qty_in - log.qty_out_ok - log.qty_out_ng;

                    return (
                      <TableRow key={log.id} className="hover:bg-slate-50 transition-colors">
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-white font-bold">
                            S{log.shift}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-slate-800">{part?.part_name}</div>
                          <div className="text-xs text-slate-500">{part?.part_type} ({part?.part_number})</div>
                        </TableCell>
                        <TableCell className="text-center text-slate-600 font-medium">
                          {log.stock_awal}
                        </TableCell>
                        <TableCell className="text-center text-blue-700 font-bold bg-blue-50/30">
                          {log.qty_in}
                        </TableCell>
                        <TableCell className="text-center text-emerald-700 font-bold bg-emerald-50/30">
                          {log.qty_out_ok}
                        </TableCell>
                        <TableCell className="text-center text-red-700 font-bold bg-red-50/30">
                          {log.qty_out_ng}
                        </TableCell>
                        <TableCell className="text-center text-lg font-black text-slate-800 bg-slate-50">
                          {sisaStok}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {user?.full_name || 'Unknown'}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}