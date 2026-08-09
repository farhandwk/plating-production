// src/app/dept-head/monthly-analysis/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MonthlyAnalysisClient from './client-components/PerformanceClient'
import ShiftComparisonClient from './client-components/ShiftComparisonClient'
import PeriodFilter from './client-components/PeriodFilter'

export default async function MonthlyAnalysisPage(props: {
  searchParams: Promise<{ month?: string; year?: string }>
}) {
  const searchParams = await props.searchParams
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const currentDate = new Date()
  const currentMonth = (currentDate.getMonth() + 1).toString()
  const currentYear = currentDate.getFullYear().toString()

  const monthStr = searchParams?.month || currentMonth
  const yearStr = searchParams?.year || currentYear

  const monthNum = parseInt(monthStr, 10)
  const yearNum = parseInt(yearStr, 10)

  const firstDayOfMonth = new Date(yearNum, monthNum - 1, 1).toISOString().split('T')[0]
  const lastDayOfMonth = new Date(yearNum, monthNum, 0).toISOString().split('T')[0]

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ]
  const periodName = `${monthNames[monthNum - 1]} ${yearNum}`

  // 1. PULL DATA PRODUKSI untuk Achievement per Part
  const { data: monthLogs } = await supabase
    .from('production_logs')
    .select(`
      qty_out_ok,
      master_parts!part_id ( part_name, part_type )
    `)
    .gte('date', firstDayOfMonth)
    .lte('date', lastDayOfMonth)
    .gt('qty_out_ok', 0) // <-- typo diperbaiki

  // 2. PULL MASTER DATA
  const { data: masterParts } = await supabase
    .from('master_parts')
    .select('part_name, part_type')

  // 3. PULL DATA untuk Shift/Leader Comparison
  const { data: shiftLogs } = await supabase
    .from('production_logs')
    .select('shift, leader_name, target, qty_out_ok, qty_out_ng')
    .gte('date', firstDayOfMonth)
    .lte('date', lastDayOfMonth)
    .not('qty_in', 'is', null)

  return (
    <div className="space-y-6 p-4 md:p-6 pb-10 bg-slate-50/50 min-h-screen">
      {/* HEADER + FILTER — satu-satunya sumber kontrol periode untuk kedua tabel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Analisis Produksi Bulanan
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Periode: <strong className="text-slate-700">{periodName}</strong>
          </p>
        </div>
        <PeriodFilter selectedMonth={monthStr} selectedYear={yearStr} />
      </div>

      <MonthlyAnalysisClient
        monthLogs={monthLogs || []}
        masterParts={masterParts || []}
        periodName={periodName}
      />

      <ShiftComparisonClient
        logs={shiftLogs || []}
        periodName={periodName}
      />
    </div>
  )
}