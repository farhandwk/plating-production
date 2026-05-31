// src/app/(auth)/login/page.tsx
'use client'

import { login, type ActionState } from '@/actions/auth'
import { useActionState } from 'react'

// Import Shadcn UI Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const initialState: ActionState = { error: '' }

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, initialState)

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-sm">
        
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-bold text-slate-800">
            Portal Produksi Plating
          </CardTitle>
          <CardDescription>
            Masuk ke sistem untuk mengakses dasbor
          </CardDescription>
        </CardHeader>

        <CardContent>
          {state?.error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md">
              {state.error}
            </div>
          )}

          <form action={formAction} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Pengguna</Label>
              <Input
                id="email"
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="Masukkan email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                name="password"
                required
                autoComplete="current-password"
                placeholder="Masukkan password"
              />
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full py-6 text-sm font-semibold"
            >
              {isPending ? 'MEMPROSES LOG IN...' : 'MASUK SISTEM'}
            </Button>
          </form>
        </CardContent>
        
      </Card>
    </div>
  )
}