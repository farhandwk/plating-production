// src/app/dept-head/dashboard/DashboardClient.tsx
"use client"

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { Printer, FileSpreadsheet, Share2, LogOut, Package, CheckCircle2, AlertTriangle, TrendingDown, Activity, BarChart3, Calendar as CalendarIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts'
import { cn } from '@/lib/utils'

// Palet warna kontras tinggi untuk multi-part bar chart
const CHART_COLORS = [
  '#10b981', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', 
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
]

export default function DashboardClient({ monthLogs, filteredLogs, masterParts, initialFrom, initialTo, handleLogout }: any) {
  const router = useRouter()
  
  // State Filter
  const [fromDate, setFromDate] = useState(initialFrom)
  const [toDate, setToDate] = useState(initialTo)
  const [partNameFilter, setPartNameFilter] = useState('all')
  const [partTypeFilter, setPartTypeFilter] = useState('all')

  // State visibilitas part (dikontrol via klik pada Legend)
  const [hiddenParts, setHiddenParts] = useState<Record<string, boolean>>({})

  const isSingleDay = fromDate === toDate

  // Ekstrak Part Unik untuk Dropdown Filter
  const uniquePartNames = useMemo(() => Array.from(new Set(masterParts.map((p: any) => p.part_name).filter(Boolean))).sort(), [masterParts])
  const uniquePartTypes = useMemo(() => Array.from(new Set(masterParts.map((p: any) => p.part_type).filter(Boolean))).sort(), [masterParts])

  // --- KALKULASI KPI BULANAN ---
  const totalIn = monthLogs.reduce((sum: number, log: any) => sum + (log.qty_in || 0), 0)
  const totalOutOk = monthLogs.reduce((sum: number, log: any) => sum + (log.qty_out_ok || 0), 0)
  const totalOutNg = monthLogs.reduce((sum: number, log: any) => sum + (log.qty_out_ng || 0), 0)
  const totalProduction = totalOutOk + totalOutNg
  const defectRate = totalProduction > 0 ? ((totalOutNg / totalProduction) * 100).toFixed(1) : "0.0"

  // --- EKSTRAK DAFTAR PART YANG AKTIF SEBAGAI MULTI-LINE/BAR ---
  const activeParts = useMemo(() => {
    const parts = new Set<string>()
    filteredLogs.forEach((log: any) => {
      const pName = Array.isArray(log.master_parts) ? log.master_parts[0]?.part_name : log.master_parts?.part_name
      const pType = Array.isArray(log.master_parts) ? log.master_parts[0]?.part_type : log.master_parts?.part_type
      const matchName = partNameFilter === 'all' || pName === partNameFilter
      const matchType = partTypeFilter === 'all' || pType === partTypeFilter
      
      if (matchName && matchType && pName) {
        parts.add(pName)
      }
    })
    return Array.from(parts).sort()
  }, [filteredLogs, partNameFilter, partTypeFilter])

  // --- PEMROSESAN DATA GRAFIK KOMBINASI ---
  const chartData = useMemo(() => {
    const map: Record<string, any> = {}
    
    filteredLogs.forEach((log: any) => {
      const pName = Array.isArray(log.master_parts) ? log.master_parts[0]?.part_name : log.master_parts?.part_name
      const pType = Array.isArray(log.master_parts) ? log.master_parts[0]?.part_type : log.master_parts?.part_type
      
      const matchName = partNameFilter === 'all' || pName === partNameFilter
      const matchType = partTypeFilter === 'all' || pType === partTypeFilter
      if (!matchName || !matchType) return

      if (!map[log.date]) {
        map[log.date] = { date: log.date, totalOK: 0 }
      }

      // 1. Kumpulkan nilai agregat tunggal untuk Grafik 1 (Line Chart OK)
      map[log.date].totalOK += log.qty_out_ok || 0

      // 2. Kumpulkan nilai per komponen untuk Grafik 2 & 3 (Bar Chart)
      if (pName) {
        if (!map[log.date][`${pName}_IN`]) map[log.date][`${pName}_IN`] = 0
        if (!map[log.date][`${pName}_NG`]) map[log.date][`${pName}_NG`] = 0
        map[log.date][`${pName}_IN`] += log.qty_in || 0
        map[log.date][`${pName}_NG`] += log.qty_out_ng || 0
      }
    })

    return Object.values(map).sort((a: any, b: any) => a.date.localeCompare(b.date))
  }, [filteredLogs, partNameFilter, partTypeFilter])

  // --- HANDLER EVENT ---
  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setFromDate(val)
    if (val && toDate) router.push(`?from=${val}&to=${toDate}`)
  }

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setToDate(val)
    if (fromDate && val) router.push(`?from=${fromDate}&to=${val}`)
  }

  const handleLegendClick = (e: any) => {
    const partName = e.value
    setHiddenParts(prev => ({ ...prev, [partName]: !prev[partName] }))
  }

  return (
    <div className="space-y-6 p-4 md:p-0 pb-10">
      
      {/* HEADER UTAMA & LOGOUT */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm md:bg-transparent md:p-0 md:border-none md:shadow-none">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Pusat Komando Produksi</h1>
          <p className="text-slate-500 text-xs md:text-sm mt-1">Pemantauan matriks, performa grafik, dan unduhan laporan harian.</p>
        </div>
        
        <div className="flex flex-row items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-full h-10 w-full sm:w-auto">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Live System</span>
          </div>

          <form action={handleLogout} className="w-full sm:w-auto">
            <Button type="submit" variant="destructive" className="h-10 w-full shadow-sm">
              <LogOut className="w-4 h-4 mr-2" /> Log Out
            </Button>
          </form>
        </div>
      </div>

      {/* KPI BULANAN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-slate-200 bg-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bulan Ini</p>
                <p className="text-sm font-medium text-slate-600">Material Masuk</p>
                <p className="text-2xl font-bold text-slate-900">{totalIn}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-md"><Package className="w-5 h-5 text-blue-600" /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 bg-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Bulan Ini</p>
                <p className="text-sm font-medium text-slate-600">Produksi OK</p>
                <p className="text-2xl font-bold text-emerald-600">{totalOutOk}</p>
              </div>
              <div className="p-2 bg-emerald-50 rounded-md"><CheckCircle2 className="w-5 h-5 text-emerald-600" /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 bg-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-xs font-bold text-red-400 uppercase tracking-wider">Bulan Ini</p>
                <p className="text-sm font-medium text-slate-600">Barang Cacat (NG)</p>
                <p className="text-2xl font-bold text-red-600">{totalOutNg}</p>
              </div>
              <div className="p-2 bg-red-50 rounded-md"><AlertTriangle className="w-5 h-5 text-red-600" /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 bg-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Bulan Ini</p>
                <p className="text-sm font-medium text-slate-600">Defect Rate</p>
                <p className="text-2xl font-bold text-amber-600">{defectRate}%</p>
              </div>
              <div className="p-2 bg-amber-50 rounded-md"><TrendingDown className="w-5 h-5 text-amber-600" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PANEL FILTER (Kaku Vertikal di Mobile & Tablet demi Keamanan Layout) */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
          <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="w-5 h-5 text-indigo-600"/> Kontrol Filter Visual</CardTitle>
          <CardDescription>Rentang tanggal mengontrol Tabel & Grafik. Part Name/Type hanya mengontrol Grafik.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 flex flex-col lg:flex-row gap-5 items-stretch lg:items-end bg-white">
          
          <div className="flex flex-col space-y-1.5 w-full lg:w-1/3">
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
              <CalendarIcon className="w-3 h-3" /> Rentang Tanggal
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
              <input type="date" value={fromDate} onChange={handleFromChange} className="flex h-10 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
              <span className="text-slate-400 text-xs font-bold text-center uppercase sm:normal-case">s/d</span>
              <input type="date" value={toDate} onChange={handleToChange} className="flex h-10 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div className="flex flex-col space-y-1.5 w-full lg:w-1/3">
            <label className="text-xs font-bold text-slate-500 uppercase">Part Name (Grafik)</label>
            <Select value={partNameFilter} onValueChange={setPartNameFilter}>
              <SelectTrigger className="border-slate-300 text-slate-700 h-10">
                <SelectValue placeholder="Pilih Part Name" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">-- Semua Part Name --</SelectItem>
                {uniquePartNames.map((name: any) => <SelectItem key={name} value={name}>{name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col space-y-1.5 w-full lg:w-1/3">
            <label className="text-xs font-bold text-slate-500 uppercase">Part Type (Grafik)</label>
            <Select value={partTypeFilter} onValueChange={setPartTypeFilter}>
              <SelectTrigger className="border-slate-300 text-slate-700 h-10">
                <SelectValue placeholder="Pilih Part Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">-- Semua Part Type --</SelectItem>
                {uniquePartTypes.map((type: any) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

        </CardContent>
      </Card>

      {/* KANVAS VISUALISASI GRAFIK (Wajib Vertikal Penuh di Semua Device) */}
      <div className="flex flex-col space-y-6">
        
        {/* GRAFIK 1: TOTAL BARANG OK (LINE CHART AGREGAT TUNGGAL) */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-emerald-700 flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> Tren Volume Total Produksi OK</CardTitle>
            <CardDescription>Grafik tren kumulatif harian seluruh komponen aktif yang memenuhi filter.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{fontSize: 10}} tickFormatter={(val) => { try { return format(parseISO(val), 'dd/MM') } catch { return val } }} />
                <YAxis tick={{fontSize: 10}} />
                <RechartsTooltip contentStyle={{fontSize: '12px', borderRadius: '8px'}} />
                <Line type="monotone" dataKey="totalOK" name="Total Unit OK" stroke="#10b981" strokeWidth={3.5} dot={{ r: 4, fill: "#10b981" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* GRAFIK 2: MATERIAL MASUK / IN (ADAPTIVE BAR CHART) */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-700 flex items-center gap-2"><Package className="w-4 h-4"/> Detail Distribusi Material Masuk (IN)</CardTitle>
            <CardDescription>Format: {isSingleDay ? 'Grouped Bar (Perbandingan Berdampingan)' : 'Stacked Bar (Akumulasi Komposisi Bertumpuk)'}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{fontSize: 10}} tickFormatter={(val) => { try { return format(parseISO(val), 'dd/MM') } catch { return val } }} />
                <YAxis tick={{fontSize: 10}} />
                <RechartsTooltip contentStyle={{fontSize: '12px', borderRadius: '8px'}} />
                <Legend onClick={handleLegendClick} wrapperStyle={{ cursor: 'pointer', fontSize: '11px', paddingTop: '8px' }} />
                {activeParts.map((part, index) => (
                  <Bar key={part} hide={hiddenParts[part]} dataKey={`${part}_IN`} name={part} stackId={isSingleDay ? undefined : "a"} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* GRAFIK 3: BARANG CACAT / NG (ADAPTIVE BAR CHART) */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-700 flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> Detail Distribusi Barang Cacat (NG)</CardTitle>
            <CardDescription>Format: {isSingleDay ? 'Grouped Bar (Perbandingan Berdampingan)' : 'Stacked Bar (Akumulasi Komposisi Bertumpuk)'}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{fontSize: 10}} tickFormatter={(val) => { try { return format(parseISO(val), 'dd/MM') } catch { return val } }} />
                <YAxis tick={{fontSize: 10}} />
                <RechartsTooltip contentStyle={{fontSize: '12px', borderRadius: '8px'}} />
                <Legend onClick={handleLegendClick} wrapperStyle={{ cursor: 'pointer', fontSize: '11px', paddingTop: '8px' }} />
                {activeParts.map((part, index) => (
                  <Bar key={part} hide={hiddenParts[part]} dataKey={`${part}_NG`} name={part} stackId={isSingleDay ? undefined : "a"} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>

      {/* TABEL DATABASE PRODUKSI */}
      <Card className="shadow-sm border-slate-200 overflow-hidden">
        <CardHeader className="bg-white border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-slate-800" />
            <CardTitle className="text-lg">Detail Database Produksi</CardTitle>
          </div>
          <CardDescription>Menampilkan log dari tanggal <strong className="text-slate-700">{initialFrom}</strong> hingga <strong className="text-slate-700">{initialTo}</strong>.</CardDescription>
        </CardHeader>
        
        <CardContent className="p-0 bg-white">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead className="w-[100px] text-center font-bold text-slate-700">Tanggal</TableHead>
                  <TableHead className="w-[80px] text-center">Shift</TableHead>
                  <TableHead className="min-w-[200px]">Identitas Part</TableHead>
                  <TableHead className="text-center font-semibold text-slate-600">Stok Awal</TableHead>
                  <TableHead className="text-center font-bold text-blue-600 bg-blue-50/50">IN</TableHead>
                  <TableHead className="text-center font-bold text-emerald-600 bg-emerald-50/50">OUT (OK)</TableHead>
                  <TableHead className="text-center font-bold text-red-600 bg-red-50/50">OUT (NG)</TableHead>
                  <TableHead className="text-center font-bold text-slate-900 bg-slate-100">SISA STOK</TableHead>
                  <TableHead className="min-w-[120px]">Leader</ TableHead>
                  <TableHead className="min-w-[120px]">Operator</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-32 text-center text-slate-500 text-sm">Belum ada pergerakan material yang dicatat pada rentang tanggal ini.</TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log: any) => {
                    const part = Array.isArray(log.master_parts) ? log.master_parts[0] : log.master_parts
                    const user = Array.isArray(log.users) ? log.users[0] : log.users
                    const sisaStok = log.stock_awal + log.qty_in - log.qty_out_ok - log.qty_out_ng

                    return (
                      <TableRow key={log.id} className="hover:bg-slate-50 transition-colors">
                        <TableCell className="text-center text-xs font-medium text-slate-600 border-r border-slate-100">{log.date}</TableCell>
                        <TableCell className="text-center"><Badge variant="outline" className="bg-white font-bold text-xs">S{log.shift}</Badge></TableCell>
                        <TableCell>
                          <div className="font-bold text-slate-800 text-sm">{part?.part_name}</div>
                          <div className="text-[11px] text-slate-500">{part?.part_type} ({part?.part_number})</div>
                        </TableCell>
                        <TableCell className="text-center text-slate-600 font-medium text-sm">{log.stock_awal}</TableCell>
                        <TableCell className="text-center text-blue-700 font-bold bg-blue-50/30 text-sm">{log.qty_in}</TableCell>
                        <TableCell className="text-center text-emerald-700 font-bold bg-emerald-50/30 text-sm">{log.qty_out_ok}</TableCell>
                        <TableCell className="text-center text-red-700 font-bold bg-red-50/30 text-sm">{log.qty_out_ng}</TableCell>
                        <TableCell className="text-center text-base font-black text-slate-800 bg-slate-50 border-x border-slate-100">{sisaStok}</TableCell>
                        <TableCell className="text-sm text-slate-600 font-medium">{user?.full_name || '-'}</TableCell>
                        <TableCell className="text-sm text-slate-600">{log.operator_name || '-'}</TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* KUMPULAN TOMBOL AKSI UNDUH LAPORAN (Sesuai Struktur Paling Bawah) */}
      <div className="flex flex-col sm:flex-row flex-wrap items-center justify-end gap-3 pt-2">
        <div className="flex flex-col items-center w-full sm:w-auto">
          <Button disabled={!isSingleDay} asChild={isSingleDay} className={cn("w-full h-10 shadow-sm", isSingleDay ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-slate-100 text-slate-400")}>
            {isSingleDay ? (
              <a href={`/api/export/pdf-harian?date=${initialFrom}`}>
                <Printer className="w-4 h-4 mr-2" /> Cetak PDF Harian
              </a>
            ) : (
              <div className="cursor-not-allowed flex items-center">
                <Printer className="w-4 h-4 mr-2" /> Cetak PDF Harian
              </div>
            )}
          </Button>
          {!isSingleDay && <span className="text-[10px] text-red-500 font-bold mt-1 text-center">! Hanya untuk filter 1 hari</span>}
        </div>

        <Button onClick={() => alert("Fitur Download Excel sedang dalam tahap pengembangan.")} variant="outline" className="h-10 w-full sm:w-auto border-emerald-200 text-emerald-700 hover:bg-emerald-50">
          <FileSpreadsheet className="w-4 h-4 mr-2" /> Download Excel
        </Button>

        <Button onClick={() => alert("Fitur Forward WhatsApp sedang dalam tahap pengembangan.")} variant="outline" className="h-10 w-full sm:w-auto border-green-200 text-green-700 hover:bg-green-50">
          <Share2 className="w-4 h-4 mr-2" /> Forward WhatsApp
        </Button>
      </div>

    </div>
  )
}