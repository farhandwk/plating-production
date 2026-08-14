// src/app/dept-head/monthly-analysis/client-components/StockCoverageClient.tsx
"use client"

import React, { useMemo } from 'react'
import { PackageSearch, AlertOctagon, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

type StockCoverageRow = {
  part_id: string
  part_name: string
  part_type: string | null
  current_stock: number
  avg_daily_consumption: number
  days_of_supply: number | null
}

// Ambang batas urgensi — bisa disesuaikan dengan kebijakan departemen
const THRESHOLD_CRITICAL = 3 // hari
const THRESHOLD_WARNING = 7  // hari

export default function StockCoverageClient({ data }: { data: StockCoverageRow[] }) {

  // Urutkan dari yang paling kritis (days_of_supply terkecil) ke atas.
  // Part tanpa data konsumsi (null) diletakkan di paling bawah — bukan berarti aman,
  // tapi memang tidak bisa dihitung karena tidak ada aktivitas keluar dalam rentang lookback.
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      if (a.days_of_supply === null) return 1
      if (b.days_of_supply === null) return -1
      return a.days_of_supply - b.days_of_supply
    })
  }, [data])

  const criticalCount = data.filter(d => d.days_of_supply !== null && d.days_of_supply < THRESHOLD_CRITICAL).length
  const warningCount = data.filter(d => d.days_of_supply !== null && d.days_of_supply >= THRESHOLD_CRITICAL && d.days_of_supply < THRESHOLD_WARNING).length

  return (
    <div className="space-y-6">

      {/* SECTION HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <PackageSearch className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Stock Coverage (Days of Supply)
            </h2>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Estimasi berapa hari stok saat ini akan bertahan, berdasarkan rata-rata konsumsi 14 hari terakhir.
          </p>
        </div>

        {/* Ringkasan urgensi */}
        {(criticalCount > 0 || warningCount > 0) && (
          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full">
                <AlertOctagon className="w-3.5 h-3.5" />
                {criticalCount} Part Kritis
              </span>
            )}
            {warningCount > 0 && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
                <AlertTriangle className="w-3.5 h-3.5" />
                {warningCount} Perlu Perhatian
              </span>
            )}
          </div>
        )}
      </div>

      {/* TABEL DETAIL */}
      <Card className="shadow-sm border-slate-200 bg-white">
        <CardHeader className="bg-white border-b border-slate-100 pb-5 pt-6">
          <CardTitle className="text-lg">Detail per Komponen</CardTitle>
          <CardDescription>
            Diurutkan dari yang paling mendesak (hari tersisa paling sedikit).
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="w-full text-sm text-left text-slate-600">
              <TableHeader className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                <TableRow>
                  <TableHead className="px-6 py-4 font-bold">Identitas Part</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-center">Stok Saat Ini</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-center">Rata² Konsumsi/Hari</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-center w-1/4">Days of Supply</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                      Belum ada data part.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedData.map((item) => {
                    const dos = item.days_of_supply

                    let status: { label: string; icon: React.ReactNode; badgeClass: string; textClass: string }
                    if (dos === null) {
                      status = {
                        label: 'Tidak Ada Konsumsi',
                        icon: <HelpCircle className="w-3.5 h-3.5" />,
                        badgeClass: 'bg-slate-100 text-slate-500 border-slate-200',
                        textClass: 'text-slate-400',
                      }
                    } else if (dos < THRESHOLD_CRITICAL) {
                      status = {
                        label: 'Kritis',
                        icon: <AlertOctagon className="w-3.5 h-3.5" />,
                        badgeClass: 'bg-red-50 text-red-700 border-red-200',
                        textClass: 'text-red-700',
                      }
                    } else if (dos < THRESHOLD_WARNING) {
                      status = {
                        label: 'Perlu Perhatian',
                        icon: <AlertTriangle className="w-3.5 h-3.5" />,
                        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
                        textClass: 'text-amber-700',
                      }
                    } else {
                      status = {
                        label: 'Aman',
                        icon: <ShieldCheck className="w-3.5 h-3.5" />,
                        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                        textClass: 'text-emerald-700',
                      }
                    }

                    return (
                      <TableRow key={item.part_id} className="hover:bg-slate-50/70 border-b border-slate-50 last:border-0 transition-colors">
                        <TableCell className="px-6 py-4 border-r border-slate-50">
                          <div className="font-bold text-slate-800 text-sm">{item.part_name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{item.part_type}</div>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-center font-medium text-slate-600">
                          {item.current_stock.toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-center text-slate-500">
                          {item.avg_daily_consumption > 0 ? item.avg_daily_consumption.toFixed(1) : '—'}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-center">
                          <span className={cn("text-lg font-extrabold", status.textClass)}>
                            {dos !== null ? dos : '—'}
                          </span>
                          {dos !== null && <span className="text-xs text-slate-400 ml-1">hari</span>}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-center">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border",
                            status.badgeClass
                          )}>
                            {status.icon}
                            {status.label}
                          </span>
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