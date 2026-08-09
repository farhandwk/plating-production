// src/app/dept-head/monthly-analysis/client-components/PerformanceClient.tsx
"use client"

import React, { useMemo } from 'react'
import { Target, BarChart3, Package, CheckCircle2, TrendingUp } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

type MasterPart = {
  part_name: string
  part_type: string | null
  target?: number
}

type MonthLog = {
  qty_out_ok: number | null
  master_parts: { part_name: string; part_type: string | null } | { part_name: string; part_type: string | null }[] | null
}

export default function PerformanceClient({
  monthLogs,
  masterParts,
  periodName,
}: {
  monthLogs: MonthLog[]
  masterParts: MasterPart[]
  periodName: string
}) {

  // --- KALKULASI ACHIEVEMENT PER PART ---
  const achievementPerPart = useMemo(() => {
    const partMap: Record<string, any> = {}

    // 1. Inisialisasi data dari masterParts
    masterParts.forEach((p) => {
      if (p.part_name) {
        partMap[p.part_name] = {
          part_name: p.part_name,
          part_type: p.part_type,
          // TODO: Ganti '10000' dengan 'p.target' jika sudah ada di database
          target: p.target || 10000,
          qty_ok: 0,
        }
      }
    })

    // 2. Akumulasi jumlah Qty OK dari monthLogs
    monthLogs.forEach((log) => {
      const pName = Array.isArray(log.master_parts) ? log.master_parts[0]?.part_name : log.master_parts?.part_name
      if (pName && partMap[pName]) {
        partMap[pName].qty_ok += (log.qty_out_ok || 0)
      }
    })

    // 3. Hitung persentase dan urutkan
    return Object.values(partMap).map((item: any) => {
      const percentage = item.target > 0 ? (item.qty_ok / item.target) * 100 : 0
      return {
        ...item,
        achievement: percentage
      }
    }).sort((a, b) => b.achievement - a.achievement)
  }, [monthLogs, masterParts])

  // --- KALKULASI SUMMARY TOTAL KESELURUHAN ---
  const totalTargetKeseluruhan = achievementPerPart.reduce((sum, item) => sum + item.target, 0)
  const totalAktualKeseluruhan = achievementPerPart.reduce((sum, item) => sum + item.qty_ok, 0)
  const averageAchievement = totalTargetKeseluruhan > 0
    ? ((totalAktualKeseluruhan / totalTargetKeseluruhan) * 100).toFixed(1)
    : "0.0"

  return (
    <div className="space-y-6">

      {/* SECTION HEADER */}
      <div className="flex items-center gap-2">
        <BarChart3 className="w-6 h-6 text-indigo-600" />
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Analisis Pencapaian Produksi
        </h2>
      </div>
      <p className="text-slate-500 text-sm -mt-4">
        Laporan evaluasi komprehensif membandingkan target produksi vs aktual per komponen pada periode{' '}
        <strong className="text-slate-700">{periodName || 'Bulan Ini'}</strong>.
      </p>

      {/* SUMMARY CARDS KESELURUHAN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Target Produksi</p>
                <p className="text-3xl font-bold text-slate-900">{totalTargetKeseluruhan.toLocaleString('id-ID')}</p>
                <p className="text-xs text-slate-500">Unit (Seluruh Part)</p>
              </div>
              <div className="p-3 bg-slate-100 rounded-lg"><Target className="w-6 h-6 text-slate-600" /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Total Aktual (OK)</p>
                <p className="text-3xl font-bold text-emerald-600">{totalAktualKeseluruhan.toLocaleString('id-ID')}</p>
                <p className="text-xs text-slate-500">Unit Barang Jadi</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg"><CheckCircle2 className="w-6 h-6 text-emerald-600" /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-0 opacity-60"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Rata-Rata Pencapaian</p>
                <p className="text-3xl font-bold text-indigo-700">{averageAchievement}%</p>
                <p className="text-xs text-slate-500">Keseluruhan Pabrik</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-lg"><TrendingUp className="w-6 h-6 text-indigo-600" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABEL DETAIL PER PART */}
      <Card className="shadow-sm border-slate-200 bg-white">
        <CardHeader className="bg-white border-b border-slate-100 pb-5 pt-6">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-slate-800" />
            <CardTitle className="text-lg">Detail Pencapaian per Komponen (Part)</CardTitle>
          </div>
          <CardDescription>Visualisasi pencapaian produksi diurutkan dari performa tertinggi ke terendah.</CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="w-full text-sm text-left text-slate-600">
              <TableHeader className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                <TableRow>
                  <TableHead className="px-6 py-4 font-bold">Identitas Part</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-center">Target (Pcs)</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-center text-emerald-600">Aktual OK</TableHead>
                  <TableHead className="px-6 py-4 font-bold w-2/5">Status Pencapaian (Achievement)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {achievementPerPart.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-slate-500">Belum ada data komponen produksi.</TableCell>
                  </TableRow>
                ) : (
                  achievementPerPart.map((item: any, idx: number) => {
                    const achValue = Number(item.achievement.toFixed(1));

                    const barColor =
                      achValue >= 100 ? "bg-emerald-500" :
                      achValue >= 80 ? "bg-indigo-500" :
                      achValue >= 50 ? "bg-amber-400" : "bg-red-500";

                    const textColor =
                      achValue >= 100 ? "text-emerald-700" :
                      achValue >= 80 ? "text-indigo-700" :
                      achValue >= 50 ? "text-amber-700" : "text-red-700";

                    return (
                      <TableRow key={idx} className="hover:bg-slate-50/70 border-b border-slate-50 last:border-0 transition-colors">
                        <TableCell className="px-6 py-4 border-r border-slate-50">
                          <div className="font-bold text-slate-800 text-sm">{item.part_name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{item.part_type}</div>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-center font-medium text-slate-600">
                          {item.target.toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-center font-bold text-emerald-600 bg-emerald-50/20">
                          {item.qty_ok.toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-full bg-slate-100 rounded-full h-3 shadow-inner">
                              <div
                                className={cn("h-3 rounded-full transition-all duration-1000", barColor)}
                                style={{ width: `${Math.min(achValue, 100)}%` }}
                              ></div>
                            </div>
                            <span className={cn("font-bold text-sm min-w-[50px] text-right", textColor)}>
                              {achValue}%
                            </span>
                          </div>
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