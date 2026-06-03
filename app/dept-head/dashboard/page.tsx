// src/app/dept-head/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

export default async function DeptHeadDashboard(props: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  // FIX: Unwrap searchParams menggunakan await (Aturan Next.js 15)
  const searchParams = await props.searchParams;
  const supabase = await createClient()

  // Autentikasi
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  // Setup Default Rentang Tanggal (Hari Ini)
  const today = new Date().toISOString().split('T')[0]
  const from = searchParams?.from || today
  const to = searchParams?.to || today

  // 1. PULL DATA KPI (Statis Bulan Ini)
  const dateObj = new Date()
  const firstDayOfMonth = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1).toISOString().split('T')[0]
  const lastDayOfMonth = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0).toISOString().split('T')[0]

  const { data: monthLogs } = await supabase
    .from('production_logs')
    .select('qty_in, qty_out_ok, qty_out_ng')
    .gte('date', firstDayOfMonth)
    .lte('date', lastDayOfMonth)

  // 2. PULL DATA TABEL & GRAFIK (Berdasarkan Rentang Tanggal)
  const { data: logs } = await supabase
    .from('production_logs')
    .select(`
      id, date, shift, stock_awal, qty_in, qty_out_ok, qty_out_ng, operator_name,
      master_parts!part_id ( part_name, part_type, part_number ),
      users!leader_id ( full_name )
    `)
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: true })
    .order('shift', { ascending: true })

  // 3. PULL MASTER DATA (Untuk Opsi Filter Part)
  const { data: masterParts } = await supabase.from('master_parts').select('part_name, part_type')

  // Server Action untuk Log Out
  async function handleLogout() {
    'use server'
    const supabaseClient = await createClient()
    await supabaseClient.auth.signOut()
    redirect('/login')
  }

  return (
    <DashboardClient
      monthLogs={monthLogs || []}
      filteredLogs={logs || []}
      masterParts={masterParts || []}
      initialFrom={from}
      initialTo={to}
      handleLogout={handleLogout}
    />
  )
}