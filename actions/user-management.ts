// src/actions/user-management.ts
'use server'

import { createClient } from '@/lib/supabase/server'

export async function toggleUserStatus(userId: string, currentStatus: boolean) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('users')
    .update({ 
      is_active: !currentStatus, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', userId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function updateUserRole(userId: string, newRole: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('users')
    .update({ 
      role: newRole, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', userId)

  if (error) return { error: error.message }
  return { success: true }
}