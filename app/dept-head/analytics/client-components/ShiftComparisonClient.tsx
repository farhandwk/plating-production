// src/app/dept-head/monthly-analysis/client-components/ShiftComparisonClient.tsx
"use client"

import React, { useMemo, useState } from 'react'
import { Users, Clock3, AlertTriangle, TrendingUp, Crown, Target, CheckCircle2, XCircle } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type LogRow = {
  shift: number
  leader_name: string | null
  target: number | null
  qty_out_ok: number | null
  qty_out_ng: number | null
}

type ComparisonMode = 'leader' | 'shift'

type AggregatedRow = {
  key: string
  totalTarget: number
  totalOk: number
  totalNg: number
  achievement: number
  rejectRate: number
}

const SHIFT_LABELS: Record<number, string> = {
  1: 'Shift 1',
  2: 'Shift 2',
  3: 'Shift 3',
}

const SHIFT_TIME: Record<number, string> = {
  1: '06:00 – 14:00',
  2: '14:00 – 22:00',
  3: '22:00 – 06:00',
}

export default function ShiftComparisonClient({
  logs,
  periodName,
}: {
  logs: LogRow[]
  periodName: string
}) {
  const [mode, setMode] = useState<ComparisonMode>('leader')

  // Sumber data (logs) sama persis untuk kedua mode — agregasi dijalankan sekali di awal,
  // toggle cuma memilih hasil mana yang ditampilkan. Perpindahan mode jadi instan.
  const aggregatedByLeader = useMemo(() => aggregateLogs(logs, (log) => log.leader_name || 'Tanpa Leader'), [logs])
  const aggregatedByShift = useMemo(
    () => aggregateLogs(logs, (log) => SHIFT_LABELS[log.shift] || `Shift ${log.shift}`),
    [logs]
  )

  const activeData = mode === 'leader' ? aggregatedByLeader : aggregatedByShift
  const topAchievement = activeData.length > 0 ? activeData[0].achievement : 0

  return (
    <div className="space-y-6">

      {/* SECTION HEADER + TOGGLE MODE */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Perbandingan Performa
            </h2>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Pencapaian target & kualitas output — <strong className="text-slate-700">{periodName || 'Bulan Ini'}</strong>
          </p>
        </div>

        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          <button
            onClick={() => setMode('leader')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors",
              mode === 'leader' ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Users className="w-4 h-4" />
            Per Group (Leader)
          </button>
          <button
            onClick={() => setMode('shift')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors",
              mode === 'shift' ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Clock3 className="w-4 h-4" />
            Per Shift
          </button>
        </div>
      </div>

      {/* GRID CARD 3 KOLOM */}
      {activeData.length === 0 ? (
        <Card className="shadow-sm border-slate-200 bg-white">
          <CardContent className="h-40 flex items-center justify-center text-slate-500 text-sm">
            Belum ada data produksi pada periode ini.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {activeData.map((item, idx) => (
            <PerformanceCard
              key={item.key}
              item={item}
              mode={mode}
              isTop={item.achievement === topAchievement && topAchievement > 0}
              rank={idx + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// --- CARD INDIVIDUAL PER LEADER/SHIFT ---
function PerformanceCard({
  item,
  mode,
  isTop,
  rank,
}: {
  item: AggregatedRow
  mode: ComparisonMode
  isTop: boolean
  rank: number
}) {
  const achValue = Number(item.achievement.toFixed(1))
  const rejectValue = Number(item.rejectRate.toFixed(2))
  const clampedAch = Math.min(achValue, 100)

  const tier =
    achValue >= 100 ? 'excellent' :
    achValue >= 80 ? 'good' :
    achValue >= 50 ? 'warning' : 'critical'

  const tierStyles: Record<string, { ring: string; bar: string; text: string; badgeBg: string; badgeText: string }> = {
    excellent: { ring: 'text-emerald-500', bar: 'bg-emerald-500', text: 'text-emerald-700', badgeBg: 'bg-emerald-50', badgeText: 'text-emerald-700' },
    good: { ring: 'text-indigo-500', bar: 'bg-indigo-500', text: 'text-indigo-700', badgeBg: 'bg-indigo-50', badgeText: 'text-indigo-700' },
    warning: { ring: 'text-amber-500', bar: 'bg-amber-500', text: 'text-amber-700', badgeBg: 'bg-amber-50', badgeText: 'text-amber-700' },
    critical: { ring: 'text-red-500', bar: 'bg-red-500', text: 'text-red-700', badgeBg: 'bg-red-50', badgeText: 'text-red-700' },
  }
  const style = tierStyles[tier]

  // Lingkaran progress achievement (radial)
  const radius = 30
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (clampedAch / 100) * circumference

  const Icon = mode === 'leader' ? Users : Clock3
  const subtitle = mode === 'shift' && SHIFT_TIME[Number(item.key.replace('Shift ', ''))]
    ? SHIFT_TIME[Number(item.key.replace('Shift ', ''))]
    : mode === 'leader' ? 'Group Leader' : null

  return (
    <Card
      className={cn(
        "relative overflow-hidden border-slate-200 shadow-sm transition-all hover:shadow-md",
        isTop && "border-indigo-300 ring-1 ring-indigo-200"
      )}
    >
      {/* Aksen top performer */}
      {isTop && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-indigo-500 to-indigo-600" />
      )}

      <CardContent className="p-5 space-y-5">

        {/* HEADER: identitas + badge top performer */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
              isTop ? "bg-indigo-600" : "bg-slate-100"
            )}>
              <Icon className={cn("w-5 h-5", isTop ? "text-white" : "text-slate-600")} />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm leading-tight">{item.key}</p>
              {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>

          {isTop && (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
              <Crown className="w-3 h-3" />
              Top
            </span>
          )}
        </div>

        {/* RADIAL PROGRESS + ACHIEVEMENT */}
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 shrink-0">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 72 72">
              <circle cx="36" cy="36" r={radius} fill="none" stroke="currentColor" strokeWidth="7" className="text-slate-100" />
              <circle
                cx="36" cy="36" r={radius} fill="none" stroke="currentColor" strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className={cn(style.ring, "transition-all duration-1000")}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn("text-lg font-extrabold", style.text)}>{achValue}%</span>
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-slate-500"><Target className="w-3.5 h-3.5" /> Target</span>
              <span className="font-semibold text-slate-700">{item.totalTarget.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-slate-500"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Qty OK</span>
              <span className="font-semibold text-emerald-600">{item.totalOk.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-slate-500"><XCircle className="w-3.5 h-3.5 text-red-400" /> Qty NG</span>
              <span className="font-semibold text-red-500">{item.totalNg.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        {/* FOOTER: reject rate badge */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <span className="text-xs text-slate-400">Reject Rate</span>
          <span
            className={cn(
              "flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full",
              rejectValue > 5 ? "bg-red-50 text-red-600" :
              rejectValue > 2 ? "bg-amber-50 text-amber-600" :
              "bg-slate-50 text-slate-500"
            )}
          >
            {rejectValue > 5 && <AlertTriangle className="w-3 h-3" />}
            {rejectValue}%
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

// --- HELPER: Agregasi generik, dipakai untuk kedua mode ---
function aggregateLogs(logs: LogRow[], keyFn: (log: LogRow) => string): AggregatedRow[] {
  const map: Record<string, { totalTarget: number; totalOk: number; totalNg: number }> = {}

  logs.forEach((log) => {
    const key = keyFn(log)
    if (!map[key]) {
      map[key] = { totalTarget: 0, totalOk: 0, totalNg: 0 }
    }
    map[key].totalTarget += log.target || 0
    map[key].totalOk += log.qty_out_ok || 0
    map[key].totalNg += log.qty_out_ng || 0
  })

  return Object.entries(map)
    .map(([key, val]) => {
      const totalOutput = val.totalOk + val.totalNg
      const achievement = val.totalTarget > 0 ? (val.totalOk / val.totalTarget) * 100 : 0
      const rejectRate = totalOutput > 0 ? (val.totalNg / totalOutput) * 100 : 0
      return { key, ...val, achievement, rejectRate }
    })
    .sort((a, b) => b.achievement - a.achievement)
}