// src/app/dept-head/monthly-analysis/client-components/PeriodFilter.tsx
"use client"

import { useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
]

export default function PeriodFilter({ selectedMonth, selectedYear }: { selectedMonth: string; selectedYear: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const currentYear = new Date().getFullYear()
  const yearOptions = [currentYear - 2, currentYear - 1, currentYear]

  const handleFilterChange = (type: 'month' | 'year', value: string) => {
    const params = new URLSearchParams()
    params.set('month', type === 'month' ? value : selectedMonth)
    params.set('year', type === 'year' ? value : selectedYear)
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <div className="flex items-center gap-2 w-full md:w-auto">
      {isPending && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
      <Select value={selectedMonth} onValueChange={(val) => handleFilterChange('month', val)} disabled={isPending}>
        <SelectTrigger className="w-[150px] bg-white">
          <SelectValue placeholder="Pilih Bulan" />
        </SelectTrigger>
        <SelectContent>
          {MONTH_NAMES.map((name, idx) => (
            <SelectItem key={idx + 1} value={(idx + 1).toString()}>{name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={selectedYear} onValueChange={(val) => handleFilterChange('year', val)} disabled={isPending}>
        <SelectTrigger className="w-[110px] bg-white">
          <SelectValue placeholder="Tahun" />
        </SelectTrigger>
        <SelectContent>
          {yearOptions.map((y) => (
            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}